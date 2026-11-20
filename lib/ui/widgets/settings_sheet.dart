import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/enums.dart';
import '../../state/chat_controller.dart';
import '../../state/checklist_controller.dart';
import '../../state/profile_controller.dart';
import 'error_notice.dart';
import 'selectable_card.dart';

/// Settings sheet for profile edits, theme contrast, data reset, and sources.
class SettingsSheet extends StatelessWidget {
  /// Creates a [SettingsSheet].
  const SettingsSheet({required this.onEditProfile, super.key});

  /// Navigates to the household profile editor.
  final VoidCallback onEditProfile;

  @override
  Widget build(BuildContext context) {
    final ProfileController profile = context.watch<ProfileController>();
    final TextTheme textTheme = Theme.of(context).textTheme;

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    DashboardStrings.settingsTitle,
                    style: textTheme.headlineMedium,
                  ),
                ),
                OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(AppStrings.closeButton),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Text(DashboardStrings.themeHeading, style: textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: AppThemeMode.values
                  .map(
                    (AppThemeMode mode) => SelectableCard(
                      title: mode.label,
                      selected: profile.themeMode == mode,
                      onTap: () => profile.setThemeMode(mode),
                    ),
                  )
                  .toList(growable: false),
            ),
            const SizedBox(height: AppSpacing.lg),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: <Widget>[
                FilledButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    onEditProfile();
                  },
                  icon: const Icon(Icons.person_outline, size: 18),
                  label: const Text(DashboardStrings.editProfileAction),
                ),
                OutlinedButton.icon(
                  onPressed: () => _handleClearData(context),
                  icon: const Icon(Icons.delete_outline, size: 18),
                  label: const Text(DashboardStrings.clearDataAction),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(DashboardStrings.sourcesHeading, style: textTheme.titleLarge),
            const SizedBox(height: AppSpacing.xs),
            Text(DashboardStrings.sourcesBody, style: textTheme.bodyMedium),
            const SizedBox(height: AppSpacing.md),
            const MedicalDisclaimer(),
          ],
        ),
      ),
    );
  }

  Future<void> _handleClearData(BuildContext context) async {
    final ProfileController profile = context.read<ProfileController>();
    final ChecklistController checklist = context.read<ChecklistController>();
    final ChatController chat = context.read<ChatController>();
    await profile.clearAllData();
    checklist.resetLocal();
    chat.clearHistory();
    if (!context.mounted) {
      return;
    }
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text(DashboardStrings.clearedDataMessage)),
    );
  }
}
