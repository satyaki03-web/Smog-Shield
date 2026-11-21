import { useCallback, useEffect, useState } from 'react';
import { getBandInfo, getCityById } from '../domain/aqi';
import { buildOfflineReading, fetchAirQuality } from '../services/airQualityService';
import type { AirReading, UserProfile } from '../types';

export interface UseAqiDataResult {
  reading: AirReading;
  loading: boolean;
  statusMessage: string;
  refresh: () => void;
}

/**
 * Loads live Open-Meteo AQI data for the active household city, aborting any in-flight
 * request whenever the city, manual AQI override, or manual refresh changes.
 */
export function useAqiData(profile: UserProfile): UseAqiDataResult {
  const [reading, setReading] = useState<AirReading>(() =>
    buildOfflineReading(getCityById(profile.cityId), profile.manualAqi)
  );
  const [refreshTick, setRefreshTick] = useState(0);
  const requestKey = `${profile.cityId}:${profile.manualAqi ?? 'live'}:${refreshTick}`;
  const [settledKey, setSettledKey] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const city = getCityById(profile.cityId);
    const forceRefresh = refreshTick > 0;

    void fetchAirQuality(city, profile.manualAqi, {
      forceRefresh,
      signal: controller.signal,
    }).then((next) => {
      if (controller.signal.aborted) return;
      setReading(next);
      setSettledKey(requestKey);
      const band = getBandInfo(next.aqi);
      setStatusMessage(
        `${next.city.name} air quality updated: AQI ${next.aqi}, ${band.label}.`
      );
    });

    return () => {
      controller.abort();
    };
  }, [profile.cityId, profile.manualAqi, refreshTick, requestKey]);

  const refresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  return {
    reading,
    loading: settledKey !== requestKey,
    statusMessage,
    refresh,
  };
}
