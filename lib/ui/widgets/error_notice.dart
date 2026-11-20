import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';

/// Calm inline notice for errors, offline fallback notices, or medical caution.
class ErrorNotice extends StatelessWidget {
  /// Creates an [ErrorNotice].
  const ErrorNotice({
    required this.message,
    this.isWarning = false,
    this.onRetry,
    super.key,
  });

  /// Plain-language message displayed in the notice box.
  final String message;

  /// Uses clay accent border when true; error border when false.
  final bool isWarning;

  /// Optional retry action button.
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final Color accent = isWarning ? colors.secondary : colors.error;
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: colors.surface,
          border: Border.all(color: accent, width: AppSpacing.borderSelected),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Icon(
                  isWarning ? Icons.info_outline : Icons.error_outline,
                  size: 20,
                  color: accent,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    message,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
            if (onRetry != null)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm),
                child: OutlinedButton(
                  onPressed: onRetry,
                  child: const Text(AppStrings.retryButton),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Persistent plain-language medical disclaimer shown on Today and Settings.
class MedicalDisclaimer extends StatelessWidget {
  /// Creates a [MedicalDisclaimer].
  const MedicalDisclaimer({super.key});

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border.all(color: colors.outline, width: AppSpacing.borderThin),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(Icons.local_hospital_outlined, size: 20, color: colors.secondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              AppStrings.medicalDisclaimer,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
