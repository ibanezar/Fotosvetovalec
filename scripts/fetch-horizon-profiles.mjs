#!/usr/bin/env node
/**
 * Computes a DEM-based horizon-elevation profile for each location by sampling
 * terrain elevation (Open-Meteo elevation API, Copernicus DEM GLO-90) along
 * rays in every compass direction and finding the steepest angle to the
 * skyline. Writes src/data/horizon-profiles.json, which the site reads at
 * build time instead of guessing a fixed horizon angle per location.
 *
 * Re-run this whenever a location is added or moved:
 *   node scripts/fetch-horizon-profiles.mjs
 *
 * Keep LOCATIONS below in sync with src/lib/locations.ts (slug/lat/lon).
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCATIONS = [
  { slug: 'logarska-dolina', lat: 46.39495, lon: 14.62983 },
  { slug: 'mozirje', lat: 46.33829, lon: 14.96495 },
  { slug: 'golte', lat: 46.385, lon: 14.822 },
  { slug: 'recica-ob-savinji', lat: 46.31667, lon: 14.91667 },
];

const AZIMUTH_STEP_DEG = 10;
const DISTANCES_KM = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16];
const EARTH_RADIUS_KM = 6371;
// Effective radius accounting for standard atmospheric refraction (~7/6 * R).
const EFFECTIVE_RADIUS_KM = (7 / 6) * EARTH_RADIUS_KM;
const ELEVATION_API = 'https://api.open-meteo.com/v1/elevation';
const BATCH_SIZE = 100;

/** Destination point at `distanceKm` along compass `bearingDeg` (0=N, 90=E) from (lat, lon). */
function destinationPoint(lat, lon, bearingDeg, distanceKm) {
  const R = EARTH_RADIUS_KM;
  const delta = distanceKm / R;
  const theta = (bearingDeg * Math.PI) / 180;
  const phi1 = (lat * Math.PI) / 180;
  const lambda1 = (lon * Math.PI) / 180;

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
    );

  return { lat: (phi2 * 180) / Math.PI, lon: (lambda2 * 180) / Math.PI };
}

function curvatureDropMeters(distanceKm) {
  const distanceM = distanceKm * 1000;
  return (distanceM * distanceM) / (2 * EFFECTIVE_RADIUS_KM * 1000);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, maxRetries = 6) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 429 && attempt < maxRetries) {
      const waitMs = 2000 * 2 ** attempt;
      console.log(`    rate limited, retrying in ${waitMs / 1000}s...`);
      await sleep(waitMs);
      continue;
    }
    throw new Error(`Elevation API error ${res.status}`);
  }
  throw new Error('Elevation API: exceeded retries');
}

async function fetchElevations(points) {
  const results = [];
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const chunk = points.slice(i, i + BATCH_SIZE);
    const lats = chunk.map((p) => p.lat.toFixed(5)).join(',');
    const lons = chunk.map((p) => p.lon.toFixed(5)).join(',');
    const url = `${ELEVATION_API}?latitude=${lats}&longitude=${lons}`;
    const data = await fetchWithRetry(url);
    results.push(...data.elevation);
    if (i + BATCH_SIZE < points.length) await sleep(1500);
  }
  return results;
}

async function buildProfileForLocation(location) {
  const [observerElevation] = await fetchElevations([{ lat: location.lat, lon: location.lon }]);

  const azimuths = [];
  for (let az = 0; az < 360; az += AZIMUTH_STEP_DEG) azimuths.push(az);

  const samplePoints = [];
  const sampleIndex = []; // [azimuthIndex][distanceIndex] -> flat index
  for (let ai = 0; ai < azimuths.length; ai++) {
    const row = [];
    for (let di = 0; di < DISTANCES_KM.length; di++) {
      const { lat, lon } = destinationPoint(location.lat, location.lon, azimuths[ai], DISTANCES_KM[di]);
      row.push(samplePoints.length);
      samplePoints.push({ lat, lon });
    }
    sampleIndex.push(row);
  }

  console.log(`  ${location.slug}: observer elevation ${observerElevation.toFixed(0)} m, fetching ${samplePoints.length} DEM samples...`);
  const elevations = await fetchElevations(samplePoints);

  const profile = azimuths.map((az, ai) => {
    let maxDeg = -90;
    for (let di = 0; di < DISTANCES_KM.length; di++) {
      const elev = elevations[sampleIndex[ai][di]];
      const distanceKm = DISTANCES_KM[di];
      const rise = elev - observerElevation - curvatureDropMeters(distanceKm);
      const deg = (Math.atan2(rise, distanceKm * 1000) * 180) / Math.PI;
      if (deg > maxDeg) maxDeg = deg;
    }
    return { azimuth: az, deg: Math.round(maxDeg * 10) / 10 };
  });

  return { elevation: Math.round(observerElevation), profile };
}

async function main() {
  const out = {};
  console.log('Fetching DEM horizon profiles from Open-Meteo elevation API...');
  for (const location of LOCATIONS) {
    out[location.slug] = await buildProfileForLocation(location);
    await sleep(2000);
  }

  const outPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'src',
    'data',
    'horizon-profiles.json'
  );
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
