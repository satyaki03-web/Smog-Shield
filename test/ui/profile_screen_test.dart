import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/core/strings.dart';

import 'test_helpers.dart';

void main() {
  group('ProfileScreen widget tests', () {
    testWidgets('validates bad manual AQI inline and submits valid profile to Dashboard', (
      WidgetTester tester,
    ) async {
      tester.view.physicalSize = const Size(900, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final Widget app = await buildTestApp();
      await tester.pumpWidget(app);
      await tester.pumpAndSettle();

      expect(find.text(ProfileStrings.screenTitle), findsOneWidget);

      await tester.enterText(find.byType(TextField), '2500');
      final Finder saveBtn = find.text(ProfileStrings.saveProfileButton);
      await tester.ensureVisible(saveBtn);
      await tester.tap(saveBtn);
      await tester.pumpAndSettle();

      expect(find.text(ProfileStrings.errManualAqi), findsOneWidget);

      await tester.enterText(find.byType(TextField), '312');
      await tester.tap(saveBtn);
      await tester.pumpAndSettle();

      expect(find.text(DashboardStrings.tabToday), findsOneWidget);
      expect(find.text('312'), findsOneWidget);
    });
  });
}
