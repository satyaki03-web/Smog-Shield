import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/air_context.dart';
import 'aqi_panel.dart';
import 'error_notice.dart';
import 'hourly_strip.dart';

/// Left editorial column on Today: alerts, AQI readout, risk summary, and forecast strip.
class TodayPrimaryColumn extends StatelessWidget {
  /// Creates a [TodayPrimaryColumn].
  const TodayPrimaryColumn({
    required this.airContext,
    required this.isLoadingAir,
    required this.airErrorMessage,
    required this.onRefreshAir,
    super.key,
  });

  /// Active air quality context.
  final AirContext airContext;

  /// True while air data is loading.
  final bool isLoadingAir;

  /// Optional live-fetch error message.
  final String? airErrorMessage;

  /// Refreshes live air quality readings.
  final VoidCallback onRefreshAir;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        if (airErrorMessage != null) ...<Widget>[
          ErrorNotice(message: airErrorMessage!, onRetry: onRefreshAir),
          const SizedBox(height: AppSpacing.md),
        ],
        if (airContext.reading.isManual) ...<Widget>[
          const ErrorNotice(
            message: AppStrings.manualAqiNotice,
            isWarning: true,
          ),
          const SizedBox(height: AppSpacing.md),
        ],
        AqiPanel(
          airContext: airContext,
          isLoading: isLoadingAir,
          onRefresh: onRefreshAir,
        ),
        const SizedBox(height: AppSpacing.md),
        Container(
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
              Text(DashboardStrings.riskHeading, style: textTheme.titleLarge),
              const SizedBox(height: AppSpacing.sm),
              Text(airContext.whoIsAtRisk, style: textTheme.bodyMedium),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        HourlyStrip(forecast: airContext.forecast),
      ],
    );
  }
}
