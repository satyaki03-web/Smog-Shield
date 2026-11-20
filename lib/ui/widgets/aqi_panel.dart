import 'package:flutter/material.dart';

import '../../core/formatters.dart';
import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/air_context.dart';
import 'status_label.dart';

/// Editorial asymmetric AQI readout panel with full accessibility semantics.
class AqiPanel extends StatelessWidget {
  /// Creates an [AqiPanel] displaying [airContext].
  const AqiPanel({
    required this.airContext,
    required this.isLoading,
    required this.onRefresh,
    super.key,
  });

  /// Active air quality snapshot and band info.
  final AirContext airContext;

  /// True while a live refresh is running.
  final bool isLoading;

  /// Callback triggered by the refresh button.
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final TextTheme text = Theme.of(context).textTheme;
    final int aqi = airContext.reading.aqi;
    final String band = airContext.bandInfo.band.label;

    return Semantics(
      container: true,
      label: 'Air quality index $aqi, $band in ${airContext.reading.cityName}. '
          '${airContext.bandInfo.advice}',
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: colors.surface,
          border: Border.all(color: colors.outline),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            _AqiHeaderRow(
              cityName: airContext.reading.cityName,
              isManual: airContext.reading.isManual,
              isLoading: isLoading,
              onRefresh: onRefresh,
            ),
            const SizedBox(height: AppSpacing.md),
            Wrap(
              spacing: AppSpacing.md,
              runSpacing: AppSpacing.sm,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: <Widget>[
                Text('$aqi', style: text.displayLarge),
                StatusLabel(
                  band: airContext.bandInfo.band,
                  rangeLabel: airContext.bandInfo.rangeLabel,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Text(airContext.bandInfo.advice, style: text.bodyLarge),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
              child: Divider(),
            ),
            _PollutantMetaRow(airContext: airContext),
          ],
        ),
      ),
    );
  }
}

class _AqiHeaderRow extends StatelessWidget {
  const _AqiHeaderRow({
    required this.cityName,
    required this.isManual,
    required this.isLoading,
    required this.onRefresh,
  });

  final String cityName;
  final bool isManual;
  final bool isLoading;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final TextTheme text = Theme.of(context).textTheme;
    final ColorScheme colors = Theme.of(context).colorScheme;
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: <Widget>[
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(cityName, style: text.headlineMedium),
            Text(
              isManual ? 'Manual AQI entry' : 'Live Open-Meteo reading',
              style: text.bodySmall?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
        OutlinedButton.icon(
          onPressed: isLoading ? null : onRefresh,
          icon: const Icon(Icons.refresh, size: 18),
          label: Text(isLoading ? 'Updating' : DashboardStrings.refreshButton),
        ),
      ],
    );
  }
}

class _PollutantMetaRow extends StatelessWidget {
  const _PollutantMetaRow({required this.airContext});

  final AirContext airContext;

  @override
  Widget build(BuildContext context) {
    final TextTheme text = Theme.of(context).textTheme;
    final TextStyle? muted =
        text.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant);
    return Wrap(
      spacing: AppSpacing.lg,
      runSpacing: AppSpacing.xs,
      children: <Widget>[
        Text('PM2.5: ${AppFormatters.formatOneDecimal(airContext.reading.pm25)} ug/m3', style: text.bodySmall),
        Text('PM10: ${AppFormatters.formatOneDecimal(airContext.reading.pm10)} ug/m3', style: text.bodySmall),
        Text('Risk factor: ${airContext.vulnerabilityMultiplier}x', style: muted),
        Text('Observed: ${AppFormatters.formatTimestamp(airContext.reading.observedAt)}', style: muted),
      ],
    );
  }
}
