import 'enums.dart';
import 'impact_estimate.dart';

/// Immutable recommended action produced by the deterministic rule engine.
class Recommendation {
  /// Creates an immutable [Recommendation].
  const Recommendation({
    required this.id,
    required this.category,
    required this.priority,
    required this.title,
    required this.actionDetail,
    required this.impact,
    this.personalizedNote,
  });

  /// Stable unique identifier used for deterministic sorting and AI mapping.
  final String id;

  /// Category grouping (Routine, Indoor Air, or Swaps).
  final RecommendationCategory category;

  /// Priority level for ranked ordering.
  final ActionPriority priority;

  /// Short, actionable headline.
  final String title;

  /// Specific practical step tailored to the household and AQI band.
  final String actionDetail;

  /// Transparent exposure or emission impact estimate.
  final ImpactEstimate impact;

  /// Optional AI-personalized wording attached without changing facts.
  final String? personalizedNote;

  /// Returns a copy with selectively updated fields.
  Recommendation copyWith({
    String? id,
    RecommendationCategory? category,
    ActionPriority? priority,
    String? title,
    String? actionDetail,
    ImpactEstimate? impact,
    String? personalizedNote,
  }) {
    return Recommendation(
      id: id ?? this.id,
      category: category ?? this.category,
      priority: priority ?? this.priority,
      title: title ?? this.title,
      actionDetail: actionDetail ?? this.actionDetail,
      impact: impact ?? this.impact,
      personalizedNote: personalizedNote ?? this.personalizedNote,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is Recommendation &&
            id == other.id &&
            category == other.category &&
            priority == other.priority &&
            title == other.title &&
            actionDetail == other.actionDetail &&
            impact == other.impact &&
            personalizedNote == other.personalizedNote;
  }

  @override
  int get hashCode => Object.hash(
        id,
        category,
        priority,
        title,
        actionDetail,
        impact,
        personalizedNote,
      );
}
