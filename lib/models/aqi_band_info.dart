import 'enums.dart';

/// Plain-language metadata and risk weighting for a CPCB [AqiBand].
class AqiBandInfo {
  /// Creates an immutable [AqiBandInfo].
  const AqiBandInfo({
    required this.band,
    required this.rangeLabel,
    required this.advice,
    required this.maskGuidance,
    required this.baseRiskMultiplier,
  });

  /// The CPCB AQI band enum.
  final AqiBand band;

  /// Numeric range string such as `201 to 300`.
  final String rangeLabel;

  /// Plain-language daily guidance for families.
  final String advice;

  /// Practical mask recommendation for this band.
  final String maskGuidance;

  /// Baseline band multiplier used before adding household risk factors.
  final double baseRiskMultiplier;

  /// Returns a copy with selectively replaced fields.
  AqiBandInfo copyWith({
    AqiBand? band,
    String? rangeLabel,
    String? advice,
    String? maskGuidance,
    double? baseRiskMultiplier,
  }) {
    return AqiBandInfo(
      band: band ?? this.band,
      rangeLabel: rangeLabel ?? this.rangeLabel,
      advice: advice ?? this.advice,
      maskGuidance: maskGuidance ?? this.maskGuidance,
      baseRiskMultiplier: baseRiskMultiplier ?? this.baseRiskMultiplier,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is AqiBandInfo &&
            band == other.band &&
            rangeLabel == other.rangeLabel &&
            advice == other.advice &&
            maskGuidance == other.maskGuidance &&
            baseRiskMultiplier == other.baseRiskMultiplier;
  }

  @override
  int get hashCode => Object.hash(
        band,
        rangeLabel,
        advice,
        maskGuidance,
        baseRiskMultiplier,
      );
}
