import SunCalc from 'suncalc';
import type { Location } from './locations';
import horizonProfiles from '../data/horizon-profiles.json';

const FLAT_HORIZON_DEG = -0.833;
const GOLDEN_HOUR_ALT_DEG = 6;
const CIVIL_TWILIGHT_ALT_DEG = -6;

interface HorizonPoint {
  azimuth: number;
  deg: number;
}

interface HorizonProfile {
  elevation: number;
  profile: HorizonPoint[];
}

const profiles = horizonProfiles as Record<string, HorizonProfile>;

export interface PhotoSunTimes {
  date: Date;
  solarNoon: Date;
  astronomicalSunrise: Date;
  astronomicalSunset: Date;
  effectiveSunrise: Date;
  effectiveSunset: Date;
  morningGoldenHourStart: Date;
  morningGoldenHourEnd: Date;
  eveningGoldenHourStart: Date;
  eveningGoldenHourEnd: Date;
  morningBlueHourStart: Date;
  morningBlueHourEnd: Date;
  eveningBlueHourStart: Date;
  eveningBlueHourEnd: Date;
  eveningGoldenHourBlockedByTerrain: boolean;
  morningGoldenHourBlockedByTerrain: boolean;
}

function altitudeDeg(date: Date, lat: number, lng: number): number {
  const pos = SunCalc.getPosition(date, lat, lng);
  return (pos.altitude * 180) / Math.PI;
}

/** Sun azimuth as a compass bearing (0=N, 90=E, 180=S, 270=W). SunCalc's own
 * azimuth is measured from south, so we rotate it by 180deg. */
function compassAzimuthDeg(date: Date, lat: number, lng: number): number {
  const pos = SunCalc.getPosition(date, lat, lng);
  const suncalcDeg = (pos.azimuth * 180) / Math.PI;
  return (suncalcDeg + 180 + 360) % 360;
}

/** Linearly interpolates the DEM horizon-elevation angle at a compass bearing
 * from a profile sampled at even azimuth steps. */
function interpolateHorizonDeg(profile: HorizonPoint[], bearingDeg: number): number {
  const step = 360 / profile.length;
  const idx = ((bearingDeg % 360) + 360) % 360 / step;
  const i0 = Math.floor(idx) % profile.length;
  const i1 = (i0 + 1) % profile.length;
  const frac = idx - Math.floor(idx);
  return profile[i0].deg + frac * (profile[i1].deg - profile[i0].deg);
}

/** Finds the time the sun's altitude crosses `targetDeg`, searching the
 * morning (ascending) or evening (descending) branch around solar noon. */
function findAltitudeCrossing(
  solarNoon: Date,
  lat: number,
  lng: number,
  targetDeg: number,
  branch: 'morning' | 'evening'
): Date {
  const stepMs = 60 * 1000;
  const searchHours = 14;

  if (branch === 'morning') {
    let cursor = new Date(solarNoon.getTime() - searchHours * 3600 * 1000);
    let prevAlt = altitudeDeg(cursor, lat, lng);
    while (cursor < solarNoon) {
      const next = new Date(cursor.getTime() + stepMs);
      const alt = altitudeDeg(next, lat, lng);
      if (prevAlt < targetDeg && alt >= targetDeg) {
        const frac = (targetDeg - prevAlt) / (alt - prevAlt);
        return new Date(cursor.getTime() + frac * stepMs);
      }
      prevAlt = alt;
      cursor = next;
    }
    return solarNoon;
  }

  let cursor = new Date(solarNoon);
  let prevAlt = altitudeDeg(cursor, lat, lng);
  const end = new Date(solarNoon.getTime() + searchHours * 3600 * 1000);
  while (cursor < end) {
    const next = new Date(cursor.getTime() + stepMs);
    const alt = altitudeDeg(next, lat, lng);
    if (prevAlt >= targetDeg && alt < targetDeg) {
      const frac = (prevAlt - targetDeg) / (prevAlt - alt);
      return new Date(cursor.getTime() + frac * stepMs);
    }
    prevAlt = alt;
    cursor = next;
  }
  return end;
}

/**
 * Finds when the sun disappears behind (morning: rises above) the real DEM
 * skyline rather than the flat astronomical horizon. The horizon angle
 * depends on the sun's azimuth, which itself shifts as the crossing time
 * shifts, so this iterates a few times to converge (azimuth moves slowly
 * near sunrise/sunset, so 3 passes settle to well under a minute).
 */
function findTerrainCrossing(
  solarNoon: Date,
  lat: number,
  lng: number,
  profile: HorizonPoint[] | null,
  branch: 'morning' | 'evening'
): Date {
  let time = findAltitudeCrossing(solarNoon, lat, lng, FLAT_HORIZON_DEG, branch);
  if (!profile) return time;

  for (let i = 0; i < 3; i++) {
    const bearing = compassAzimuthDeg(time, lat, lng);
    const horizonDeg = Math.max(interpolateHorizonDeg(profile, bearing), FLAT_HORIZON_DEG);
    const next = findAltitudeCrossing(solarNoon, lat, lng, horizonDeg, branch);
    if (Math.abs(next.getTime() - time.getTime()) < 30_000) {
      time = next;
      break;
    }
    time = next;
  }
  return time;
}

/**
 * Computes golden/blue hour windows for a given day and location, adjusted
 * for the location's real DEM-derived horizon (mountain ridges shorten
 * direct light in a valley well before the flat-horizon/astronomical
 * sunset — see scripts/fetch-horizon-profiles.mjs).
 */
export function getPhotoSunTimes(date: Date, location: Location): PhotoSunTimes {
  const { lat, lon } = location;
  const times = SunCalc.getTimes(date, lat, lon);
  const solarNoon = times.solarNoon;
  const profile = profiles[location.slug]?.profile ?? null;

  const effectiveSunrise = findTerrainCrossing(solarNoon, lat, lon, profile, 'morning');
  const effectiveSunset = findTerrainCrossing(solarNoon, lat, lon, profile, 'evening');

  const morningGoldenHourEndAstro = findAltitudeCrossing(solarNoon, lat, lon, GOLDEN_HOUR_ALT_DEG, 'morning');
  const eveningGoldenHourStartAstro = findAltitudeCrossing(solarNoon, lat, lon, GOLDEN_HOUR_ALT_DEG, 'evening');

  const morningGoldenHourBlockedByTerrain = effectiveSunrise >= morningGoldenHourEndAstro;
  const eveningGoldenHourBlockedByTerrain = eveningGoldenHourStartAstro >= effectiveSunset;

  const morningGoldenHourStart = effectiveSunrise;
  const morningGoldenHourEnd = morningGoldenHourBlockedByTerrain ? effectiveSunrise : morningGoldenHourEndAstro;

  const eveningGoldenHourStart = eveningGoldenHourBlockedByTerrain ? effectiveSunset : eveningGoldenHourStartAstro;
  const eveningGoldenHourEnd = effectiveSunset;

  return {
    date,
    solarNoon,
    astronomicalSunrise: times.sunrise,
    astronomicalSunset: times.sunset,
    effectiveSunrise,
    effectiveSunset,
    morningGoldenHourStart,
    morningGoldenHourEnd,
    eveningGoldenHourStart,
    eveningGoldenHourEnd,
    morningBlueHourStart: findAltitudeCrossing(solarNoon, lat, lon, CIVIL_TWILIGHT_ALT_DEG, 'morning'),
    morningBlueHourEnd: times.sunrise,
    eveningBlueHourStart: times.sunset,
    eveningBlueHourEnd: findAltitudeCrossing(solarNoon, lat, lon, CIVIL_TWILIGHT_ALT_DEG, 'evening'),
    eveningGoldenHourBlockedByTerrain,
    morningGoldenHourBlockedByTerrain,
  };
}

export function formatTime(date: Date, timeZone = 'Europe/Ljubljana'): string {
  return new Intl.DateTimeFormat('sl-SI', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(date);
}

export function formatDate(date: Date, timeZone = 'Europe/Ljubljana'): string {
  return new Intl.DateTimeFormat('sl-SI', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  }).format(date);
}

/** Returns `days` consecutive dates starting today (midday UTC to dodge DST edge cases). */
export function upcomingDays(days: number): Date[] {
  const today = new Date();
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 10, 0, 0);
  return Array.from({ length: days }, (_, i) => new Date(base + i * 24 * 3600 * 1000));
}
