import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/strings.dart';
import 'state/air_controller.dart';
import 'state/chat_controller.dart';
import 'state/checklist_controller.dart';
import 'state/plan_controller.dart';
import 'state/profile_controller.dart';
import 'ui/screens/dashboard_screen.dart';
import 'ui/screens/profile_screen.dart';
import 'ui/theme/app_theme.dart';

/// Root Material application configuring providers, themes, and navigation.
class SmogShieldApp extends StatelessWidget {
  /// Creates a [SmogShieldApp] with injected state controllers.
  const SmogShieldApp({
    required this.profileController,
    required this.airController,
    required this.planController,
    required this.chatController,
    required this.checklistController,
    super.key,
  });

  /// Controller managing household profile and visual theme mode.
  final ProfileController profileController;

  /// Controller fetching live or manual air quality readings.
  final AirController airController;

  /// Controller building deterministic plans and optional AI narratives.
  final PlanController planController;

  /// Controller managing bounded Ask Q&A turns.
  final ChatController chatController;

  /// Controller persisting RWA and school community checklist progress.
  final ChecklistController checklistController;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: <ChangeNotifierProvider<ChangeNotifier>>[
        ChangeNotifierProvider<ProfileController>.value(
          value: profileController,
        ),
        ChangeNotifierProvider<AirController>.value(value: airController),
        ChangeNotifierProvider<PlanController>.value(value: planController),
        ChangeNotifierProvider<ChatController>.value(value: chatController),
        ChangeNotifierProvider<ChecklistController>.value(
          value: checklistController,
        ),
      ],
      child: const _ThemedShell(),
    );
  }
}

class _ThemedShell extends StatefulWidget {
  const _ThemedShell();

  @override
  State<_ThemedShell> createState() => _ThemedShellState();
}

class _ThemedShellState extends State<_ThemedShell> {
  bool _editingProfile = false;

  @override
  Widget build(BuildContext context) {
    final ProfileController profile = context.watch<ProfileController>();
    final bool showProfile = !profile.hasCompletedSetup || _editingProfile;

    return MaterialApp(
      title: AppStrings.appTitle,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.forMode(profile.themeMode),
      home: showProfile
          ? ProfileScreen(
              onSaved: () => setState(() => _editingProfile = false),
            )
          : DashboardScreen(
              onEditProfile: () => setState(() => _editingProfile = true),
            ),
    );
  }
}
