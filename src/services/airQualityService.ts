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

export interface FetchAirQualityOptions {
  forceRefresh?: boolean;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
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
    const mem = memoryCache.get(city.id);
    if (mem && Date.now() < mem.expiresAt) {
      return mem.reading;
    }
    const sess = readSessionCache(city.id);
    if (sess) {
      memoryCache.set(city.id, sess);
      return sess.reading;
    }
  }

  const existing = !forceRefresh && !options?.signal ? inflightRequests.get(city.id) : undefined;
  if (existing) {
    return existing;
  }

  const runFetch = async (): Promise<AirReading> => {
    const fetchImpl = options?.fetchImpl ?? fetch;
    const timeoutMs = options?.timeoutMs ?? OPEN_METEO_TIMEOUT_MS;
    const controller = new AbortController();
    const externalSignal = options?.signal;
    const onExternalAbort = () => controller.abort();
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url =
        'https://air-quality-api.open-meteo.com/v1/air-quality' +
        `?latitude=${city.lat}&longitude=${city.lon}` +
        '&current=us_aqi,pm2_5,pm10&hourly=us_aqi,pm2_5,pm10&forecast_days=2&timezone=auto';
      const res = await fetchImpl(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as {
        current?: { us_aqi?: unknown; pm2_5?: unknown; pm10?: unknown };
        hourly?: { time?: unknown; us_aqi?: unknown; pm2_5?: unknown; pm10?: unknown };
      };

      const rawAqi = Number(data?.current?.us_aqi ?? city.fallbackAqi);
      const rawPm25 = Number(data?.current?.pm2_5 ?? city.fallbackPm25);
      const rawPm10 = Number(data?.current?.pm10 ?? city.fallbackPm10);
      const currentAqi = Number.isFinite(rawAqi) ? Math.min(MAX_AQI, Math.max(0, Math.round(rawAqi))) : city.fallbackAqi;
      const currentPm25 = Number.isFinite(rawPm25) ? Math.max(0, Math.round(rawPm25)) : city.fallbackPm25;
      const currentPm10 = Number.isFinite(rawPm10) ? Math.max(0, Math.round(rawPm10)) : city.fallbackPm10;

      const times: string[] = Array.isArray(data?.hourly?.time) ? (data.hourly.time as string[]) : [];
      const aqis: number[] = Array.isArray(data?.hourly?.us_aqi) ? (data.hourly.us_aqi as number[]) : [];
      const pm25s: number[] = Array.isArray(data?.hourly?.pm2_5) ? (data.hourly.pm2_5 as number[]) : [];
      const pm10s: number[] = Array.isArray(data?.hourly?.pm10) ? (data.hourly.pm10 as number[]) : [];

      const nowMs = Date.now() - 3600 * 1000;
      const hourly: HourlyPoint[] = [];
      for (let i = 0; i < times.length && hourly.length < 24; i++) {
        const dt = new Date(times[i]);
        if (Number.isNaN(dt.getTime()) || dt.getTime() < nowMs) continue;
        const hAqi = Number(aqis[i] ?? currentAqi);
        const hPm25 = Number(pm25s[i] ?? currentPm25);
        const hPm10 = Number(pm10s[i] ?? currentPm10);
        hourly.push({
          timeIso: dt.toISOString(),
          hourLabel: formatHourLabel(dt),
          hour24: dt.getHours(),
          aqi: Number.isFinite(hAqi) ? Math.min(MAX_AQI, Math.max(0, Math.round(hAqi))) : currentAqi,
          pm25: Number.isFinite(hPm25) ? Math.max(0, Math.round(hPm25)) : currentPm25,
          pm10: Number.isFinite(hPm10) ? Math.max(0, Math.round(hPm10)) : currentPm10,
        });
      }

      const reading: AirReading = {
        city,
        aqi: currentAqi,
        pm25: currentPm25,
        pm10: currentPm10,
        fetchedAtIso: new Date().toISOString(),
        source: 'live',
        hourly: hourly.length >= 6 ? hourly : buildFallbackHourly(currentAqi, currentPm25, currentPm10),
      };

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
  };

  if (!options?.signal) {
    const pending = runFetch().finally(() => {
      inflightRequests.delete(city.id);
    });
    inflightRequests.set(city.id, pending);
    return pending;
  }

  return runFetch();
}
