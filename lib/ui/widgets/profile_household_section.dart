import 'package:flutter/material.dart';

import '../../core/cities.dart';
import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/enums.dart';
import 'count_stepper_row.dart';
import 'selectable_card.dart';

/// City picker, household counts, and health sensitivities section of the profile form.
class ProfileHouseholdSection extends StatelessWidget {
  /// Creates a [ProfileHouseholdSection].
  const ProfileHouseholdSection({
    required this.cityName,
    required this.adults,
    required this.childrenUnder12,
    required this.eldersOver60,
    required this.sensitivities,
    required this.errors,
    required this.onCityChanged,
    required this.onAdultsChanged,
    required this.onChildrenChanged,
    required this.onEldersChanged,
    required this.onToggleSensitivity,
    super.key,
  });

  /// Currently selected city name.
  final String cityName;

  /// Household adult count.
  final int adults;

  /// Household children under 12 count.
  final int childrenUnder12;

  /// Household adults over 60 count.
  final int eldersOver60;

  /// Selected health sensitivities.
  final Set<Sensitivity> sensitivities;

  /// Field validation errors keyed by field name.
  final Map<String, String> errors;

  /// Called when city selection changes.
  final ValueChanged<String> onCityChanged;

  /// Called when adult count changes.
  final ValueChanged<int> onAdultsChanged;

  /// Called when child count changes.
  final ValueChanged<int> onChildrenChanged;

  /// Called when elder count changes.
  final ValueChanged<int> onEldersChanged;

  /// Called when a sensitivity card is toggled.
  final ValueChanged<Sensitivity> onToggleSensitivity;

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        DropdownButtonFormField<String>(
          value: cityName,
          decoration: InputDecoration(
            labelText: ProfileStrings.cityLabel,
            helperText: ProfileStrings.cityHelper,
            errorText: errors['city'],
          ),
          items: AppCities.list
              .map(
                (CityOption c) => DropdownMenuItem<String>(
                  value: c.name,
                  child: Text(c.displayLabel),
                ),
              )
              .toList(growable: false),
          onChanged: (String? value) {
            if (value != null) {
              onCityChanged(value);
            }
          },
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(ProfileStrings.householdHeading, style: textTheme.titleLarge),
        const SizedBox(height: AppSpacing.sm),
        CountStepperRow(
          label: ProfileStrings.adultsLabel,
          value: adults,
          minValue: 1,
          onChanged: onAdultsChanged,
          errorText: errors['adults'],
        ),
        CountStepperRow(
          label: ProfileStrings.childrenLabel,
          value: childrenUnder12,
          minValue: 0,
          onChanged: onChildrenChanged,
          errorText: errors['children'],
        ),
        CountStepperRow(
          label: ProfileStrings.eldersLabel,
          value: eldersOver60,
          minValue: 0,
          onChanged: onEldersChanged,
          errorText: errors['elders'] ?? errors['household'],
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(ProfileStrings.sensitivitiesHeading, style: textTheme.titleLarge),
        const SizedBox(height: AppSpacing.xs),
        Text(ProfileStrings.sensitivitiesHelper, style: textTheme.bodySmall),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: Sensitivity.values
              .map(
                (Sensitivity item) => SelectableCard(
                  title: item.label,
                  selected: sensitivities.contains(item),
                  onTap: () => onToggleSensitivity(item),
                ),
              )
              .toList(growable: false),
        ),
      ],
    );
  }
}
