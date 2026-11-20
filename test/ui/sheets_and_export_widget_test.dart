import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/core/strings.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/user_profile.dart';

import 'test_helpers.dart';

void main() {
  group('CommunityChecklistSheet and SettingsSheet widget tests', () {
    testWidgets('opens Community Checklist sheet and toggles item selection', (
      WidgetTester tester,
    ) async {
      tester.view.physicalSize = const Size(1100, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final Widget app = await buildTestApp(
        initialProfile: UserProfile.defaults(),
      );
      await tester.pumpWidget(app);
      await tester.pumpAndSettle();

      await tester.tap(find.text(DashboardStrings.checklistButton));
      await tester.pumpAndSettle();

      expect(find.text(DashboardStrings.checklistHeading), findsOneWidget);
      final Finder firstItem = find.textContaining('Ban dry-leaf');
      expect(firstItem, findsOneWidget);
      await tester.tap(firstItem);
      await tester.pumpAndSettle();
      expect(find.text(AppStrings.selectedLabel), findsOneWidget);
    });

    testWidgets('opens Settings sheet, switches to High Contrast, and clears saved data', (
      WidgetTester tester,
    ) async {
      tester.view.physicalSize = const Size(1100, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final Widget app = await buildTestApp(
        initialProfile: UserProfile.defaults(),
      );
      await tester.pumpWidget(app);
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip(DashboardStrings.settingsTitle));
      await tester.pumpAndSettle();

      expect(find.text(DashboardStrings.sourcesHeading), findsOneWidget);
      await tester.tap(find.text(AppThemeMode.highContrast.label));
      await tester.pumpAndSettle();

      await tester.tap(find.text(DashboardStrings.clearDataAction));
      await tester.pumpAndSettle();

      expect(find.text(ProfileStrings.screenTitle), findsOneWidget);
    });
  });
}
