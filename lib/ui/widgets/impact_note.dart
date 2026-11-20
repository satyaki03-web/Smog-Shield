import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/impact_estimate.dart';

/// Displays "Why this helps" and "How we estimated this" for a recommendation.
class ImpactNote extends StatelessWidget {
  /// Creates an [ImpactNote] rendering [impact].
  const ImpactNote({required this.impact, super.key});

  /// Transparent exposure or emission impact estimate.
  final ImpactEstimate impact;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.sm + 4),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: colors.outline, width: AppSpacing.borderThin),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            DashboardStrings.whyThisHelps,
            style: textTheme.labelLarge?.copyWith(
              color: colors.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(impact.reason, style: textTheme.bodySmall),
          const SizedBox(height: AppSpacing.xs),
          Text(
            impact.quantifiedEstimate,
            style: textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            DashboardStrings.howWeEstimated,
            style: textTheme.labelMedium?.copyWith(
              color: colors.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            impact.assumptionsNote,
            style: textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
