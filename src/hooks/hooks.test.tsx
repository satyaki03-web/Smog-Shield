import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROFILE, STORAGE_KEYS } from '../constants';
import { clearAirCache } from '../services/airQualityService';
import type { UserProfile } from '../types';
import { useAqiData } from './useAqiData';
import { useChecklist } from './useChecklist';
import { useHouseholdProfile } from './useHouseholdProfile';

function buildOpenMeteoResponse(aqi: number, pm25: number, pm10: number): Response {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const time: string[] = [];
  const us_aqi: number[] = [];
  const pm2_5: number[] = [];
  const pm10Arr: number[] = [];
  for (let i = 0; i < 24; i++) {
    time.push(new Date(now.getTime() + i * 3600 * 1000).toISOString());
    us_aqi.push(aqi);
    pm2_5.push(pm25);
    pm10Arr.push(pm10);
  }
  return new Response(
    JSON.stringify({
      current: { us_aqi: aqi, pm2_5: pm25, pm10 },
      hourly: { time, us_aqi, pm2_5, pm10: pm10Arr },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

describe('useHouseholdProfile', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists profile updates to localStorage, reloads them, and resets cleanly', () => {
    const { result, unmount } = renderHook(() => useHouseholdProfile());
    expect(result.current.profile).toEqual(DEFAULT_PROFILE);

    const updated: UserProfile = {
      ...DEFAULT_PROFILE,
      cityId: 'kolkata',
      children: 2,
      sensitivities: ['asthma'],
      hasPurifier: true,
    };

    act(() => {
      result.current.saveProfile(updated);
    });
    expect(result.current.profile).toEqual(updated);
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toContain('"cityId":"kolkata"');
    unmount();

    const reloaded = renderHook(() => useHouseholdProfile());
    expect(reloaded.result.current.profile.cityId).toBe('kolkata');
    expect(reloaded.result.current.profile.children).toBe(2);
    expect(reloaded.result.current.profile.sensitivities).toEqual(['asthma']);

    act(() => {
      reloaded.result.current.resetProfile();
    });
    expect(reloaded.result.current.profile).toEqual(DEFAULT_PROFILE);
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });

  it('recovers gracefully from corrupt localStorage JSON or malformed fields', () => {
    window.localStorage.setItem(STORAGE_KEYS.profile, '{corrupt-json');
    const first = renderHook(() => useHouseholdProfile());
    expect(first.result.current.profile).toEqual(DEFAULT_PROFILE);
    first.unmount();

    window.localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify({ cityId: 'mumbai', sensitivities: 'not-an-array' })
    );
    const second = renderHook(() => useHouseholdProfile());
    expect(second.result.current.profile.cityId).toBe('mumbai');
    expect(second.result.current.profile.sensitivities).toEqual(DEFAULT_PROFILE.sensitivities);
  });
});

describe('useChecklist', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('toggles and persists checklist items and adopted swaps, and resets cleanly', () => {
    const { result, unmount } = renderHook(() => useChecklist());
    expect(result.current.checkedIds).toEqual([]);
    expect(result.current.adoptedSwapIds).toEqual([]);

    act(() => {
      result.current.toggleChecklistItem('chk-rwa-leaves');
      result.current.toggleAdoptedSwap('swap-commute');
    });
    expect(result.current.checkedIds).toEqual(['chk-rwa-leaves']);
    expect(result.current.adoptedSwapIds).toEqual(['swap-commute']);

    // Toggling the same item removes it
    act(() => {
      result.current.toggleChecklistItem('chk-rwa-leaves');
    });
    expect(result.current.checkedIds).toEqual([]);
    unmount();

    const reloaded = renderHook(() => useChecklist());
    expect(reloaded.result.current.adoptedSwapIds).toEqual(['swap-commute']);

    act(() => {
      reloaded.result.current.resetActions();
    });
    expect(reloaded.result.current.checkedIds).toEqual([]);
    expect(reloaded.result.current.adoptedSwapIds).toEqual([]);
  });

  it('recovers cleanly from corrupt localStorage JSON and filters non-string entries', () => {
    window.localStorage.setItem(STORAGE_KEYS.checklist, '{bad');
    window.localStorage.setItem(STORAGE_KEYS.adoptedSwaps, JSON.stringify(['swap-cooking', 42, null]));

    const { result } = renderHook(() => useChecklist());
    expect(result.current.checkedIds).toEqual([]);
    expect(result.current.adoptedSwapIds).toEqual(['swap-cooking']);
  });
});

describe('useAqiData', () => {
  beforeEach(() => {
    clearAirCache();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearAirCache();
  });

  it('fetches live Open-Meteo AQI, caches across remounts, and supports force refresh', async () => {
    let callCount = 0;
    const fetchMock = vi.fn(async () => {
      callCount += 1;
      return buildOpenMeteoResponse(callCount === 1 ? 265 : 290, 130, 210);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result, unmount } = renderHook(() => useAqiData(DEFAULT_PROFILE));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.reading.source).toBe('live');
    expect(result.current.reading.aqi).toBe(265);
    expect(result.current.statusMessage).toContain('AQI 265');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    unmount();

    // Remount uses cached reading without a second network request
    const cachedMount = renderHook(() => useAqiData(DEFAULT_PROFILE));
    await waitFor(() => {
      expect(cachedMount.result.current.loading).toBe(false);
    });
    expect(cachedMount.result.current.reading.aqi).toBe(265);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Explicit refresh bypasses cache
    act(() => {
      cachedMount.result.current.refresh();
    });
    await waitFor(() => {
      expect(cachedMount.result.current.loading).toBe(false);
      expect(cachedMount.result.current.reading.aqi).toBe(290);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('aborts in-flight fetch on city switch and honors manual AQI without network calls', async () => {
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal);
      if (signals.length === 1) {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      }
      return Promise.resolve(buildOpenMeteoResponse(118, 52, 95));
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ profile }: { profile: UserProfile }) => useAqiData(profile),
      { initialProps: { profile: DEFAULT_PROFILE } }
    );

    expect(signals.length).toBe(1);
    expect(signals[0].aborted).toBe(false);

    // Switch city before first request settles
    rerender({ profile: { ...DEFAULT_PROFILE, cityId: 'bengaluru' } });
    expect(signals[0].aborted).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.reading.city.id).toBe('bengaluru');
    });
    expect(result.current.reading.aqi).toBe(118);

    // Manual AQI override returns immediately without hitting fetch again
    const callsBeforeManual = fetchMock.mock.calls.length;
    rerender({ profile: { ...DEFAULT_PROFILE, cityId: 'bengaluru', manualAqi: 420 } });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.reading.source).toBe('manual');
    });
    expect(result.current.reading.aqi).toBe(420);
    expect(fetchMock.mock.calls.length).toBe(callsBeforeManual);
  });
});
