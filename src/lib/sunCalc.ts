import SunCalc from 'suncalc';
import type { Location } from './locations';

const FLAT_HORIZON_DEG = -0.833;
const GOLDEN_HOUR_ALT_DEG = 6;
const CIVIL_TWILIGHT_ALT_DEG = -6;

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
 * Computes golden/blue hour windows for a given day and location, adjusted
 * for the location's horizon elevation (mountain ridges shorten direct
 * light in a valley well before the flat-horizon/astronomical sunset).
 * Horizon corrections are estimates, not DEM-derived — see location notes.
 */
export function getPhotoSunTimes(date: Date, location: Location): PhotoSunTimes {
  const { lat, lon, morningHorizonDeg, eveningHorizonDeg } = location;
  const times = SunCalc.getTimes(date, lat, lon);
  const solarNoon = times.solarNoon;

  const morningTarget = Math.max(morningHorizonDeg, FLAT_HORIZON_DEG);
  const eveningTarget = Math.max(eveningHorizonDeg, FLAT_HORIZON_DEG);

  const effectiveSunrise = findAltitudeCrossing(solarNoon, lat, lon, morningTarget, 'morning');
  const effectiveSunset = findAltitudeCrossing(solarNoon, lat, lon, eveningTarget, 'evening');

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
