export type AqiBand =
  | 'good'
  | 'satisfactory'
  | 'moderate'
  | 'poor'
  | 'veryPoor'
  | 'severe';

export type Sensitivity = 'asthma' | 'heart' | 'pregnancy' | 'copd';
export type CommuteMode = 'twoWheeler' | 'car' | 'publicTransit' | 'walkOrCycle' | 'workFromHome';
export type CookingFuel = 'lpg' | 'pipedGas' | 'induction' | 'biomassOrWood';
export type HomeType = 'apartment' | 'independentHouse' | 'groundFloorRoadside';
export type BudgetTier = 'lowCost' | 'moderate' | 'flexible';
export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export interface CityInfo {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  fallbackAqi: number;
  fallbackPm25: number;
  fallbackPm10: number;
}

export interface UserProfile {
  cityId: string;
  adults: number;
  children: number;
  elders: number;
  sensitivities: Sensitivity[];
  commute: CommuteMode;
  cookingFuel: CookingFuel;
  homeType: HomeType;
  hasPurifier: boolean;
  budget: BudgetTier;
  manualAqi: number | null;
}

export interface HourlyPoint {
  timeIso: string;
  hourLabel: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface AirReading {
  city: CityInfo;
  aqi: number;
  pm25: number;
  pm10: number;
  fetchedAtIso: string;
  source: 'live' | 'manual' | 'offline';
  hourly: HourlyPoint[];
}

export interface BandInfo {
  band: AqiBand;
  label: string;
  rangeLabel: string;
  summary: string;
  maskGuidance: string;
  cssVar: string;
  shape: 'circle' | 'roundedSquare' | 'diamond' | 'triangle' | 'octagon' | 'alertHex';
}

export interface TimeWindow {
  startLabel: string;
  endLabel: string;
  averageAqi: number;
}

export interface Recommendation {
  id: string;
  category: 'routine' | 'indoor' | 'swap';
  priority: number;
  title: string;
  action: string;
  timingOrCost: string;
  exposureImpact: string;
  emissionsImpact: string;
  basis: string;
}

export interface ChecklistItem {
  id: string;
  group: 'RWA' | 'School' | 'Household';
  text: string;
}

export const CITIES: CityInfo[] = [
  { id: 'delhi', name: 'Delhi', region: 'Delhi NCR', lat: 28.6139, lon: 77.209, fallbackAqi: 342, fallbackPm25: 178, fallbackPm10: 295 },
  { id: 'gurugram', name: 'Gurugram', region: 'Delhi NCR', lat: 28.4595, lon: 77.0266, fallbackAqi: 318, fallbackPm25: 158, fallbackPm10: 270 },
  { id: 'noida', name: 'Noida', region: 'Delhi NCR', lat: 28.5355, lon: 77.391, fallbackAqi: 336, fallbackPm25: 171, fallbackPm10: 288 },
  { id: 'ghaziabad', name: 'Ghaziabad', region: 'Delhi NCR', lat: 28.6692, lon: 77.4538, fallbackAqi: 355, fallbackPm25: 186, fallbackPm10: 310 },
  { id: 'faridabad', name: 'Faridabad', region: 'Delhi NCR', lat: 28.4089, lon: 77.3178, fallbackAqi: 325, fallbackPm25: 164, fallbackPm10: 278 },
  { id: 'lucknow', name: 'Lucknow', region: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, fallbackAqi: 264, fallbackPm25: 122, fallbackPm10: 218 },
  { id: 'kanpur', name: 'Kanpur', region: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, fallbackAqi: 282, fallbackPm25: 134, fallbackPm10: 235 },
  { id: 'patna', name: 'Patna', region: 'Bihar', lat: 25.5941, lon: 85.1376, fallbackAqi: 295, fallbackPm25: 142, fallbackPm10: 248 },
  { id: 'varanasi', name: 'Varanasi', region: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, fallbackAqi: 248, fallbackPm25: 112, fallbackPm10: 204 },
  { id: 'chandigarh', name: 'Chandigarh', region: 'Punjab / Haryana', lat: 30.7333, lon: 76.7794, fallbackAqi: 196, fallbackPm25: 86, fallbackPm10: 154 },
  { id: 'amritsar', name: 'Amritsar', region: 'Punjab', lat: 31.634, lon: 74.8723, fallbackAqi: 242, fallbackPm25: 109, fallbackPm10: 196 },
  { id: 'jaipur', name: 'Jaipur', region: 'Rajasthan', lat: 26.9124, lon: 75.7873, fallbackAqi: 188, fallbackPm25: 82, fallbackPm10: 162 },
  { id: 'kolkata', name: 'Kolkata', region: 'West Bengal', lat: 22.5726, lon: 88.3639, fallbackAqi: 218, fallbackPm25: 98, fallbackPm10: 175 },
  { id: 'mumbai', name: 'Mumbai', region: 'Maharashtra', lat: 19.076, lon: 72.8777, fallbackAqi: 146, fallbackPm25: 56, fallbackPm10: 118 },
  { id: 'bengaluru', name: 'Bengaluru', region: 'Karnataka', lat: 12.9716, lon: 77.5946, fallbackAqi: 84, fallbackPm25: 28, fallbackPm10: 62 },
];

export const DEFAULT_PROFILE: UserProfile = {
  cityId: 'delhi',
  adults: 2,
  children: 1,
  elders: 1,
  sensitivities: ['asthma'],
  commute: 'twoWheeler',
  cookingFuel: 'lpg',
  homeType: 'apartment',
  hasPurifier: false,
  budget: 'lowCost',
  manualAqi: null,
};

/** Maximum valid AQI value on the 0 to 500 scale. */
export const MAX_AQI = 500;
/** Timeout in milliseconds for live Open-Meteo air quality requests. */
export const OPEN_METEO_TIMEOUT_MS = 10_000;
/** Cache TTL in milliseconds for live Open-Meteo readings. */
export const AIR_CACHE_TTL_MS = 10 * 60 * 1000;

/** Resolves a curated city by ID, falling back to Delhi. */
export function getCityById(id: string): CityInfo {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}

/** Maps a numeric AQI value onto its Indian CPCB band metadata. */
export function getBandInfo(aqi: number): BandInfo {
  const value = Math.max(0, Math.round(aqi));
  if (value <= 50) {
    return {
      band: 'good',
      label: 'Good',
      rangeLabel: '0 to 50',
      summary: 'Air is clean for outdoor routines, school play, and full cross-ventilation.',
      maskGuidance: 'No mask needed for ambient air.',
      cssVar: 'var(--band-good)',
      shape: 'circle',
    };
  }
  if (value <= 100) {
    return {
      band: 'satisfactory',
      label: 'Satisfactory',
      rangeLabel: '51 to 100',
      summary: 'Acceptable for most people; keep quick-relief inhalers handy for sensitive lungs.',
      maskGuidance: 'Optional near busy traffic junctions.',
      cssVar: 'var(--band-satisfactory)',
      shape: 'roundedSquare',
    };
  }
  if (value <= 200) {
    return {
      band: 'moderate',
      label: 'Moderate',
      rangeLabel: '101 to 200',
      summary: 'Fine particles begin irritating airways during brisk exercise and peak traffic hours.',
      maskGuidance: 'Well-fitted N95 recommended for two-wheeler rides and sensitive members.',
      cssVar: 'var(--band-moderate)',
      shape: 'diamond',
    };
  }
  if (value <= 300) {
    return {
      band: 'poor',
      label: 'Poor',
      rangeLabel: '201 to 300',
      summary: 'Prolonged outdoor exposure causes breathing discomfort for most residents.',
      maskGuidance: 'Well-fitted N95 or FFP2 mask for all outdoor errands and commutes.',
      cssVar: 'var(--band-poor)',
      shape: 'triangle',
    };
  }
  if (value <= 400) {
    return {
      band: 'veryPoor',
      label: 'Very Poor',
      rangeLabel: '301 to 400',
      summary: 'High winter smog burden. Move exercise indoors and shorten outdoor trips.',
      maskGuidance: 'Snug N95 or FFP2 mask required outdoors; check nose-bridge seal.',
      cssVar: 'var(--band-very-poor)',
      shape: 'octagon',
    };
  }
  return {
    band: 'severe',
    label: 'Severe',
    rangeLabel: '401 and above',
    summary: 'Health alert for everyone. Keep windows sealed outside brief midday airing and avoid outdoor exertion.',
    maskGuidance: 'Strict N95 or FFP2 mask for unavoidable travel; avoid outdoor play for children.',
    cssVar: 'var(--band-severe)',
    shape: 'alertHex',
  };
}

export function getVulnerabilityMultiplier(profile: UserProfile): number {
  let factor = 1.0;
  if (profile.children > 0) factor += 0.25;
  if (profile.elders > 0) factor += 0.25;
  if (profile.sensitivities.includes('asthma') || profile.sensitivities.includes('copd')) factor += 0.35;
  if (profile.sensitivities.includes('heart')) factor += 0.25;
  if (profile.sensitivities.includes('pregnancy')) factor += 0.2;
  return Math.min(2.0, Number(factor.toFixed(2)));
}

export function getAtRiskSummary(profile: UserProfile, band: AqiBand): string[] {
  const groups: string[] = [];
  if (profile.children > 0) {
    groups.push(
      `${profile.children} ${profile.children === 1 ? 'child' : 'children'} (faster breathing rate per kg body weight)`
    );
  }
  if (profile.elders > 0) {
    groups.push(
      `${profile.elders} ${profile.elders === 1 ? 'elder' : 'elders'} (higher cardiovascular sensitivity to PM2.5)`
    );
  }
  if (profile.sensitivities.includes('asthma')) groups.push('Asthma management (keep rescue inhaler accessible)');
  if (profile.sensitivities.includes('copd')) groups.push('COPD sensitivity (avoid cold morning smog peaks)');
  if (profile.sensitivities.includes('heart')) groups.push('Heart condition (skip heavy outdoor exertion)');
  if (profile.sensitivities.includes('pregnancy')) groups.push('Pregnancy (prioritize clean bedroom air overnight)');
  if (groups.length === 0) {
    if (band === 'veryPoor' || band === 'severe') {
      groups.push('All healthy adults are affected at this smog level');
    } else {
      groups.push('General household (standard precautions apply)');
    }
  }
  return groups;
}

export function formatHourLabel(date: Date): string {
  const h = date.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${suffix}`;
}

export function buildFallbackHourly(baseAqi: number, basePm25: number, basePm10: number): HourlyPoint[] {
  // Typical Indo-Gangetic winter diurnal curve: higher night/early morning inversion, lower afternoon (1 PM - 4 PM).
  const multipliers = [
    1.18, 1.2, 1.22, 1.18, 1.15, 1.12, 1.16, 1.14, 1.04, 0.94, 0.85, 0.78,
    0.72, 0.68, 0.69, 0.74, 0.82, 0.94, 1.06, 1.14, 1.18, 1.2, 1.19, 1.17,
  ];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const points: HourlyPoint[] = [];
  for (let i = 0; i < 24; i++) {
    const t = new Date(now.getTime() + i * 3600 * 1000);
    const m = multipliers[t.getHours()];
    points.push({
      timeIso: t.toISOString(),
      hourLabel: formatHourLabel(t),
      aqi: Math.min(500, Math.max(15, Math.round(baseAqi * m))),
      pm25: Math.max(5, Math.round(basePm25 * m)),
      pm10: Math.max(10, Math.round(basePm10 * m)),
    });
  }
  return points;
}

export function findTwoHourWindows(hourly: HourlyPoint[]): {
  cleanest: TimeWindow | null;
  worst: TimeWindow | null;
} {
  if (hourly.length === 0) return { cleanest: null, worst: null };
  if (hourly.length === 1) {
    const single: TimeWindow = {
      startLabel: hourly[0].hourLabel,
      endLabel: hourly[0].hourLabel,
      averageAqi: hourly[0].aqi,
    };
    return { cleanest: single, worst: single };
  }
  const limit = Math.min(hourly.length, 24);
  let bestIdx = 0;
  let worstIdx = 0;
  let bestAvg = Number.POSITIVE_INFINITY;
  let worstAvg = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < limit - 1; i++) {
    const avg = Math.round((hourly[i].aqi + hourly[i + 1].aqi) / 2);
    if (avg < bestAvg) {
      bestAvg = avg;
      bestIdx = i;
    }
    if (avg > worstAvg) {
      worstAvg = avg;
      worstIdx = i;
    }
  }

  const endLabelFor = (index: number): string => {
    const endDate = new Date(hourly[index + 1].timeIso);
    endDate.setHours(endDate.getHours() + 1);
    return Number.isNaN(endDate.getTime()) ? hourly[index + 1].hourLabel : formatHourLabel(endDate);
  };

  return {
    cleanest: {
      startLabel: hourly[bestIdx].hourLabel,
      endLabel: endLabelFor(bestIdx),
      averageAqi: bestAvg,
    },
    worst: {
      startLabel: hourly[worstIdx].hourLabel,
      endLabel: endLabelFor(worstIdx),
      averageAqi: worstAvg,
    },
  };
}

interface CacheEntry {
  reading: AirReading;
  expiresAt: number;
}

const airCache = new Map<string, CacheEntry>();

/** Clears the in-memory Open-Meteo air quality cache. */
export function clearAirCache(): void {
  airCache.clear();
}

/** Fetches live Open-Meteo air quality with 10s timeout, 10m cache, and offline seasonal fallback. */
export async function fetchAirQuality(
  city: CityInfo,
  manualAqi: number | null,
  forceRefresh = false,
  options?: { fetchImpl?: typeof fetch; timeoutMs?: number }
): Promise<AirReading> {
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

  const cached = airCache.get(city.id);
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
    return cached.reading;
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? OPEN_METEO_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${city.lat}&longitude=${city.lon}` +
      `&current=us_aqi,pm2_5,pm10&hourly=us_aqi,pm2_5,pm10&forecast_days=2&timezone=auto`;
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
    airCache.set(city.id, { reading, expiresAt: Date.now() + AIR_CACHE_TTL_MS });
    return reading;
  } catch {
    return {
      city,
      aqi: city.fallbackAqi,
      pm25: city.fallbackPm25,
      pm10: city.fallbackPm10,
      fetchedAtIso: new Date().toISOString(),
      source: 'offline',
      hourly: buildFallbackHourly(city.fallbackAqi, city.fallbackPm25, city.fallbackPm10),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildRecommendations(
  profile: UserProfile,
  reading: AirReading
): { routine: Recommendation[]; indoor: Recommendation[]; swaps: Recommendation[] } {
  const bandInfo = getBandInfo(reading.aqi);
  const { cleanest, worst } = findTwoHourWindows(reading.hourly);
  const cleanStr = cleanest ? `${cleanest.startLabel} to ${cleanest.endLabel}` : '1:00 PM to 3:00 PM';
  const worstStr = worst ? `${worst.startLabel} to ${worst.endLabel}` : '6:00 AM to 8:00 AM';
  const highRisk = getVulnerabilityMultiplier(profile) >= 1.25;
  const severeOrVeryPoor = bandInfo.band === 'veryPoor' || bandInfo.band === 'severe';
  const poorOrWorse = severeOrVeryPoor || bandInfo.band === 'poor';

  const routine: Recommendation[] = [
    {
      id: 'routine-exercise',
      category: 'routine',
      priority: 1,
      title: poorOrWorse ? 'Shift morning walk indoors' : 'Time outdoor walks for midday air',
      action: poorOrWorse
        ? `Skip brisk outdoor exercise during ${worstStr}. Do 25 minutes of indoor stretching, stairs, or stationary cycling instead.`
        : `Schedule outdoor walks during ${cleanStr} when boundary-layer mixing lowers surface PM2.5.`,
      timingOrCost: 'Zero cost | Daily routine',
      exposureImpact: poorOrWorse
        ? 'Cuts inhaled PM2.5 dose during exercise by 55% to 75% because deep breathing multiplies particle intake.'
        : 'Reduces peak particulate exposure by 20% to 35% compared with early morning inversion hours.',
      emissionsImpact: 'Indirect: avoids driving to distant parks when indoor movement works at home.',
      basis: 'Minute ventilation increases 3x to 6x during brisk outdoor exercise; urban winter inversions peak between 5 AM and 9 AM.',
    },
    {
      id: 'routine-mask',
      category: 'routine',
      priority: 2,
      title: poorOrWorse ? 'Use a fitted N95 or FFP2 mask outdoors' : 'Keep an N95 mask ready for traffic corridors',
      action:
        bandInfo.band === 'good'
          ? 'No mask needed today. Store clean N95 masks dry in a paper envelope for higher-smog days.'
          : `Wear a snug N95 or FFP2 mask (pinch the nose clip firmly, avoid loose cloth or surgical masks) for commutes and errands.${
              profile.children > 0 ? ' Use child-sized N95/KF94 masks for school drop-off.' : ''
            }`,
      timingOrCost: 'Rs 30 to 60 per reusable mask',
      exposureImpact: 'A properly sealed N95 filters 80% to 95% of PM2.5 particles; loose cloth masks block under 20%.',
      emissionsImpact: 'Reuse each mask for 30 to 40 dry hours until straps loosen to cut disposable waste.',
      basis: 'NIOSH/BIS filtration performance studies comparing fitted N95 respirators against surgical and cloth masks for fine PM2.5.',
    },
    {
      id: 'routine-errands',
      category: 'routine',
      priority: 3,
      title: profile.children > 0 ? 'Batch school run and market errands' : 'Combine errands into the cleanest window',
      action: `Group pharmacy, grocery, and pickup trips inside ${cleanStr} instead of multiple evening runs during ${worstStr}.`,
      timingOrCost: `Best window: ${cleanStr}`,
      exposureImpact: 'Shortens total outdoor exposure time by 30% to 45% during high-inversion hours.',
      emissionsImpact: 'Eliminating two short cold-start trips cuts local tailpipe PM and NOx by roughly 40% for errand travel.',
      basis: 'Cold engines emit disproportionately higher hydrocarbons and particulates during the first 3 km of driving.',
    },
  ];

  if (highRisk) {
    routine.push({
      id: 'routine-medication',
      category: 'routine',
      priority: 4,
      title: 'Check daily symptoms and inhaler readiness',
      action:
        'Keep prescribed controllers and rescue inhalers in one visible spot. Rinse nose and eyes with plain saline after coming indoors.',
      timingOrCost: '2 minutes | Sensitive members',
      exposureImpact: 'Saline nasal rinse clears settled coarse dust and lowers upper-airway irritation after outdoor trips.',
      emissionsImpact: 'No emissions impact; prioritizes household health resilience.',
      basis: 'Standard public-health guidance for households with children, elders, asthma, COPD, or cardiac risk.',
    });
  }

  const indoor: Recommendation[] = [
    {
      id: 'indoor-ventilate',
      category: 'indoor',
      priority: 1,
      title: severeOrVeryPoor ? 'Seal windows now; air out only briefly at midday' : 'Cross-ventilate only during the cleanest window',
      action: severeOrVeryPoor
        ? `Keep doors and balcony gaps closed with rolled damp towels or weather-strip tape. Open windows for just 15 to 20 minutes during ${cleanStr} to clear indoor CO2.`
        : `Open opposite windows for 30 minutes during ${cleanStr} (avg AQI ${cleanest?.averageAqi ?? reading.aqi}), then close before evening smog rises.`,
      timingOrCost: `Air out: ${cleanStr}`,
      exposureImpact: 'Reduces outdoor-to-indoor PM2.5 infiltration by 30% to 50% while preventing stale indoor CO2 buildup.',
      emissionsImpact: 'Zero energy use; avoids running exhaust fans continuously against heavy outdoor smog.',
      basis: 'Indoor-outdoor penetration factor measurements for naturally ventilated urban flats in North India.',
    },
    {
      id: 'indoor-purifier',
      category: 'indoor',
      priority: 2,
      title: profile.hasPurifier
        ? 'Run HEPA purifier continuously in the main bedroom'
        : profile.budget === 'lowCost'
        ? 'Build a clean-air sleeping room with DIY box-fan filter'
        : 'Create one clean-air room with a true HEPA H13 purifier',
      action: profile.hasPurifier
        ? 'Place the purifier 30 cm away from walls, close bedroom doors, run on medium-high 1 hour before sleep, and vacuum the mesh pre-filter weekly.'
        : 'Focus on the smallest sleeping room used by children or elders. A true HEPA H13 unit (or a box fan taped cleanly to a MERV-13/HEPA replacement filter) cleans one closed room effectively.',
      timingOrCost: profile.hasPurifier ? 'Existing device | Weekly pre-filter clean' : 'Rs 2,500 DIY or Rs 7,000+ HEPA',
      exposureImpact: 'Lowers closed-bedroom PM2.5 by 60% to 80% over 8 hours of overnight sleep, cutting daily cumulative dose sharply.',
      emissionsImpact: 'A 35W HEPA fan uses ~0.3 kWh overnight; clean pre-filters keep fan draw low.',
      basis: 'CADR room-decay modeling: protecting 8 hours of sleep removes a third of daily exposure time.',
    },
    {
      id: 'indoor-cleaning',
      category: 'indoor',
      priority: 3,
      title: 'Switch from dry sweeping to damp mopping',
      action:
        'Use a wet microfiber mop and damp cloth for floors and sills instead of a dry jhadu or feather duster. Avoid indoor incense (agarbatti), dhoop, and mosquito coils.',
      timingOrCost: 'Zero extra cost | Daily habit',
      exposureImpact: 'Prevents resuspending settled PM10/PM2.5 dust and removes indoor smoke spikes that can exceed 400 AQI in closed rooms.',
      emissionsImpact: 'Cuts indoor combustion particles directly at the source.',
      basis: 'Indoor aerosol studies show a single incense stick or dry broom sweep spikes room PM2.5 by 100 to 300 ug/m3.',
    },
    {
      id: 'indoor-kitchen',
      category: 'indoor',
      priority: 4,
      title: 'Vent cooking fumes immediately and bust plant myths',
      action:
        'Run the kitchen chimney or exhaust fan while tadka/frying and keep the kitchen door shut so fumes do not drift into bedrooms. Note: houseplants are pleasant but cannot replace filtration or ventilation during smog.',
      timingOrCost: 'During every meal',
      exposureImpact: 'High-heat frying spikes kitchen PM2.5 above outdoor smog; targeted exhaust clears 50% to 70% of cooking aerosols.',
      emissionsImpact: 'Covering pots and using pressure cookers trims cooking gas use by 20% to 35%.',
      basis: 'Controlled indoor cooking emissions trials and peer-reviewed reviews showing 100+ plants per sq m would be needed to match one HEPA unit.',
    },
  ];

  const swaps: Recommendation[] = [];

  if (profile.commute === 'twoWheeler' || profile.commute === 'car') {
    swaps.push({
      id: 'swap-commute',
      category: 'swap',
      priority: 1,
      title:
        profile.commute === 'twoWheeler'
          ? 'Swap 2+ two-wheeler days to metro, bus, or shared ride'
          : 'Carpool or use metro for peak-hour office runs',
      action:
        profile.commute === 'twoWheeler'
          ? 'Two-wheeler riders breathe direct tailpipe exhaust at handlebar height. Shift two or more commutes per week to metro/AC bus or a colleague carpool.'
          : 'Share one car with 2 neighbours or combine park-and-ride with metro on Poor to Severe days. Turn off ignition at red lights over 30 seconds.',
      timingOrCost: 'Saves Rs 600 to 2,200 / month',
      exposureImpact:
        profile.commute === 'twoWheeler'
          ? 'Cuts commute PM2.5 intake by 50% to 65% compared with open two-wheeler riding in traffic.'
          : 'Using cabin recirculation with a clean cabin filter reduces in-car PM2.5 by 40% to 60%.',
      emissionsImpact: 'Replaces 40 to 120 km/week of private tailpipe PM2.5, NOx, and CO2 emissions.',
      basis: 'Delhi NCR commuter exposure measurements comparing open two-wheelers, closed vehicles, and metro cabins.',
    });
  } else {
    swaps.push({
      id: 'swap-commute-keep',
      category: 'swap',
      priority: 1,
      title: 'Protect your low-emission commute with quiet side streets',
      action:
        profile.commute === 'workFromHome'
          ? 'Keep remote workdays on Severe smog alerts and shift deliveries to midday windows.'
          : 'Walk or cycle along inner colony lanes rather than arterial roads, and wear a fitted N95 when AQI exceeds 150.',
      timingOrCost: 'Zero cost | Route shift',
      exposureImpact: 'Stepping just 100 meters off a main arterial road drops black-carbon and ultrafine exposure by 30% to 50%.',
      emissionsImpact: 'Maintains near-zero personal transport emissions.',
      basis: 'Near-roadway dispersion studies showing sharp pollutant decay 50 to 150 meters from heavy traffic lanes.',
    });
  }

  swaps.push({
    id: 'swap-cooking',
    category: 'swap',
    priority: 2,
    title:
      profile.cookingFuel === 'biomassOrWood'
        ? 'Transition from wood or coal chulha to LPG or induction'
        : 'Use electric kettle and induction for boiling and reheating',
    action:
      profile.cookingFuel === 'biomassOrWood'
        ? 'Prioritize LPG (check Ujjwala refill subsidies) or a single 1800W induction cooktop for daily tea and dal to remove dense indoor woodsmoke.'
        : 'Boiling tea, milk, and water on an electric kettle or induction hob avoids indoor NO2 and heat buildup in closed winter kitchens.',
    timingOrCost: profile.cookingFuel === 'biomassOrWood' ? 'High health priority' : 'Rs 1,400 to 2,500 one-time',
    exposureImpact:
      profile.cookingFuel === 'biomassOrWood'
        ? 'Cuts indoor kitchen PM2.5 by 75% to 90% immediately.'
        : 'Reduces indoor NO2 and combustion moisture by 30% to 50% during closed-window days.',
    emissionsImpact: 'Lowers household combustion emissions and trims LPG cylinder refills.',
    basis: 'WHO indoor air quality guidelines comparing biomass, LPG, and electric cooking appliances.',
  });

  swaps.push({
    id: 'swap-waste-heating',
    category: 'swap',
    priority: 3,
    title: 'Prevent winter leaf burning and open security bonfires',
    action:
      'Ask your RWA or street committee to compost dry leaves in a corner pit and provide warm jackets or safe oil-filled electric heaters for night guards instead of wood or coal fires.',
    timingOrCost: 'Community action | Low shared cost',
    exposureImpact: 'Eliminates local nighttime smoke plumes that leak straight into ground and lower-floor bedrooms.',
    emissionsImpact: 'Open biomass burning is a major hyper-local PM2.5 and black-carbon source in winter evenings.',
    basis: 'Urban winter source-apportionment studies across Delhi NCR and Indo-Gangetic cities.',
  });

  return { routine, indoor, swaps };
}

export function getCommunityChecklist(band: AqiBand): ChecklistItem[] {
  const highAlert = band === 'poor' || band === 'veryPoor' || band === 'severe';
  return [
    {
      id: 'chk-rwa-leaves',
      group: 'RWA',
      text: 'Stop sweeping-and-burning of dry leaves; move garden waste to a compost pit.',
    },
    {
      id: 'chk-rwa-guards',
      group: 'RWA',
      text: 'Provide night security guards with woollens or safe electric heaters instead of wood bonfires.',
    },
    {
      id: 'chk-rwa-dust',
      group: 'RWA',
      text: 'Sprinkle greywater before sweeping colony roads and cover open sand or construction piles.',
    },
    {
      id: 'chk-school-assembly',
      group: 'School',
      text: highAlert
        ? 'Move morning assembly and PE games indoors until AQI drops below 200.'
        : 'Schedule outdoor sports for midday hours when smog dispersion is best.',
    },
    {
      id: 'chk-school-idling',
      group: 'School',
      text: 'Enforce a zero-idling pickup zone at school gates for vans, buses, and parent cars.',
    },
    {
      id: 'chk-home-filter',
      group: 'Household',
      text: 'Check N95 mask fit for every family member and clean AC or purifier mesh pre-filters.',
    },
  ];
}

export function buildPlanSummary(profile: UserProfile, reading: AirReading, personalizedTone: boolean): string {
  const band = getBandInfo(reading.aqi);
  const { cleanest, worst } = findTwoHourWindows(reading.hourly);
  const cleanStr = cleanest ? `${cleanest.startLabel} to ${cleanest.endLabel}` : '1:00 PM to 3:00 PM';
  const worstStr = worst ? `${worst.startLabel} to ${worst.endLabel}` : '6:00 AM to 8:00 AM';

  if (personalizedTone) {
    const members: string[] = [];
    if (profile.children > 0) members.push(`${profile.children} ${profile.children === 1 ? 'child' : 'children'}`);
    if (profile.elders > 0) members.push(`${profile.elders} ${profile.elders === 1 ? 'elder' : 'elders'}`);
    const familyNote =
      members.length > 0
        ? `With ${members.join(' and ')} at home, keep the bedroom clean overnight and skip outdoor exertion during ${worstStr}.`
        : `Protect your lungs by avoiding peak smog during ${worstStr}.`;
    return `${reading.city.name} is at AQI ${reading.aqi} (${band.label}, PM2.5 ${reading.pm25} ug/m3). ${familyNote} Save brief airing and errands for ${cleanStr}, and wear a snug N95 for ${
      profile.commute === 'twoWheeler' ? 'two-wheeler trips' : 'outdoor travel'
    }.`;
  }

  return `${reading.city.name} air quality is ${band.label} at AQI ${reading.aqi} (PM2.5 ${reading.pm25} ug/m3, PM10 ${reading.pm10} ug/m3). ${band.summary} Cleanest 2-hour window: ${cleanStr}. Peak smog window to avoid: ${worstStr}.`;
}

export function answerNeighbourQuestion(
  question: string,
  profile: UserProfile,
  reading: AirReading
): string {
  const q = question.toLowerCase();
  const band = getBandInfo(reading.aqi);
  const { cleanest, worst } = findTwoHourWindows(reading.hourly);
  const cleanStr = cleanest ? `${cleanest.startLabel} to ${cleanest.endLabel}` : '1:00 PM to 3:00 PM';
  const worstStr = worst ? `${worst.startLabel} to ${worst.endLabel}` : '6:00 AM to 8:00 AM';

  if (q.includes('mask') || q.includes('n95') || q.includes('cloth')) {
    return `At AQI ${reading.aqi} (${band.label}) in ${reading.city.name}: ${band.maskGuidance} Cloth and surgical masks leave side gaps that let fine PM2.5 particles straight through. A well-sealed N95 or FFP2 cuts inhaled fine particles by 80% to 95%, and can be air-dried and reused for roughly 30 to 40 hours.`;
  }
  if (q.includes('window') || q.includes('ventilat') || q.includes('air out') || q.includes('open')) {
    return `The cleanest 2-hour window in ${reading.city.name} over the next 24 hours is ${cleanStr} (average AQI around ${cleanest?.averageAqi ?? reading.aqi}). Open opposite windows for 15 to 25 minutes during that window to flush indoor CO2, then close up before smog thickens around ${worstStr}.`;
  }
  if (q.includes('plant') || q.includes('steam') || q.includes('jaggery') || q.includes('myth')) {
    return `Indoor plants and warm drinks feel soothing, and staying hydrated helps clear throat mucus, but neither removes PM2.5 from room air. Real exposure drops come from closing window gaps outside ${cleanStr}, damp mopping instead of dry sweeping, kitchen exhaust during cooking, and a true HEPA filter in the sleeping room.`;
  }
  if (q.includes('school') || q.includes('child') || q.includes('play') || q.includes('park') || q.includes('walk') || q.includes('run')) {
    const indoorAdvice =
      reading.aqi > 200
        ? `At AQI ${reading.aqi} (${band.label}), keep children's active play and brisk walks indoors today.`
        : `At AQI ${reading.aqi} (${band.label}), light outdoor play is workable during ${cleanStr}, away from main roads.`;
    return `${indoorAdvice} Avoid ${worstStr} when cold ground inversions trap exhaust near breathing height. If commuting to school, use a snug child-sized N95 or KF94 mask and ask the school gate to stop bus idling.`;
  }
  if (q.includes('purifier') || q.includes('diy') || q.includes('budget') || q.includes('cheap') || q.includes('cost')) {
    return `You do not need an expensive smart purifier for every room. Pick one small bedroom for sleep, seal door gaps with a rolled towel, and run a basic true HEPA H13 unit (no ionizer needed) or a box fan sealed to a MERV-13/HEPA filter. Vacuum the outer mesh pre-filter weekly so the main filter lasts longer.`;
  }
  if (q.includes('rwa') || q.includes('burn') || q.includes('guard') || q.includes('communit')) {
    return `Three fast wins for an RWA in ${reading.city.name}: (1) compost dry leaves instead of burning heaps, (2) give night guards woollen jackets or safe electric heaters to stop wood bonfires, and (3) lightly sprinkle greywater before morning road sweeping. Together these cut evening ground-level smoke noticeably.`;
  }
  return `Based on ${reading.city.name} at AQI ${reading.aqi} (${band.label}, PM2.5 ${reading.pm25} ug/m3): keep heavy outdoor exertion indoors during ${worstStr}, air out briefly during ${cleanStr}, and wear a snug N95 outdoors. Ask about masks, windows, school play, budget purifiers, or RWA steps for specific advice.`;
}

export function exportPlanMarkdown(profile: UserProfile, reading: AirReading): string {
  const band = getBandInfo(reading.aqi);
  const { cleanest, worst } = findTwoHourWindows(reading.hourly);
  const recs = buildRecommendations(profile, reading);
  const lines = [
    `# Smog Shield Daily Plan: ${reading.city.name}`,
    '',
    `- Current AQI: ${reading.aqi} (${band.label}, CPCB scale)`,
    `- PM2.5: ${reading.pm25} ug/m3 | PM10: ${reading.pm10} ug/m3`,
    `- Source: ${reading.source === 'live' ? 'Open-Meteo live reading' : reading.source === 'manual' ? 'Manual AQI entry' : 'Offline seasonal baseline'}`,
    `- Cleanest 2-hour window: ${cleanest ? `${cleanest.startLabel} to ${cleanest.endLabel} (avg AQI ${cleanest.averageAqi})` : 'Midday'}`,
    `- Peak smog window to avoid: ${worst ? `${worst.startLabel} to ${worst.endLabel} (avg AQI ${worst.averageAqi})` : 'Early morning'}`,
    '',
    '## Top Daily Routine Actions',
    ...recs.routine.map((r, i) => `${i + 1}. **${r.title}**: ${r.action} (${r.exposureImpact})`),
    '',
    '## Indoor Air Actions',
    ...recs.indoor.map((r, i) => `${i + 1}. **${r.title}**: ${r.action}`),
    '',
    '## Sustainable Low-Emission Swaps',
    ...recs.swaps.map((r, i) => `${i + 1}. **${r.title}**: ${r.action} (${r.emissionsImpact})`),
    '',
    'Note: Smog Shield provides general public-health information, not personal medical advice. Consult a qualified doctor for breathing or heart symptoms.',
  ];
  return lines.join('\n');
}
