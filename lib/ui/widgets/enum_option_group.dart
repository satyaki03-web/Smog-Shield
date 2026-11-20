import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import 'selectable_card.dart';

/// Reusable single-select group of [SelectableCard] options for an enum type.
class EnumOptionGroup<T> extends StatelessWidget {
  /// Creates an [EnumOptionGroup].
  const EnumOptionGroup({
    required this.heading,
    required this.values,
    required this.selectedValue,
    required this.labelOf,
    required this.onSelect,
    super.key,
  });

  /// Section heading displayed above the cards.
  final String heading;

  /// All selectable values.
  final List<T> values;

  /// Currently active value.
  final T selectedValue;

  /// Converts a value to its display label.
  final String Function(T) labelOf;

  /// Called when the user selects a card.
  final ValueChanged<T> onSelect;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(heading, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: values
                .map(
                  (T value) => SelectableCard(
                    title: labelOf(value),
                    selected: value == selectedValue,
                    onTap: () => onSelect(value),
                  ),
                )
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}
