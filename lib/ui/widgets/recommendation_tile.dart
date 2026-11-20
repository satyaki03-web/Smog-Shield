import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../models/enums.dart';
import '../../models/recommendation.dart';
import 'impact_note.dart';

/// Flat editorial card displaying a ranked [Recommendation] and its [ImpactNote].
class RecommendationTile extends StatelessWidget {
  /// Creates a [RecommendationTile].
  const RecommendationTile({
    required this.recommendation,
    this.showImpact = true,
    super.key,
  });

  /// Recommendation to render.
  final Recommendation recommendation;

  /// Whether to show the full impact breakdown below the action text.
  final bool showImpact;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final TextTheme textTheme = Theme.of(context).textTheme;
    final bool isUrgent = recommendation.priority == ActionPriority.critical;
    final Color priorityColor = isUrgent ? colors.secondary : colors.primary;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border.all(color: colors.outline, width: AppSpacing.borderThin),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  '${recommendation.category.label} | ${recommendation.priority.label} priority',
                  style: textTheme.labelMedium?.copyWith(
                    color: priorityColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(recommendation.title, style: textTheme.titleMedium),
                const SizedBox(height: AppSpacing.sm),
                Text(recommendation.actionDetail, style: textTheme.bodyMedium),
                if (recommendation.personalizedNote != null &&
                    recommendation.personalizedNote!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.sm),
                    child: Text(
                      recommendation.personalizedNote!,
                      style: textTheme.bodySmall?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (showImpact) ImpactNote(impact: recommendation.impact),
        ],
      ),
    );
  }
}
