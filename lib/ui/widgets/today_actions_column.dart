import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/air_context.dart';
import '../../models/plan_narrative.dart';
import '../../models/recommendation.dart';
import 'recommendation_tile.dart';
import 'today_narrative_card.dart';

/// Right editorial column on Today: AI summary, export actions, and top 3 steps.
class TodayActionsColumn extends StatelessWidget {
  /// Creates a [TodayActionsColumn].
  const TodayActionsColumn({
    required this.airContext,
    required this.narrative,
    required this.isPersonalizing,
    required this.aiErrorMessage,
    required this.onPersonalizeAi,
    required this.onCopyPlan,
    required this.onSharePlan,
    required this.onOpenChecklist,
    super.key,
  });

  /// Active deterministic air quality context.
  final AirContext airContext;

  /// Offline or Gemini-personalized narrative.
  final PlanNarrative? narrative;

  /// True while a Gemini request is in progress.
  final bool isPersonalizing;

  /// Optional AI rate-limit or error message.
  final String? aiErrorMessage;

  /// Triggers explicit AI wording personalization.
  final VoidCallback onPersonalizeAi;

  /// Copies Markdown plan to clipboard.
  final VoidCallback onCopyPlan;

  /// Shares Markdown plan via platform share sheet.
  final VoidCallback onSharePlan;

  /// Opens the RWA and school community checklist.
  final VoidCallback onOpenChecklist;

  @override
  Widget build(BuildContext context) {
    final List<Recommendation> top = airContext.topActions(3);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        TodayNarrativeCard(
          narrative: narrative,
          isPersonalizing: isPersonalizing,
          aiErrorMessage: aiErrorMessage,
          onPersonalizeAi: onPersonalizeAi,
        ),
        const SizedBox(height: AppSpacing.md),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: <Widget>[
            OutlinedButton.icon(
              onPressed: onCopyPlan,
              icon: const Icon(Icons.copy, size: 18),
              label: const Text(DashboardStrings.copyPlanButton),
            ),
            OutlinedButton.icon(
              onPressed: onSharePlan,
              icon: const Icon(Icons.share, size: 18),
              label: const Text(DashboardStrings.sharePlanButton),
            ),
            OutlinedButton.icon(
              onPressed: onOpenChecklist,
              icon: const Icon(Icons.checklist, size: 18),
              label: const Text(DashboardStrings.checklistButton),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          DashboardStrings.topActionsHeading,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: AppSpacing.sm),
        for (final Recommendation item in top) ...<Widget>[
          RecommendationTile(recommendation: item),
          const SizedBox(height: AppSpacing.md),
        ],
      ],
    );
  }
}
