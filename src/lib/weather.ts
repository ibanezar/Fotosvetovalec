import type { Location } from './locations';

export interface HourlyWeather {
  time: string[];
  cloudCover: number[];
  precipProbability: number[];
  precipitation: number[];
  windSpeed: number[];
  temperature: number[];
  dewPoint: number[];
}

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';

/** Fetches hourly forecast (build-time only — the site is static, so this
 * data is as fresh as the last build; see the scheduled rebuild in
 * .github/workflows/deploy.yml). */
export async function fetchHourlyWeather(location: Location): Promise<HourlyWeather> {
  const params = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lon),
    hourly: 'cloud_cover,precipitation_probability,precipitation,wind_speed_10m,temperature_2m,dew_point_2m',
    timezone: 'Europe/Ljubljana',
    forecast_days: '7',
    past_days: '1',
    wind_speed_unit: 'kmh',
  });
  const res = await fetch(`${FORECAST_API}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Open-Meteo forecast error ${res.status}`);
  }
  const data = await res.json();
  return {
    time: data.hourly.time,
    cloudCover: data.hourly.cloud_cover,
    precipProbability: data.hourly.precipitation_probability,
    precipitation: data.hourly.precipitation,
    windSpeed: data.hourly.wind_speed_10m,
    temperature: data.hourly.temperature_2m,
    dewPoint: data.hourly.dew_point_2m,
  };
}

function ljubljanaHourParts(date: Date) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Ljubljana',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:00`;
}

function hourIndex(hourly: HourlyWeather, date: Date): number {
  return hourly.time.indexOf(ljubljanaHourParts(date));
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export interface DayWeatherSummary {
  eveningCloudCoverPct: number | null;
  eveningPrecipProbPct: number | null;
  eveningWindKmh: number | null;
  morningWindKmh: number | null;
  dewSpreadC: number | null;
  precipPast12hMm: number | null;
}

const EMPTY_SUMMARY: DayWeatherSummary = {
  eveningCloudCoverPct: null,
  eveningPrecipProbPct: null,
  eveningWindKmh: null,
  morningWindKmh: null,
  dewSpreadC: null,
  precipPast12hMm: null,
};

/** Summarizes forecast conditions around a day's golden/blue hour windows. */
export function summarizeDayWeather(
  hourly: HourlyWeather,
  eveningWindowStart: Date,
  eveningWindowEnd: Date,
  morningWindowStart: Date,
  morningWindowEnd: Date,
  sunriseTime: Date
): DayWeatherSummary {
  let startIdx = hourIndex(hourly, eveningWindowStart);
  let endIdx = hourIndex(hourly, eveningWindowEnd);
  if (startIdx === -1 || endIdx === -1) return EMPTY_SUMMARY;
  if (endIdx < startIdx) endIdx = startIdx;
  const eveningSlice = { cloud: hourly.cloudCover.slice(startIdx, endIdx + 1), precip: hourly.precipProbability.slice(startIdx, endIdx + 1), wind: hourly.windSpeed.slice(startIdx, endIdx + 1) };

  let mStartIdx = hourIndex(hourly, morningWindowStart);
  let mEndIdx = hourIndex(hourly, morningWindowEnd);
  const morningWindSlice =
    mStartIdx !== -1 && mEndIdx !== -1
      ? hourly.windSpeed.slice(mStartIdx, Math.max(mEndIdx, mStartIdx) + 1)
      : [];

  const sunriseIdx = hourIndex(hourly, sunriseTime);
  const dewSpreadC = sunriseIdx !== -1 ? hourly.temperature[sunriseIdx] - hourly.dewPoint[sunriseIdx] : null;

  let precipPast12hMm: number | null = null;
  if (sunriseIdx !== -1) {
    const from = Math.max(0, sunriseIdx - 12);
    precipPast12hMm = hourly.precipitation.slice(from, sunriseIdx).reduce((sum, v) => sum + v, 0);
  }

  return {
    eveningCloudCoverPct: eveningSlice.cloud.length ? Math.round(mean(eveningSlice.cloud)) : null,
    eveningPrecipProbPct: eveningSlice.precip.length ? Math.round(Math.max(...eveningSlice.precip)) : null,
    eveningWindKmh: eveningSlice.wind.length ? Math.round(Math.max(...eveningSlice.wind)) : null,
    morningWindKmh: morningWindSlice.length ? Math.round(Math.max(...morningWindSlice)) : null,
    dewSpreadC: dewSpreadC !== null ? Math.round(dewSpreadC * 10) / 10 : null,
    precipPast12hMm: precipPast12hMm !== null ? Math.round(precipPast12hMm * 10) / 10 : null,
  };
}
