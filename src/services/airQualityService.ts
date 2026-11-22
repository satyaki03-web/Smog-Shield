import {
  AIR_CACHE_TTL_MS,
  MAX_AQI,
  OPEN_METEO_TIMEOUT_MS,
  STORAGE_KEYS,
} from '../constants';
import { buildFallbackHourly, formatHourLabel } from '../domain/aqi';
import type { AirReading, CityInfo, HourlyPoint } from '../types';

interface CacheEntry {
  reading: AirReading;
  expiresAt: number;
}

interface OpenMeteoPayload {
  current?: { us_aqi?: unknown; pm2_5?: unknown; pm10?: unknown };
  hourly?: { time?: unknown; us_aqi?: unknown; pm2_5?: unknown; pm10?: unknown };
}

/** Optional configuration overrides for Open-Meteo air quality fetches. */
export interface FetchAirQualityOptions {
  /** Bypasses memory and session caches when true. */
  forceRefresh?: boolean;
  /** External AbortSignal used to cancel an in-flight request. */
  signal?: AbortSignal;
  /** Custom fetch implementation for unit or integration tests. */
  fetchImpl?: typeof fetch;
  /** Request timeout in milliseconds before falling back offline. */
  timeoutMs?: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<AirReading>>();

function readSessionCache(cityId: string): CacheEntry | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(`${STORAGE_KEYS.airCachePrefix}${cityId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed?.reading || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() >= parsed.expiresAt) {
      window.sessionStorage.removeItem(`${STORAGE_KEYS.airCachePrefix}${cityId}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(cityId: string, entry: CacheEntry): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.setItem(`${STORAGE_KEYS.airCachePrefix}${cityId}`, JSON.stringify(entry));
  } catch {
    // Ignore storage quota or sandbox restrictions
  }
}

function readCachedReading(cityId: string): AirReading | null {
  const mem = memoryCache.get(cityId);
  if (mem && Date.now() < mem.expiresAt) {
    return mem.reading;
  }
  const sess = readSessionCache(cityId);
  if (sess) {
    memoryCache.set(cityId, sess);
    return sess.reading;
  }
  return null;
}

function clampMetric(rawValue: unknown, fallback: number, maxBound?: number): number {
  const parsed = Number(rawValue ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.max(0, Math.round(parsed));
  return maxBound !== undefined ? Math.min(maxBound, rounded) : rounded;
}

function parseOpenMeteoHourly(
  hourlyPayload: OpenMeteoPayload['hourly'],
  currentAqi: number,
  currentPm25: number,
  currentPm10: number
): HourlyPoint[] {
  const times = Array.isArray(hourlyPayload?.time) ? (hourlyPayload.time as string[]) : [];
  const aqis = Array.isArray(hourlyPayload?.us_aqi) ? (hourlyPayload.us_aqi as unknown[]) : [];
  const pm25s = Array.isArray(hourlyPayload?.pm2_5) ? (hourlyPayload.pm2_5 as unknown[]) : [];
  const pm10s = Array.isArray(hourlyPayload?.pm10) ? (hourlyPayload.pm10 as unknown[]) : [];

  const nowMs = Date.now() - 3600 * 1000;
  const hourly: HourlyPoint[] = [];

  for (let i = 0; i < times.length && hourly.length < 24; i++) {
    const dt = new Date(times[i]);
    if (Number.isNaN(dt.getTime()) || dt.getTime() < nowMs) continue;
    hourly.push({
      timeIso: dt.toISOString(),
      hourLabel: formatHourLabel(dt),
      hour24: dt.getHours(),
      aqi: clampMetric(aqis[i], currentAqi, MAX_AQI),
      pm25: clampMetric(pm25s[i], currentPm25),
      pm10: clampMetric(pm10s[i], currentPm10),
    });
  }

  return hourly.length >= 6 ? hourly : buildFallbackHourly(currentAqi, currentPm25, currentPm10);
}

function parseOpenMeteoReading(city: CityInfo, data: OpenMeteoPayload): AirReading {
  const currentAqi = clampMetric(data.current?.us_aqi, city.fallbackAqi, MAX_AQI);
  const currentPm25 = clampMetric(data.current?.pm2_5, city.fallbackPm25);
  const currentPm10 = clampMetric(data.current?.pm10, city.fallbackPm10);

  return {
    city,
    aqi: currentAqi,
    pm25: currentPm25,
    pm10: currentPm10,
    fetchedAtIso: new Date().toISOString(),
    source: 'live',
    hourly: parseOpenMeteoHourly(data.hourly, currentAqi, currentPm25, currentPm10),
  };
}

async function fetchLiveReading(
  city: CityInfo,
  options?: FetchAirQualityOptions
): Promise<AirReading> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? OPEN_METEO_TIMEOUT_MS;
  const controller = new AbortController();
  const externalSignal = options?.signal;
  const onExternalAbort = (): void => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url =
      'https://air-quality-api.open-meteo.com/v1/air-quality' +
      `?latitude=${city.lat}&longitude=${city.lon}` +
      '&current=us_aqi,pm2_5,pm10&hourly=us_aqi,pm2_5,pm10&forecast_days=2&timezone=auto';
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as OpenMeteoPayload;
    const reading = parseOpenMeteoReading(city, data);
    const entry: CacheEntry = { reading, expiresAt: Date.now() + AIR_CACHE_TTL_MS };
    memoryCache.set(city.id, entry);
    writeSessionCache(city.id, entry);
    return reading;
  } catch {
    return buildOfflineReading(city, null);
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

/** Clears both memory and sessionStorage Open-Meteo air quality caches. */
export function clearAirCache(): void {
  memoryCache.clear();
  inflightRequests.clear();
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const keysToDelete: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(STORAGE_KEYS.airCachePrefix)) {
        keysToDelete.push(k);
      }
    }
    for (const k of keysToDelete) {
      window.sessionStorage.removeItem(k);
    }
  } catch {
    // Ignore storage restrictions
  }
}

/** Creates an offline seasonal reading for immediate display or fallback on error. */
export function buildOfflineReading(city: CityInfo, manualAqi: number | null = null): AirReading {
  if (manualAqi !== null && manualAqi >= 0 && manualAqi <= MAX_AQI) {
    const estPm25 = Math.round(manualAqi * 0.52);
    const estPm10 = Math.round(manualAqi * 0.85);
    return {
      city,
      aqi: manualAqi,
      pm25: estPm25,
      pm10: estPm10,
      fetchedAtIso: new Date().toISOString(),
      source: 'manual',
      hourly: buildFallbackHourly(manualAqi, estPm25, estPm10),
    };
  }
  return {
    city,
    aqi: city.fallbackAqi,
    pm25: city.fallbackPm25,
    pm10: city.fallbackPm10,
    fetchedAtIso: new Date().toISOString(),
    source: 'offline',
    hourly: buildFallbackHourly(city.fallbackAqi, city.fallbackPm25, city.fallbackPm10),
  };
}

/**
 * Fetches live Open-Meteo hourly AQI/PM2.5/PM10 with 10-minute memory/session caching,
 * in-flight request deduplication, AbortSignal cancellation, and offline fallback.
 */
export async function fetchAirQuality(
  city: CityInfo,
  manualAqi: number | null,
  options?: FetchAirQualityOptions
): Promise<AirReading> {
  if (manualAqi !== null && manualAqi >= 0 && manualAqi <= MAX_AQI) {
    return buildOfflineReading(city, manualAqi);
  }

  const forceRefresh = options?.forceRefresh ?? false;
  if (!forceRefresh) {
    const cached = readCachedReading(city.id);
    if (cached) return cached;
  }

  const existing = !forceRefresh && !options?.signal ? inflightRequests.get(city.id) : undefined;
  if (existing) {
    return existing;
  }

  if (!options?.signal) {
    const pending = fetchLiveReading(city, options).finally(() => {
      inflightRequests.delete(city.id);
    });
    inflightRequests.set(city.id, pending);
    return pending;
  }

  return fetchLiveReading(city, options);
}
