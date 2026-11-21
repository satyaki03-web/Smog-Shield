import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROFILE } from '../constants';
import {
  buildFallbackHourly,
  findTwoHourWindows,
  getAtRiskSummary,
  getBandInfo,
  getCityById,
  getTimeOfDaySlot,
  getVulnerabilityMultiplier,
} from './aqi';
import {
  AskCache,
  buildCompactAskPayload,
  buildCompactProfileSummary,
  parseStructuredAdvice,
  sanitizeAskText,
} from './ask';
import { calculateDirectImpact } from './impact';
import {
  answerNeighbourQuestion,
  buildRecommendations,
  exportPlanMarkdown,
  getCommunityChecklist,
} from './recommendations';
import { runAskRequest } from '../services/aiService';
import {
  buildOfflineReading,
  clearAirCache,
  fetchAirQuality,
} from '../services/airQualityService';
import type { AirReading, HourlyPoint, UserProfile } from '../types';

function makeHourlySeries(entries: Array<{ hour24: number; aqi: number }>): HourlyPoint[] {
  return entries.map((entry) => {
    const d = new Date(2026, 10, 20, entry.hour24, 0, 0, 0);
    const suffix = entry.hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = entry.hour24 % 12 === 0 ? 12 : entry.hour24 % 12;
    return {
      timeIso: d.toISOString(),
      hourLabel: `${hour12}:00 ${suffix}`,
      hour24: entry.hour24,
      aqi: entry.aqi,
      pm25: Math.round(entry.aqi * 0.45),
      pm10: Math.round(entry.aqi * 0.8),
    };
  });
}

describe('CPCB AQI band classification', () => {
  it('maps every exact CPCB boundary accurately', () => {
    expect(getBandInfo(-10).band).toBe('good');
    expect(getBandInfo(0).band).toBe('good');
    expect(getBandInfo(50).band).toBe('good');
    expect(getBandInfo(51).band).toBe('satisfactory');
    expect(getBandInfo(100).band).toBe('satisfactory');
    expect(getBandInfo(101).band).toBe('moderate');
    expect(getBandInfo(200).band).toBe('moderate');
    expect(getBandInfo(201).band).toBe('poor');
    expect(getBandInfo(300).band).toBe('poor');
    expect(getBandInfo(301).band).toBe('veryPoor');
    expect(getBandInfo(400).band).toBe('veryPoor');
    expect(getBandInfo(401).band).toBe('severe');
    expect(getBandInfo(500).band).toBe('severe');
  });

  it('classifies time-of-day slots across the 24-hour clock', () => {
    expect(getTimeOfDaySlot(7)).toBe('morning');
    expect(getTimeOfDaySlot(12)).toBe('midday');
    expect(getTimeOfDaySlot(15)).toBe('afternoon');
    expect(getTimeOfDaySlot(18)).toBe('evening');
    expect(getTimeOfDaySlot(23)).toBe('night');
  });
});

describe('Cleanest/peak windows and dynamic Routine timing copy', () => {
  it('never labels an evening 6:00 PM to 8:00 PM cleanest window as midday air', () => {
    const hourly = makeHourlySeries([
      { hour24: 6, aqi: 185 },
      { hour24: 7, aqi: 190 },
      { hour24: 8, aqi: 170 },
      { hour24: 12, aqi: 155 },
      { hour24: 13, aqi: 150 },
      { hour24: 18, aqi: 72 },
      { hour24: 19, aqi: 76 },
      { hour24: 20, aqi: 130 },
    ]);

    const windows = findTwoHourWindows(hourly);
    expect(windows.cleanest?.startLabel).toBe('6:00 PM');
    expect(windows.cleanest?.endLabel).toBe('8:00 PM');
    expect(windows.cleanest?.timeOfDay).toBe('evening');
    expect(windows.worst?.timeOfDay).toBe('morning');

    const reading: AirReading = {
      city: getCityById('bengaluru'),
      aqi: 92,
      pm25: 34,
      pm10: 66,
      fetchedAtIso: new Date().toISOString(),
      source: 'live',
      hourly,
    };

    const bundle = buildRecommendations(DEFAULT_PROFILE, reading);
    const routineOne = bundle.routine[0];
    expect(routineOne.title).toBe('Time outdoor walks for evening air');
    expect(routineOne.title.toLowerCase()).not.toContain('midday');
    expect(routineOne.action).toContain('6:00 PM to 8:00 PM');
    expect(routineOne.action).toContain('evening window');
    expect(bundle.indoor[0].title.toLowerCase()).toContain('evening');
  });

  it('builds a 24-hour diurnal fallback curve within valid bounds', () => {
    const curve = buildFallbackHourly(340, 170, 290, new Date(2026, 10, 20, 8, 0, 0));
    expect(curve).toHaveLength(24);
    expect(curve.every((pt) => pt.aqi >= 15 && pt.aqi <= 500)).toBe(true);
  });
});

describe('Household risk scoring and recommendations', () => {
  it('scales vulnerability multiplier up to the 2.0x cap', () => {
    const healthyAdult: UserProfile = {
      ...DEFAULT_PROFILE,
      adults: 1,
      children: 0,
      elders: 0,
      sensitivities: [],
    };
    const highRiskHome: UserProfile = {
      ...DEFAULT_PROFILE,
      adults: 2,
      children: 2,
      elders: 2,
      sensitivities: ['asthma', 'copd', 'heart', 'pregnancy'],
    };

    expect(getVulnerabilityMultiplier(healthyAdult)).toBe(1);
    expect(getVulnerabilityMultiplier(highRiskHome)).toBe(2);
    expect(getAtRiskSummary(highRiskHome, 'severe').length).toBeGreaterThanOrEqual(5);
    expect(getAtRiskSummary(healthyAdult, 'good')[0]).toContain('General household');
  });

  it('tailors biomass cooking swaps and community checklist at Severe AQI', () => {
    const biomassProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      cookingFuel: 'biomassOrWood',
      hasPurifier: false,
      manualAqi: 430,
    };
    const reading = buildOfflineReading(getCityById('delhi'), 430);
    const bundle = buildRecommendations(biomassProfile, reading);

    expect(bundle.swaps.some((s) => s.title.toLowerCase().includes('chulha'))).toBe(true);
    expect(bundle.routine).toHaveLength(4);
    const checklist = getCommunityChecklist('severe');
    expect(checklist.some((c) => c.text.toLowerCase().includes('indoors'))).toBe(true);
    expect(exportPlanMarkdown(biomassProfile, reading)).toContain('# Smog Shield Daily Plan: Delhi');
  });
});

describe('Direct impact calculator', () => {
  it('increases PM2.5 cut and weekly CO2e savings as checklist items and swaps are completed', () => {
    const reading = buildOfflineReading(getCityById('delhi'), 340);
    const baseline = calculateDirectImpact(DEFAULT_PROFILE, reading, [], []);
    expect(baseline.activeActionsCount).toBe(0);
    expect(baseline.exposureReductionPercent).toBe(12);
    expect(baseline.weeklyCo2eAvoidedKg).toBe(0);

    const active = calculateDirectImpact(
      { ...DEFAULT_PROFILE, hasPurifier: true, cookingFuel: 'biomassOrWood' },
      reading,
      ['chk-home-filter', 'chk-rwa-leaves', 'chk-rwa-guards', 'chk-school-idling'],
      ['swap-commute', 'swap-cooking', 'swap-waste-heating']
    );

    expect(active.activeActionsCount).toBe(7);
    expect(active.exposureReductionPercent).toBeLessThanOrEqual(78);
    expect(active.exposureReductionPercent).toBeGreaterThan(60);
    expect(active.weeklyCo2eAvoidedKg).toBeGreaterThan(40);
    expect(active.weeklyLocalPm25AvoidedGrams).toBeGreaterThan(50);
    expect(active.breakdown.length).toBeGreaterThan(5);
  });
});

describe('Open-Meteo service caching, deduplication, and offline fallback', () => {
  afterEach(() => {
    clearAirCache();
    vi.restoreAllMocks();
  });

  it('deduplicates concurrent in-flight requests and caches for 10 minutes', async () => {
    const city = getCityById('kolkata');
    const mockFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          current: { pm2_5: 88, pm10: 140, us_aqi: 195 },
          hourly: {
            time: ['2026-11-20T06:00', '2026-11-20T07:00', '2026-11-20T08:00'],
            pm2_5: [90, 85, 70],
            pm10: [150, 140, 120],
            us_aqi: [200, 190, 150],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const [first, second] = await Promise.all([
      fetchAirQuality(city, null, { fetchImpl: mockFetch }),
      fetchAirQuality(city, null, { fetchImpl: mockFetch }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(first.source).toBe('live');
    expect(first.aqi).toBe(195);
    expect(second.aqi).toBe(195);

    const third = await fetchAirQuality(city, null, { fetchImpl: mockFetch });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(third.aqi).toBe(195);
  });

  it('falls back cleanly to offline baseline when Open-Meteo is unreachable', async () => {
    const city = getCityById('patna');
    const failingFetch = vi.fn(async () => {
      throw new Error('Network unreachable');
    });

    const reading = await fetchAirQuality(city, null, { fetchImpl: failingFetch });
    expect(reading.source).toBe('offline');
    expect(reading.aqi).toBe(city.fallbackAqi);
  });

  it('honors manual AQI override without hitting the network', async () => {
    const city = getCityById('delhi');
    const mockFetch = vi.fn();
    const reading = await fetchAirQuality(city, 412, { fetchImpl: mockFetch });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(reading.source).toBe('manual');
    expect(reading.aqi).toBe(412);
  });
});

describe('Ask domain helpers and client service', () => {
  it('parses structured 3-part advice and sanitizes control characters', () => {
    expect(sanitizeAskText('Hello\u0000\n  world\t!', 50)).toBe('Hello world !');
    const parsed = parseStructuredAdvice(
      'Tailored Advice: Use a snug N95.\nDirect Impact: Cuts PM2.5 by 85%.\nQuick Next Step: Seal the nose bridge.'
    );
    expect(parsed.tailoredAdvice).toBe('Use a snug N95.');
    expect(parsed.directImpact).toBe('Cuts PM2.5 by 85%.');
    expect(parsed.quickNextStep).toBe('Seal the nose bridge.');
  });

  it('caches answers for 10 minutes, supports cancellation, and falls back on timeout', async () => {
    let now = 1_000_000;
    const cache = new AskCache({ ttlMs: 10 * 60 * 1000, now: () => now });
    const reading = buildOfflineReading(getCityById('delhi'), 340);
    const payload = buildCompactAskPayload(
      'Do cloth masks work?',
      reading,
      'Very Poor',
      DEFAULT_PROFILE,
      []
    );
    expect(buildCompactProfileSummary(DEFAULT_PROFILE)).toContain('commute:twoWheeler');
    expect(answerNeighbourQuestion('Do cloth masks work?', DEFAULT_PROFILE, reading)).toContain('N95');

    const okFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ text: 'Tailored Advice: Wear N95.', model: 'gemini-3.5-flash-lite' }),
        { status: 200 }
      )
    );

    const res1 = await runAskRequest({
      payload,
      cache,
      signal: new AbortController().signal,
      fetchImpl: okFetch,
    });
    expect(res1.status).toBe('ok');
    expect(okFetch).toHaveBeenCalledTimes(1);

    const res2 = await runAskRequest({
      payload,
      cache,
      signal: new AbortController().signal,
      fetchImpl: okFetch,
    });
    expect(res2.status).toBe('cached');
    expect(okFetch).toHaveBeenCalledTimes(1);

    // Advance past 10 minutes and test cancel
    now += 11 * 60 * 1000;
    const cancelCtrl = new AbortController();
    cancelCtrl.abort();
    const cancelled = await runAskRequest({
      payload,
      cache,
      signal: cancelCtrl.signal,
      fetchImpl: okFetch,
    });
    expect(cancelled.status).toBe('cancelled');

    // Timeout fallback test
    const hangingFetch: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    const timedOut = await runAskRequest({
      payload,
      cache,
      signal: new AbortController().signal,
      timeoutMs: 30,
      fetchImpl: hangingFetch,
    });
    expect(timedOut.status).toBe('timeout');
  });
});
