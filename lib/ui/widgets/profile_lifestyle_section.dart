import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/enums.dart';
import 'enum_option_group.dart';
import 'selectable_card.dart';

/// Commute, cooking fuel, home type, purifier, budget, and manual AQI section.
class ProfileLifestyleSection extends StatelessWidget {
  /// Creates a [ProfileLifestyleSection].
  const ProfileLifestyleSection({
    required this.commuteMode,
    required this.cookingFuel,
    required this.homeType,
    required this.ownsPurifier,
    required this.budgetLevel,
    required this.manualAqiController,
    required this.manualAqiError,
    required this.onCommuteChanged,
    required this.onCookingChanged,
    required this.onHomeTypeChanged,
    required this.onPurifierChanged,
    required this.onBudgetChanged,
    super.key,
  });

  /// Selected commute mode.
  final CommuteMode commuteMode;

  /// Selected cooking fuel.
  final CookingFuel cookingFuel;

  /// Selected home type.
  final HomeType homeType;

  /// Whether household owns an air purifier.
  final bool ownsPurifier;

  /// Selected budget preference.
  final BudgetLevel budgetLevel;

  /// Controller for optional manual AQI text field.
  final TextEditingController manualAqiController;

  /// Inline validation error for manual AQI, if any.
  final String? manualAqiError;

  /// Callback for commute change.
  final ValueChanged<CommuteMode> onCommuteChanged;

  /// Callback for cooking fuel change.
  final ValueChanged<CookingFuel> onCookingChanged;

  /// Callback for home type change.
  final ValueChanged<HomeType> onHomeTypeChanged;

  /// Callback for purifier toggle.
  final ValueChanged<bool> onPurifierChanged;

  /// Callback for budget level change.
  final ValueChanged<BudgetLevel> onBudgetChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        EnumOptionGroup<CommuteMode>(
          heading: ProfileStrings.commuteHeading,
          values: CommuteMode.values,
          selectedValue: commuteMode,
          labelOf: (CommuteMode v) => v.label,
          onSelect: onCommuteChanged,
        ),
        EnumOptionGroup<CookingFuel>(
          heading: ProfileStrings.cookingHeading,
          values: CookingFuel.values,
          selectedValue: cookingFuel,
          labelOf: (CookingFuel v) => v.label,
          onSelect: onCookingChanged,
        ),
        EnumOptionGroup<HomeType>(
          heading: ProfileStrings.homeTypeHeading,
          values: HomeType.values,
          selectedValue: homeType,
          labelOf: (HomeType v) => v.label,
          onSelect: onHomeTypeChanged,
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          ProfileStrings.purifierHeading,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: <Widget>[
            SelectableCard(
              title: ProfileStrings.purifierYes,
              selected: ownsPurifier,
              onTap: () => onPurifierChanged(true),
            ),
            SelectableCard(
              title: ProfileStrings.purifierNo,
              selected: !ownsPurifier,
              onTap: () => onPurifierChanged(false),
            ),
          ],
        ),
        EnumOptionGroup<BudgetLevel>(
          heading: ProfileStrings.budgetHeading,
          values: BudgetLevel.values,
          selectedValue: budgetLevel,
          labelOf: (BudgetLevel v) => v.label,
          onSelect: onBudgetChanged,
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: manualAqiController,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: ProfileStrings.manualAqiLabel,
            helperText: ProfileStrings.manualAqiHelper,
            errorText: manualAqiError,
          ),
        ),
      ],
    );
  }
}
