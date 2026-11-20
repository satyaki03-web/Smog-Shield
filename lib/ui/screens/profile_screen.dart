import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/result.dart';
import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/enums.dart';
import '../../models/user_profile.dart';
import '../../state/air_controller.dart';
import '../../state/plan_controller.dart';
import '../../state/profile_controller.dart';
import '../../validation/input_validator.dart';
import '../widgets/profile_household_section.dart';
import '../widgets/profile_lifestyle_section.dart';
import '../widgets/responsive_scaffold.dart';

/// Household setup and editing screen with inline validation.
class ProfileScreen extends StatefulWidget {
  /// Creates a [ProfileScreen].
  const ProfileScreen({required this.onSaved, super.key});

  /// Callback invoked after the profile validates and saves cleanly.
  final VoidCallback onSaved;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late UserProfile _draft;
  late TextEditingController _manualAqiController;
  Map<String, String> _errors = const <String, String>{};

  @override
  void initState() {
    super.initState();
    _draft = context.read<ProfileController>().profile;
    _manualAqiController = TextEditingController(
      text: _draft.manualAqi?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _manualAqiController.dispose();
    super.dispose();
  }

  void _update(UserProfile next) => setState(() => _draft = next);

  void _toggleSensitivity(Sensitivity item) {
    final Set<Sensitivity> next = Set<Sensitivity>.from(_draft.sensitivities);
    if (!next.add(item)) {
      next.remove(item);
    }
    _update(_draft.copyWith(sensitivities: next));
  }

  Future<void> _submit() async {
    final Result<int?> parsed =
        InputValidator.validateManualAqiText(_manualAqiController.text);
    if (parsed.isFailure) {
      setState(() => _errors = <String, String>{'manualAqi': parsed.errorOrNull!.userMessage});
      return;
    }
    final int? manual = parsed.valueOrNull;
    final UserProfile candidate =
        _draft.copyWith(manualAqi: manual, clearManualAqi: manual == null);
    final Map<String, String> errs =
        await context.read<ProfileController>().saveProfile(candidate);
    if (errs.isNotEmpty) {
      setState(() => _errors = errs);
      return;
    }
    if (!mounted) {
      return;
    }
    await _syncAirAndPlan(candidate);
    if (mounted) {
      widget.onSaved();
    }
  }

  Future<void> _syncAirAndPlan(UserProfile candidate) async {
    final AirController air = context.read<AirController>();
    final PlanController plan = context.read<PlanController>();
    await air.loadForProfile(candidate);
    if (air.reading != null) {
      await plan.rebuildDeterministic(
        profile: candidate,
        reading: air.reading!,
        hourlyPoints: air.hourlyPoints,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ResponsiveScaffold(
      appBar: AppBar(title: const Text(ProfileStrings.screenTitle)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(ProfileStrings.introText, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: AppSpacing.lg),
            ProfileHouseholdSection(
              cityName: _draft.cityName,
              adults: _draft.adults,
              childrenUnder12: _draft.childrenUnder12,
              eldersOver60: _draft.eldersOver60,
              sensitivities: _draft.sensitivities,
              errors: _errors,
              onCityChanged: (String v) => _update(_draft.copyWith(cityName: v)),
              onAdultsChanged: (int v) => _update(_draft.copyWith(adults: v)),
              onChildrenChanged: (int v) => _update(_draft.copyWith(childrenUnder12: v)),
              onEldersChanged: (int v) => _update(_draft.copyWith(eldersOver60: v)),
              onToggleSensitivity: _toggleSensitivity,
            ),
            ProfileLifestyleSection(
              commuteMode: _draft.commuteMode,
              cookingFuel: _draft.cookingFuel,
              homeType: _draft.homeType,
              ownsPurifier: _draft.ownsPurifier,
              budgetLevel: _draft.budgetLevel,
              manualAqiController: _manualAqiController,
              manualAqiError: _errors['manualAqi'],
              onCommuteChanged: (CommuteMode v) => _update(_draft.copyWith(commuteMode: v)),
              onCookingChanged: (CookingFuel v) => _update(_draft.copyWith(cookingFuel: v)),
              onHomeTypeChanged: (HomeType v) => _update(_draft.copyWith(homeType: v)),
              onPurifierChanged: (bool v) => _update(_draft.copyWith(ownsPurifier: v)),
              onBudgetChanged: (BudgetLevel v) => _update(_draft.copyWith(budgetLevel: v)),
            ),
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _submit,
                child: const Text(ProfileStrings.saveProfileButton),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }
}
