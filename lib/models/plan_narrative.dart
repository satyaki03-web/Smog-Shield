/// Personalized narrative produced by Gemini or the offline fallback service.
class PlanNarrative {
  /// Creates an immutable [PlanNarrative].
  const PlanNarrative({
    required this.headline,
    required this.summary,
    required this.itemNotes,
    required this.isFallback,
    required this.generatedAt,
  });

  /// Short contextual headline tailored to the household and AQI band.
  final String headline;

  /// Two to three sentence plain-language summary of today's plan.
  final String summary;

  /// Map of recommendation ID to personalized note.
  final Map<String, String> itemNotes;

  /// True when generated offline without a live Gemini response.
  final bool isFallback;

  /// Timestamp when this narrative was produced.
  final DateTime generatedAt;

  /// Returns a copy with selectively updated fields.
  PlanNarrative copyWith({
    String? headline,
    String? summary,
    Map<String, String>? itemNotes,
    bool? isFallback,
    DateTime? generatedAt,
  }) {
    return PlanNarrative(
      headline: headline ?? this.headline,
      summary: summary ?? this.summary,
      itemNotes: itemNotes ?? this.itemNotes,
      isFallback: isFallback ?? this.isFallback,
      generatedAt: generatedAt ?? this.generatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is PlanNarrative &&
            headline == other.headline &&
            summary == other.summary &&
            _mapEquals(itemNotes, other.itemNotes) &&
            isFallback == other.isFallback &&
            generatedAt == other.generatedAt;
  }

  @override
  int get hashCode => Object.hash(
        headline,
        summary,
        Object.hashAllUnordered(
          itemNotes.entries.map(
            (MapEntry<String, String> e) => Object.hash(e.key, e.value),
          ),
        ),
        isFallback,
        generatedAt,
      );

  static bool _mapEquals(Map<String, String> a, Map<String, String> b) {
    if (a.length != b.length) {
      return false;
    }
    for (final MapEntry<String, String> entry in a.entries) {
      if (b[entry.key] != entry.value) {
        return false;
      }
    }
    return true;
  }
}
