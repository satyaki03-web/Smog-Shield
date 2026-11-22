import { MAX_EXPOSURE_REDUCTION_PERCENT } from '../constants';
import type { AirReading, DirectImpactSummary, UserProfile } from '../types';

interface ImpactAccumulator {
  exposurePoints: number;
  weeklyCo2eKg: number;
  weeklyPm25Grams: number;
  breakdown: string[];
}

interface ChecklistImpactRule {
  readonly id: string;
  readonly weeklyCo2eKg: number;
  readonly weeklyPm25Grams: number;
  readonly exposurePoints: (profile: UserProfile) => number;
  readonly note: string;
}

const CHECKLIST_IMPACT_RULES: readonly ChecklistImpactRule[] = [
  {
    id: 'chk-home-filter',
    weeklyCo2eKg: 0,
    weeklyPm25Grams: 0,
    exposurePoints: () => 11,
    note: 'Checklist: Fitted N95 check and pre-filter cleaning adds ~11% exposure protection.',
  },
  {
    id: 'chk-rwa-leaves',
    weeklyCo2eKg: 6.5,
    weeklyPm25Grams: 12.0,
    exposurePoints: () => 4,
    note: 'Checklist: Composting colony leaves avoids ~12 g/week of open-burn PM2.5 smoke.',
  },
  {
    id: 'chk-rwa-guards',
    weeklyCo2eKg: 8.0,
    weeklyPm25Grams: 15.0,
    exposurePoints: () => 4,
    note: 'Checklist: Replacing guard wood bonfires with safe heaters avoids ~15 g/week night smoke.',
  },
  {
    id: 'chk-rwa-dust',
    weeklyCo2eKg: 0,
    weeklyPm25Grams: 5.0,
    exposurePoints: () => 3,
    note: 'Checklist: Wet sweeping and covered sand piles cuts local resuspended road dust.',
  },
  {
    id: 'chk-school-assembly',
    weeklyCo2eKg: 0,
    weeklyPm25Grams: 0,
    exposurePoints: (profile) => (profile.children > 0 ? 7 : 3),
    note: 'Checklist: Moving school assembly indoors protects children during morning inversion peaks.',
  },
  {
    id: 'chk-school-idling',
    weeklyCo2eKg: 4.5,
    weeklyPm25Grams: 2.6,
    exposurePoints: () => 3,
    note: 'Checklist: Zero-idling school gate cuts gate-side exhaust (~4.5 kg CO2e/week).',
  },
];

function applyProfileImpact(acc: ImpactAccumulator, profile: UserProfile): void {
  if (profile.hasPurifier) {
    acc.exposurePoints += 22;
    acc.breakdown.push('Bedroom HEPA purifier overnight (8 hrs): ~22% daily PM2.5 exposure reduction.');
  }

  if (profile.commute === 'publicTransit' || profile.commute === 'walkOrCycle' || profile.commute === 'workFromHome') {
    acc.weeklyCo2eKg += 7.5;
    acc.weeklyPm25Grams += 3.2;
    acc.exposurePoints += 6;
    acc.breakdown.push('Low-emission commute baseline: avoids ~7.5 kg CO2e and ~3.2 g tailpipe PM2.5 per week.');
  }

  if (profile.cookingFuel === 'induction') {
    acc.weeklyCo2eKg += 2.2;
    acc.weeklyPm25Grams += 1.4;
    acc.exposurePoints += 5;
    acc.breakdown.push('Electric/induction cooking: reduces indoor NO2/PM2.5 and avoids ~2.2 kg CO2e/week.');
  }
}

function applyAdoptedSwapsImpact(
  acc: ImpactAccumulator,
  profile: UserProfile,
  adopted: ReadonlySet<string>
): void {
  if (adopted.has('swap-commute')) {
    const co2Gain = profile.commute === 'car' ? 12.0 : 5.0;
    const pmGain = profile.commute === 'car' ? 4.5 : 2.8;
    acc.weeklyCo2eKg += co2Gain;
    acc.weeklyPm25Grams += pmGain;
    acc.exposurePoints += 12;
    acc.breakdown.push(
      `Commute swap adopted: cuts commute exposure ~12% and avoids ~${co2Gain.toFixed(1)} kg CO2e/week.`
    );
  } else if (adopted.has('swap-commute-keep')) {
    acc.exposurePoints += 8;
    acc.breakdown.push('Side-street low-emission routing adopted: ~8% lower roadway PM2.5 intake.');
  }

  if (adopted.has('swap-cooking')) {
    const isBiomass = profile.cookingFuel === 'biomassOrWood';
    acc.weeklyCo2eKg += isBiomass ? 14.0 : 3.0;
    acc.weeklyPm25Grams += isBiomass ? 18.0 : 1.5;
    acc.exposurePoints += isBiomass ? 20 : 6;
    acc.breakdown.push(
      isBiomass
        ? 'Clean cooking swap from biomass: cuts kitchen PM2.5 sharply (~20% daily drop, ~18 g PM2.5 avoided/week).'
        : 'Electric kettle/induction swap: lowers closed-kitchen combustion aerosols (~3.0 kg CO2e/week).'
    );
  }

  if (adopted.has('swap-waste-heating')) {
    acc.weeklyCo2eKg += 9.0;
    acc.weeklyPm25Grams += 14.0;
    acc.exposurePoints += 7;
    acc.breakdown.push('Preventing leaf burning and open bonfires: avoids ~14 g local PM2.5 smoke plumes per week.');
  }
}

function applyChecklistImpact(
  acc: ImpactAccumulator,
  profile: UserProfile,
  checked: ReadonlySet<string>
): void {
  for (const rule of CHECKLIST_IMPACT_RULES) {
    if (!checked.has(rule.id)) continue;
    acc.weeklyCo2eKg += rule.weeklyCo2eKg;
    acc.weeklyPm25Grams += rule.weeklyPm25Grams;
    acc.exposurePoints += rule.exposurePoints(profile);
    acc.breakdown.push(rule.note);
  }
}

/**
 * Quantifies estimated personal PM2.5 exposure reduction and weekly household/community
 * emissions avoided based on the Household profile, completed Checklist items, and adopted Swaps.
 */
export function calculateDirectImpact(
  profile: UserProfile,
  reading: AirReading,
  checkedIds: readonly string[],
  adoptedSwapIds: readonly string[]
): DirectImpactSummary {
  const checked = new Set(checkedIds);
  const adopted = new Set(adoptedSwapIds);

  const acc: ImpactAccumulator = {
    exposurePoints: 12,
    weeklyCo2eKg: 0,
    weeklyPm25Grams: 0,
    breakdown: [
      `Window-timed ventilation and avoiding peak smog in ${reading.city.name}: ~12% daily PM2.5 reduction.`,
    ],
  };

  applyProfileImpact(acc, profile);
  applyAdoptedSwapsImpact(acc, profile, adopted);
  applyChecklistImpact(acc, profile, checked);

  const exposureReductionPercent = Math.min(MAX_EXPOSURE_REDUCTION_PERCENT, Math.round(acc.exposurePoints));
  const roundedCo2 = Number(acc.weeklyCo2eKg.toFixed(1));
  const roundedPm25 = Number(acc.weeklyPm25Grams.toFixed(1));
  const activeActionsCount = checked.size + adopted.size;

  const headline =
    activeActionsCount === 0
      ? 'Check off Community Checklist items or adopt Swaps to track your household and neighbourhood impact.'
      : `${activeActionsCount} active ${activeActionsCount === 1 ? 'choice' : 'choices'} cutting personal PM2.5 intake by ~${exposureReductionPercent}% and avoiding ~${roundedCo2} kg CO2e/week.`;

  return {
    exposureReductionPercent,
    weeklyCo2eAvoidedKg: roundedCo2,
    weeklyLocalPm25AvoidedGrams: roundedPm25,
    activeActionsCount,
    headline,
    breakdown: acc.breakdown,
    methodology:
      'Estimates combine conservative public-health filtration factors (fitted N95, bedroom HEPA, clean cooking) with standard Indian urban commuter and biomass-burning emission factors. Exposure reduction is capped at 78% because ambient infiltration cannot reach zero.',
  };
}
