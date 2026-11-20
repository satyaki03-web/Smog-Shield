import 'air_reading.dart';
import 'aqi_band_info.dart';
import 'enums.dart';
import 'hourly_forecast.dart';
import 'recommendation.dart';
import 'user_profile.dart';

/// Complete deterministic snapshot passed to UI, exporter, and AI services.
class AirContext {
  /// Creates an immutable [AirContext].
  const AirContext({
    required this.profile,
    required this.reading,
    required this.bandInfo,
    required this.forecast,
    required this.vulnerabilityMultiplier,
    required this.whoIsAtRisk,
    required this.recommendations,
  });

  /// Current household profile.
  final UserProfile profile;

  /// Current air quality observation (live or manual).
  final AirReading reading;

  /// CPCB band metadata corresponding to [reading].
  final AqiBandInfo bandInfo;

  /// Hourly forecast with cleanest and worst 2-hour windows.
  final HourlyForecast forecast;

  /// Combined household vulnerability multiplier.
  final double vulnerabilityMultiplier;

  /// Plain-language summary of household members most at risk.
  final String whoIsAtRisk;

  /// Deterministically ranked list of all recommendations.
  final List<Recommendation> recommendations;

  /// Returns recommendations filtered to [category], preserving sort order.
  List<Recommendation> byCategory(RecommendationCategory category) {
    return recommendations
        .where((Recommendation item) => item.category == category)
        .toList(growable: false);
  }

  /// Returns the top [count] highest-priority recommendations across categories.
  List<Recommendation> topActions([int count = 3]) {
    if (recommendations.length <= count) {
      return List<Recommendation>.unmodifiable(recommendations);
    }
    return List<Recommendation>.unmodifiable(recommendations.sublist(0, count));
  }

  /// Returns a copy with selectively updated fields.
  AirContext copyWith({
    UserProfile? profile,
    AirReading? reading,
    AqiBandInfo? bandInfo,
    HourlyForecast? forecast,
    double? vulnerabilityMultiplier,
    String? whoIsAtRisk,
    List<Recommendation>? recommendations,
  }) {
    return AirContext(
      profile: profile ?? this.profile,
      reading: reading ?? this.reading,
      bandInfo: bandInfo ?? this.bandInfo,
      forecast: forecast ?? this.forecast,
      vulnerabilityMultiplier:
          vulnerabilityMultiplier ?? this.vulnerabilityMultiplier,
      whoIsAtRisk: whoIsAtRisk ?? this.whoIsAtRisk,
      recommendations: recommendations ?? this.recommendations,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is AirContext &&
            profile == other.profile &&
            reading == other.reading &&
            bandInfo == other.bandInfo &&
            forecast == other.forecast &&
            vulnerabilityMultiplier == other.vulnerabilityMultiplier &&
            whoIsAtRisk == other.whoIsAtRisk &&
            recommendations.length == other.recommendations.length;
  }

  @override
  int get hashCode => Object.hash(
        profile,
        reading,
        bandInfo,
        forecast,
        vulnerabilityMultiplier,
        whoIsAtRisk,
        Object.hashAll(recommendations),
      );
}
