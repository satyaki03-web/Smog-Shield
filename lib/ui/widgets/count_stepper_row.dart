import 'package:flutter/material.dart';

import '../../core/spacing.dart';

/// Accessible numeric stepper row with 48 px minimum buttons and inline error.
class CountStepperRow extends StatelessWidget {
  /// Creates a [CountStepperRow].
  const CountStepperRow({
    required this.label,
    required this.value,
    required this.minValue,
    required this.onChanged,
    this.maxValue = 20,
    this.errorText,
    super.key,
  });

  /// Visible form label describing the count.
  final String label;

  /// Current numeric value.
  final int value;

  /// Minimum permitted value.
  final int minValue;

  /// Maximum permitted value.
  final int maxValue;

  /// Callback invoked when incremented or decremented.
  final ValueChanged<int> onChanged;

  /// Optional inline validation error text.
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(child: Text(label)),
              OutlinedButton(
                onPressed: value > minValue ? () => onChanged(value - 1) : null,
                child: Semantics(
                  label: 'Decrease $label',
                  child: const Icon(Icons.remove, size: 18),
                ),
              ),
              SizedBox(
                width: 44,
                child: Text(
                  '$value',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              OutlinedButton(
                onPressed: value < maxValue ? () => onChanged(value + 1) : null,
                child: Semantics(
                  label: 'Increase $label',
                  child: const Icon(Icons.add, size: 18),
                ),
              ),
            ],
          ),
          if (errorText != null)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.xs),
              child: Text(
                errorText!,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: colors.error),
              ),
            ),
        ],
      ),
    );
  }
}
