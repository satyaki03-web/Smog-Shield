import '../core/constants.dart';
import '../models/aqi_band_info.dart';
import '../models/enums.dart';
import '../models/user_profile.dart';

/// Pure Dart service mapping AQI values to CPCB bands and household risk.
class AqiService {
  /// Creates an [AqiService] with an optional injectable clock.
  AqiService({DateTime Function()? now}) : _now = now ?? DateTime.now;

  final DateTime Function() _now;

  /// Current clock timestamp exposed for deterministic rule timestamps.
  DateTime currentTime() => _now();

  /// Clamps a raw numeric AQI value safely into `[0, 999]`, handling NaN.
  int normalizeAqi(num rawAqi) {
    final double value = rawAqi.toDouble();
    if (!value.isFinite || value <= AppConstants.aqiMin) {
      return AppConstants.aqiMin;
    }
    if (value >= AppConstants.aqiMax) {
      return AppConstants.aqiMax;
    }
    return value.round();
  }

  /// Maps [rawAqi] to the corresponding CPCB [AqiBand].
  AqiBand bandForAqi(num rawAqi) {
    final int aqi = normalizeAqi(rawAqi);
    if (aqi <= AppConstants.aqiGoodMax) {
      return AqiBand.good;
    }
    if (aqi <= AppConstants.aqiSatisfactoryMax) {
      return AqiBand.satisfactory;
    }
    if (aqi <= AppConstants.aqiModerateMax) {
      return AqiBand.moderate;
    }
    if (aqi <= AppConstants.aqiPoorMax) {
      return AqiBand.poor;
    }
    if (aqi <= AppConstants.aqiVeryPoorMax) {
      return AqiBand.veryPoor;
    }
    return AqiBand.severe;
  }

  /// Returns plain-language metadata for a given CPCB [band].
  AqiBandInfo infoForBand(AqiBand band) {
    return switch (band) {
      AqiBand.good => const AqiBandInfo(
          band: AqiBand.good,
          rangeLabel: '0 to 50',
          advice: 'Air is clean. Normal outdoor play, walks, and cross-ventilation are comfortable for everyone.',
          maskGuidance: 'No mask needed for air pollution.',
          baseRiskMultiplier: 1.0,
        ),
      AqiBand.satisfactory => const AqiBandInfo(
          band: AqiBand.satisfactory,
          rangeLabel: '51 to 100',
          advice: 'Acceptable air for most people. Sensitive groups should avoid heavy exercise next to busy roads.',
          maskGuidance: 'Optional for very sensitive lungs along high-traffic roads.',
          baseRiskMultiplier: 1.1,
        ),
      AqiBand.moderate => const AqiBandInfo(
          band: AqiBand.moderate,
          rangeLabel: '101 to 200',
          advice: 'Dust and fine haze are rising. Shift vigorous outdoor workouts to cleaner hours and monitor sensitive members.',
          maskGuidance: 'Carry a well-fitted N95 mask for long commutes or sensitive members.',
          baseRiskMultiplier: 1.25,
        ),
      AqiBand.poor => const AqiBandInfo(
          band: AqiBand.poor,
          rangeLabel: '201 to 300',
          advice: 'Unhealthy for prolonged outdoor time. Move workouts indoors, close windows during smog peaks, and mask outdoors.',
          maskGuidance: 'Wear a fitted N95 or KN95 mask for commutes and errands.',
          baseRiskMultiplier: 1.45,
        ),
      AqiBand.veryPoor => const AqiBandInfo(
          band: AqiBand.veryPoor,
          rangeLabel: '301 to 400',
          advice: 'Heavy smog causes breathing strain quickly. Cancel outdoor exercise, keep children and elders indoors, and seal leaks.',
          maskGuidance: 'Fitted N95 or N99 mask strongly advised for every outdoor trip.',
          baseRiskMultiplier: 1.75,
        ),
      AqiBand.severe => const AqiBandInfo(
          band: AqiBand.severe,
          rangeLabel: '401+',
          advice: 'Emergency smog conditions affect healthy adults too. Stay indoors, run filtration if available, and postpone non-essential trips.',
          maskGuidance: 'Well-sealed N95 or N99 mask essential whenever stepping outside.',
          baseRiskMultiplier: 2.0,
        ),
    };
  }

  /// Computes a capped household vulnerability multiplier for [profile].
  double vulnerabilityMultiplier(UserProfile profile, AqiBand band) {
    double factor = infoForBand(band).baseRiskMultiplier;
    if (profile.childrenUnder12 > 0) {
      factor += AppConstants.childRiskIncrement;
    }
    if (profile.eldersOver60 > 0) {
      factor += AppConstants.elderRiskIncrement;
    }
    factor += profile.sensitivities.length * AppConstants.sensitivityRiskIncrement;
    if (factor > AppConstants.maxVulnerabilityMultiplier) {
      return AppConstants.maxVulnerabilityMultiplier;
    }
    return double.parse(factor.toStringAsFixed(2));
  }

  /// Builds a plain-language summary of who in [profile] is most at risk.
  String describeWhoIsAtRisk(UserProfile profile, AqiBand band) {
    final List<String> groups = <String>[];
    if (profile.childrenUnder12 > 0) {
      groups.add('children under 12');
    }
    if (profile.eldersOver60 > 0) {
      groups.add('adults over 60');
    }
    for (final Sensitivity item in profile.sensitivities) {
      groups.add('members with ${item.label.toLowerCase()}');
    }
    if (groups.isEmpty) {
      if (band == AqiBand.veryPoor || band == AqiBand.severe) {
        return 'Everyone in the household faces noticeable breathing strain at ${band.label} AQI.';
      }
      return 'Healthy adults face lower risk today, though roadside commuters should still limit smog exposure.';
    }
    return 'Highest priority today: ${groups.join(', ')}. Keep outdoor exposure brief and monitor for coughing or fatigue.';
  }
}
