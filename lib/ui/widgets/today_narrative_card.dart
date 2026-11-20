import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/plan_narrative.dart';
import 'error_notice.dart';

/// Editorial card showing the offline or Gemini-personalized household summary.
class TodayNarrativeCard extends StatelessWidget {
  /// Creates a [TodayNarrativeCard].
  const TodayNarrativeCard({
    required this.narrative,
    required this.isPersonalizing,
    required this.aiErrorMessage,
    required this.onPersonalizeAi,
    super.key,
  });

  /// Active plan narrative (offline or live AI).
  final PlanNarrative? narrative;

  /// True while a user-initiated Gemini request is in flight.
  final bool isPersonalizing;

  /// Optional rate-limit or AI error message.
  final String? aiErrorMessage;

  /// Triggered when the user clicks to personalize wording with Gemini.
  final VoidCallback onPersonalizeAi;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: colors.surface,
          border: Border.all(color: colors.outline),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(DashboardStrings.narrativeHeading, style: textTheme.labelLarge),
            const SizedBox(height: AppSpacing.xs),
            if (narrative != null) ...<Widget>[
              Text(narrative!.headline, style: textTheme.titleLarge),
              const SizedBox(height: AppSpacing.sm),
              Text(narrative!.summary, style: textTheme.bodyMedium),
              if (narrative!.isFallback)
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.sm),
                  child: Text(
                    AppStrings.fallbackAiNotice,
                    style: textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ),
            ],
            if (aiErrorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm),
                child: ErrorNotice(message: aiErrorMessage!, isWarning: true),
              ),
            const SizedBox(height: AppSpacing.md),
            FilledButton.icon(
              onPressed: isPersonalizing ? null : onPersonalizeAi,
              icon: const Icon(Icons.edit_note, size: 18),
              label: Text(
                isPersonalizing
                    ? AppStrings.loadingAiNote
                    : DashboardStrings.personalizeButton,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
