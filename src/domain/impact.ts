import { MAX_EXPOSURE_REDUCTION_PERCENT } from '../constants';
import type { AirReading, DirectImpactSummary, UserProfile } from '../types';

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

  let exposurePoints = 12; // Baseline timing-window ventilation and indoor exercise discipline
  let weeklyCo2eKg = 0;
  let weeklyPm25Grams = 0;
  const breakdown: string[] = [
    `Window-timed ventilation and avoiding peak smog in ${reading.city.name}: ~12% daily PM2.5 reduction.`,
  ];

  // Household profile baseline choices
  if (profile.hasPurifier) {
    exposurePoints += 22;
    breakdown.push('Bedroom HEPA purifier overnight (8 hrs): ~22% daily PM2.5 exposure reduction.');
  }

  if (profile.commute === 'publicTransit' || profile.commute === 'walkOrCycle' || profile.commute === 'workFromHome') {
    weeklyCo2eKg += 7.5;
    weeklyPm25Grams += 3.2;
    exposurePoints += 6;
    breakdown.push('Low-emission commute baseline: avoids ~7.5 kg CO2e and ~3.2 g tailpipe PM2.5 per week.');
  }

  if (profile.cookingFuel === 'induction') {
    weeklyCo2eKg += 2.2;
    weeklyPm25Grams += 1.4;
    exposurePoints += 5;
    breakdown.push('Electric/induction cooking: reduces indoor NO2/PM2.5 and avoids ~2.2 kg CO2e/week.');
  }

  // Adopted Swaps
  if (adopted.has('swap-commute')) {
    const co2Gain = profile.commute === 'car' ? 12.0 : 5.0;
    const pmGain = profile.commute === 'car' ? 4.5 : 2.8;
    weeklyCo2eKg += co2Gain;
    weeklyPm25Grams += pmGain;
    exposurePoints += 12;
    breakdown.push(
      `Commute swap adopted: cuts commute exposure ~12% and avoids ~${co2Gain.toFixed(1)} kg CO2e/week.`
    );
  } else if (adopted.has('swap-commute-keep')) {
    exposurePoints += 8;
    breakdown.push('Side-street low-emission routing adopted: ~8% lower roadway PM2.5 intake.');
  }

  if (adopted.has('swap-cooking')) {
    const isBiomass = profile.cookingFuel === 'biomassOrWood';
    const co2Gain = isBiomass ? 14.0 : 3.0;
    const pmGain = isBiomass ? 18.0 : 1.5;
    const expGain = isBiomass ? 20 : 6;
    weeklyCo2eKg += co2Gain;
    weeklyPm25Grams += pmGain;
    exposurePoints += expGain;
    breakdown.push(
      isBiomass
        ? 'Clean cooking swap from biomass: cuts kitchen PM2.5 sharply (~20% daily drop, ~18 g PM2.5 avoided/week).'
        : 'Electric kettle/induction swap: lowers closed-kitchen combustion aerosols (~3.0 kg CO2e/week).'
    );
  }

  if (adopted.has('swap-waste-heating')) {
    weeklyCo2eKg += 9.0;
    weeklyPm25Grams += 14.0;
    exposurePoints += 7;
    breakdown.push('Preventing leaf burning and open bonfires: avoids ~14 g local PM2.5 smoke plumes per week.');
  }

  // Completed Checklist items
  if (checked.has('chk-home-filter')) {
    exposurePoints += 11;
    breakdown.push('Checklist: Fitted N95 check and pre-filter cleaning adds ~11% exposure protection.');
  }
  if (checked.has('chk-rwa-leaves')) {
    weeklyCo2eKg += 6.5;
    weeklyPm25Grams += 12.0;
    exposurePoints += 4;
    breakdown.push('Checklist: Composting colony leaves avoids ~12 g/week of open-burn PM2.5 smoke.');
  }
  if (checked.has('chk-rwa-guards')) {
    weeklyCo2eKg += 8.0;
    weeklyPm25Grams += 15.0;
    exposurePoints += 4;
    breakdown.push('Checklist: Replacing guard wood bonfires with safe heaters avoids ~15 g/week night smoke.');
  }
  if (checked.has('chk-rwa-dust')) {
    weeklyPm25Grams += 5.0;
    exposurePoints += 3;
    breakdown.push('Checklist: Wet sweeping and covered sand piles cuts local resuspended road dust.');
  }
  if (checked.has('chk-school-assembly')) {
    exposurePoints += profile.children > 0 ? 7 : 3;
    breakdown.push('Checklist: Moving school assembly indoors protects children during morning inversion peaks.');
  }
  if (checked.has('chk-school-idling')) {
    weeklyCo2eKg += 4.5;
    weeklyPm25Grams += 2.6;
    exposurePoints += 3;
    breakdown.push('Checklist: Zero-idling school gate cuts gate-side exhaust (~4.5 kg CO2e/week).');
  }

  const exposureReductionPercent = Math.min(MAX_EXPOSURE_REDUCTION_PERCENT, Math.round(exposurePoints));
  const roundedCo2 = Number(weeklyCo2eKg.toFixed(1));
  const roundedPm25 = Number(weeklyPm25Grams.toFixed(1));
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
    breakdown,
    methodology:
      'Estimates combine conservative public-health filtration factors (fitted N95, bedroom HEPA, clean cooking) with standard Indian urban commuter and biomass-burning emission factors. Exposure reduction is capped at 78% because ambient infiltration cannot reach zero.',
  };
}
