/// Transparent, non-medical estimate of why a recommendation matters.
class ImpactEstimate {
  /// Creates an immutable [ImpactEstimate].
  const ImpactEstimate({
    required this.reason,
    required this.quantifiedEstimate,
    required this.assumptionsNote,
  });

  /// Plain-language explanation of how the action lowers exposure or emissions.
  final String reason;

  /// Quantified rule-of-thumb figure always clearly labelled as an estimate.
  final String quantifiedEstimate;

  /// Explicit assumptions behind the estimate so users understand limits.
  final String assumptionsNote;

  /// Returns a copy with selectively updated fields.
  ImpactEstimate copyWith({
    String? reason,
    String? quantifiedEstimate,
    String? assumptionsNote,
  }) {
    return ImpactEstimate(
      reason: reason ?? this.reason,
      quantifiedEstimate: quantifiedEstimate ?? this.quantifiedEstimate,
      assumptionsNote: assumptionsNote ?? this.assumptionsNote,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is ImpactEstimate &&
            reason == other.reason &&
            quantifiedEstimate == other.quantifiedEstimate &&
            assumptionsNote == other.assumptionsNote;
  }

  @override
  int get hashCode =>
      Object.hash(reason, quantifiedEstimate, assumptionsNote);
}
