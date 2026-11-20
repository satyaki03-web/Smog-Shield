import 'package:flutter/material.dart';

import '../../core/formatters.dart';
import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/hourly_forecast.dart';

/// Displays the cleanest and worst 2-hour windows for the next 24 hours.
class HourlyStrip extends StatelessWidget {
  /// Creates an [HourlyStrip] for [forecast].
  const HourlyStrip({required this.forecast, super.key});

  /// Forecast snapshot with precomputed cleanest and worst windows.
  final HourlyForecast forecast;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final TextTheme textTheme = Theme.of(context).textTheme;
    final TimeWindow? cleanest = forecast.cleanestWindow;
    final TimeWindow? worst = forecast.worstWindow;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border.all(color: colors.outline, width: AppSpacing.borderThin),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(DashboardStrings.hoursHeading, style: textTheme.titleLarge),
          const SizedBox(height: AppSpacing.sm),
          if (cleanest == null || worst == null)
            Text(
              DashboardStrings.noForecastWindow,
              style: textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
              ),
            )
          else
            _WindowSummaryColumn(cleanest: cleanest, worst: worst),
        ],
      ),
    );
  }
}

class _WindowSummaryColumn extends StatelessWidget {
  const _WindowSummaryColumn({
    required this.cleanest,
    required this.worst,
  });

  final TimeWindow cleanest;
  final TimeWindow worst;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        _WindowRow(
          icon: Icons.air,
          accent: colors.primary,
          label: DashboardStrings.cleanestWindowLabel,
          window: cleanest,
        ),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
          child: Divider(),
        ),
        _WindowRow(
          icon: Icons.warning_amber_rounded,
          accent: colors.secondary,
          label: DashboardStrings.worstWindowLabel,
          window: worst,
        ),
      ],
    );
  }
}

class _WindowRow extends StatelessWidget {
  const _WindowRow({
    required this.icon,
    required this.accent,
    required this.label,
    required this.window,
  });

  final IconData icon;
  final Color accent;
  final String label;
  final TimeWindow window;

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    final String range = AppFormatters.formatWindow(window.start, window.end);
    return Semantics(
      label: '$label: $range, average AQI ${window.averageAqi}',
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, size: 20, color: accent),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  label,
                  style: textTheme.labelLarge?.copyWith(
                    color: accent,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  '$range (avg AQI ${window.averageAqi})',
                  style: textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
