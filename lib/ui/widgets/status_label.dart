import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../models/enums.dart';
import '../theme/app_colors.dart';

/// Displays a CPCB [AqiBand] using color, a distinct shape icon, and text label.
class StatusLabel extends StatelessWidget {
  /// Creates a [StatusLabel] for [band].
  const StatusLabel({
    required this.band,
    this.rangeLabel,
    super.key,
  });

  /// CPCB band to display.
  final AqiBand band;

  /// Optional numeric range string shown beside the band label.
  final String? rangeLabel;

  @override
  Widget build(BuildContext context) {
    final Brightness brightness = Theme.of(context).brightness;
    final Color bandColor = AppColors.bandColor(band, brightness);
    final TextTheme textTheme = Theme.of(context).textTheme;
    final String label =
        rangeLabel != null ? '${band.label} ($rangeLabel)' : band.label;

    return Semantics(
      label: 'Air quality band $label',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm + 2,
          vertical: AppSpacing.xs + 2,
        ),
        decoration: BoxDecoration(
          border: Border.all(color: bandColor, width: AppSpacing.borderSelected),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(AppColors.bandIcon(band), size: 18, color: bandColor),
            const SizedBox(width: AppSpacing.xs + 2),
            Flexible(
              child: Text(
                label,
                style: textTheme.labelLarge?.copyWith(
                  color: bandColor,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
