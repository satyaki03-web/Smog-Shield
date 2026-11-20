import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../models/air_context.dart';
import '../../models/plan_narrative.dart';
import 'error_notice.dart';
import 'today_actions_column.dart';
import 'today_primary_column.dart';

/// Today tab presenting an asymmetric editorial layout for live smog guidance.
class TodayTab extends StatelessWidget {
  /// Creates a [TodayTab].
  const TodayTab({
    required this.airContext,
    required this.narrative,
    required this.isLoadingAir,
    required this.isPersonalizing,
    required this.airErrorMessage,
    required this.aiErrorMessage,
    required this.onRefreshAir,
    required this.onPersonalizeAi,
    required this.onCopyPlan,
    required this.onSharePlan,
    required this.onOpenChecklist,
    super.key,
  });

  /// Active deterministic context.
  final AirContext airContext;

  /// Current narrative (offline fallback or Gemini personalized).
  final PlanNarrative? narrative;

  /// True while air readings are refreshing.
  final bool isLoadingAir;

  /// True while Gemini personalization is loading.
  final bool isPersonalizing;

  /// Optional air fetch error message.
  final String? airErrorMessage;

  /// Optional AI error or rate-limit message.
  final String? aiErrorMessage;

  /// Refreshes live air data.
  final VoidCallback onRefreshAir;

  /// Triggers explicit AI personalization.
  final VoidCallback onPersonalizeAi;

  /// Copies Markdown plan to clipboard.
  final VoidCallback onCopyPlan;

  /// Shares Markdown plan via platform sheet.
  final VoidCallback onSharePlan;

  /// Opens the RWA and school community checklist.
  final VoidCallback onOpenChecklist;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext ctx, BoxConstraints constraints) {
        final bool isWide = constraints.maxWidth >= AppSpacing.splitBreakpoint;
        final Widget left = TodayPrimaryColumn(
          airContext: airContext,
          isLoadingAir: isLoadingAir,
          airErrorMessage: airErrorMessage,
          onRefreshAir: onRefreshAir,
        );
        final Widget right = TodayActionsColumn(
          airContext: airContext,
          narrative: narrative,
          isPersonalizing: isPersonalizing,
          aiErrorMessage: aiErrorMessage,
          onPersonalizeAi: onPersonalizeAi,
          onCopyPlan: onCopyPlan,
          onSharePlan: onSharePlan,
          onOpenChecklist: onOpenChecklist,
        );
        return SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              if (isWide)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Expanded(flex: 5, child: left),
                    const SizedBox(width: AppSpacing.lg),
                    Expanded(flex: 6, child: right),
                  ],
                )
              else ...<Widget>[
                left,
                const SizedBox(height: AppSpacing.lg),
                right,
              ],
              const SizedBox(height: AppSpacing.lg),
              const MedicalDisclaimer(),
            ],
          ),
        );
      },
    );
  }
}
