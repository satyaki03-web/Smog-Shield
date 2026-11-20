import '../core/constants.dart';
import '../core/formatters.dart';
import '../models/impact_estimate.dart';

/// Pure Dart service computing transparent exposure and emission estimates.
class ImpactService {
  /// Creates an [ImpactService].
  const ImpactService();

  /// Computes daily cigarette-equivalent PM2.5 exposure estimate.
  double cigaretteEquivalents(double pm25) {
    if (!pm25.isFinite || pm25 <= 0.0) {
      return 0.0;
    }
    return pm25 / AppConstants.pm25PerCigaretteDaily;
  }

  /// Estimates exposure saved by wearing a well-fitted N95 mask outdoors.
  ImpactEstimate n95MaskImpact(double pm25) {
    final double safePm25 = pm25.isFinite && pm25 > 0.0 ? pm25 : 0.0;
    final double savedPm25 = safePm25 * AppConstants.n95FiltrationFraction;
    final double savedCigs = cigaretteEquivalents(savedPm25);
    return ImpactEstimate(
      reason:
          'A snug N95 respirator blocks most fine PM2.5 particles before they reach deep lung tissue.',
      quantifiedEstimate:
          'Estimated PM2.5 reduction: about ${AppFormatters.formatPercent(AppConstants.n95FiltrationFraction)} '
          'while worn (roughly ${AppFormatters.formatOneDecimal(savedCigs)} cigarette-equivalents/day equivalent rate at '
          '${AppFormatters.formatOneDecimal(safePm25)} ug/m3).',
      assumptionsNote:
          'Estimate assumes 85% real-world N95 fit efficiency and Berkeley Earth rule of thumb (22 ug/m3 PM2.5 per day = 1 cigarette). Not a medical claim.',
    );
  }

  /// Estimates exposure reduction from shifting outdoor time to cleaner hours.
  ImpactEstimate cleanerWindowImpact({
    required int worstAqi,
    required int cleanestAqi,
  }) {
    final int diff = worstAqi > cleanestAqi ? worstAqi - cleanestAqi : 0;
    return ImpactEstimate(
      reason:
          'Winter inversion traps smog near the ground early morning and late night; afternoon mixing lowers concentrations.',
      quantifiedEstimate: diff > 0
          ? 'Estimated AQI drop of about $diff points by shifting trips or ventilation to the cleanest 2-hour window.'
          : 'Estimated steady exposure today; keeping trips brief still reduces cumulative inhaled particles.',
      assumptionsNote:
          'Estimate compares the lowest and highest 2-hour forecast averages from Open-Meteo hourly data.',
    );
  }

  /// Estimates indoor PM2.5 reduction from a HEPA or DIY box-fan purifier.
  ImpactEstimate purifierImpact(double outdoorPm25, {required bool isDiy}) {
    final double safePm25 =
        outdoorPm25.isFinite && outdoorPm25 > 0.0 ? outdoorPm25 : 0.0;
    final double fraction = isDiy
        ? AppConstants.diyPurifierReductionFraction
        : AppConstants.purifierReductionFraction;
    final double reducedPm25 = safePm25 * fraction;
    return ImpactEstimate(
      reason: isDiy
          ? 'A box fan taped to a MERV-13 filter traps fine soot indoors at a fraction of commercial purifier cost.'
          : 'A correctly sized HEPA purifier cycles bedroom air several times an hour while windows stay shut.',
      quantifiedEstimate:
          'Estimated indoor PM2.5 cut: about ${AppFormatters.formatPercent(fraction)} '
          '(roughly ${AppFormatters.formatOneDecimal(reducedPm25)} ug/m3 lower in a sealed room).',
      assumptionsNote:
          'Estimate assumes closed doors and windows, proper fan sealing, and clean filters. Actual reduction varies by room leakage.',
    );
  }

  /// Estimates indoor smoke reduction from moving away from biomass or burning.
  ImpactEstimate cleanFuelImpact() {
    return ImpactEstimate(
      reason:
          'Biomass, wood, coal, and incense release concentrated PM2.5 right inside living rooms where families breathe.',
      quantifiedEstimate:
          'Estimated kitchen PM2.5 cut: about ${AppFormatters.formatPercent(AppConstants.cleanCookingReductionFraction)} '
          'when switching from wood or biomass to induction, PNG, or LPG with exhaust.',
      assumptionsNote:
          'Rule-of-thumb household air pollution estimate based on clean-cooking transition studies. Varies with kitchen ventilation.',
    );
  }

  /// Estimates daily city emission savings for commute swaps.
  ImpactEstimate commuteSwapImpact({
    required double co2KgSavedPerDay,
    required String comparisonLabel,
  }) {
    final double safeKg =
        co2KgSavedPerDay.isFinite && co2KgSavedPerDay > 0.0
            ? co2KgSavedPerDay
            : 0.0;
    final double monthlyKg = safeKg * 22.0;
    return ImpactEstimate(
      reason:
          'Replacing tailpipe trips cuts both local roadside PM2.5/NO2 and city-wide winter smog build-up.',
      quantifiedEstimate:
          'Estimated emissions avoided: about ${AppFormatters.formatOneDecimal(safeKg)} kg CO2/day '
          '(roughly ${AppFormatters.formatOneDecimal(monthlyKg)} kg/month) for $comparisonLabel.',
      assumptionsNote:
          'Estimate assumes a 15 km round-trip weekday commute (22 days/month) using typical Indian urban emission factors.',
    );
  }

  /// General low-cost habit estimate for sealing, damp mopping, or waste bans.
  ImpactEstimate generalHabitImpact({
    required String reason,
    required String estimate,
    required String assumptions,
  }) {
    return ImpactEstimate(
      reason: reason,
      quantifiedEstimate: estimate,
      assumptionsNote: assumptions,
    );
  }
}
