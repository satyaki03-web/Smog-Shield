import { CITIES, DIURNAL_SMOG_MULTIPLIERS, MAX_AQI } from '../constants';
import type {
  AqiBand,
  BandInfo,
  CityInfo,
  HourlyPoint,
  TimeOfDaySlot,
  TimeWindow,
  UserProfile,
} from '../types';

/** Resolves a curated city by its identifier, falling back to Delhi. */
export function getCityById(id: string): CityInfo {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}

/** Classifies a numeric AQI reading (0 to 500) into its Indian CPCB severity band. */
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
    summary: 'Health alert for everyone. Keep windows sealed outside brief low-smog airing and avoid outdoor exertion.',
    maskGuidance: 'Strict N95 or FFP2 mask for unavoidable travel; avoid outdoor play for children.',
    cssVar: 'var(--band-severe)',
    shape: 'alertHex',
  };
}

/** Computes a bounded household sensitivity multiplier (1.00x to 2.00x). */
export function getVulnerabilityMultiplier(profile: UserProfile): number {
  let factor = 1.0;
  if (profile.children > 0) factor += 0.25;
  if (profile.elders > 0) factor += 0.25;
  if (profile.sensitivities.includes('asthma') || profile.sensitivities.includes('copd')) factor += 0.35;
  if (profile.sensitivities.includes('heart')) factor += 0.25;
  if (profile.sensitivities.includes('pregnancy')) factor += 0.2;
  return Math.min(2.0, Number(factor.toFixed(2)));
}

/** Generates concise, plain-language at-risk summaries for the active household. */
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

/** Formats a Date instance into a 12-hour clock label (for example, "6:00 PM"). */
export function formatHourLabel(date: Date): string {
  const h = date.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${suffix}`;
}

/** Maps a 24-hour clock hour (0 to 23) to a human-friendly time-of-day label. */
export function getTimeOfDaySlot(hour24: number): TimeOfDaySlot {
  const normalized = ((Math.floor(hour24) % 24) + 24) % 24;
  if (normalized >= 5 && normalized <= 10) return 'morning';
  if (normalized >= 11 && normalized <= 13) return 'midday';
  if (normalized >= 14 && normalized <= 16) return 'afternoon';
  if (normalized >= 17 && normalized <= 20) return 'evening';
  return 'night';
}

/** Builds a deterministic 24-hour diurnal winter smog curve for offline or manual readings. */
export function buildFallbackHourly(
  baseAqi: number,
  basePm25: number,
  basePm10: number,
  referenceNow: Date = new Date()
): HourlyPoint[] {
  const now = new Date(referenceNow.getTime());
  now.setMinutes(0, 0, 0);
  const points: HourlyPoint[] = [];
  for (let i = 0; i < 24; i++) {
    const t = new Date(now.getTime() + i * 3600 * 1000);
    const hour24 = t.getHours();
    const m = DIURNAL_SMOG_MULTIPLIERS[hour24];
    points.push({
      timeIso: t.toISOString(),
      hourLabel: formatHourLabel(t),
      hour24,
      aqi: Math.min(MAX_AQI, Math.max(15, Math.round(baseAqi * m))),
      pm25: Math.max(5, Math.round(basePm25 * m)),
      pm10: Math.max(10, Math.round(basePm10 * m)),
    });
  }
  return points;
}

/** Identifies the cleanest and peak 2-hour windows from an hourly AQI forecast array. */
export function findTwoHourWindows(hourly: readonly HourlyPoint[]): {
  cleanest: TimeWindow | null;
  worst: TimeWindow | null;
} {
  if (hourly.length === 0) return { cleanest: null, worst: null };
  if (hourly.length === 1) {
    const single: TimeWindow = {
      startLabel: hourly[0].hourLabel,
      endLabel: hourly[0].hourLabel,
      startHour: hourly[0].hour24,
      timeOfDay: getTimeOfDaySlot(hourly[0].hour24),
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
      startHour: hourly[bestIdx].hour24,
      timeOfDay: getTimeOfDaySlot(hourly[bestIdx].hour24),
      averageAqi: bestAvg,
    },
    worst: {
      startLabel: hourly[worstIdx].hourLabel,
      endLabel: endLabelFor(worstIdx),
      startHour: hourly[worstIdx].hour24,
      timeOfDay: getTimeOfDaySlot(hourly[worstIdx].hour24),
      averageAqi: worstAvg,
    },
  };
}
