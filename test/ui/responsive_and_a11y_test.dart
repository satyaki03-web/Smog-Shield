import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/user_profile.dart';

import 'test_helpers.dart';

void main() {
  group('Responsive layouts, text scaling 2.0, themes, and accessibility guidelines', () {
    for (final Size size in const <Size>[
      Size(320, 640),
      Size(600, 800),
      Size(1200, 900),
    ]) {
      testWidgets(
        'Dashboard renders cleanly with zero overflow at ${size.width.toInt()}x${size.height.toInt()}',
        (WidgetTester tester) async {
          tester.view.physicalSize = size;
          tester.view.devicePixelRatio = 1.0;
          addTearDown(tester.view.resetPhysicalSize);

          final Widget app = await buildTestApp(
            initialProfile: UserProfile.defaults(),
          );
          await tester.pumpWidget(app);
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        },
      );
    }

    testWidgets('Dashboard renders cleanly at 2.0 text scale without overflow', (
      WidgetTester tester,
    ) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final Widget app = await buildTestApp(
        initialProfile: UserProfile.defaults(),
      );
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(2.0)),
          child: app,
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('Dark and High-Contrast themes build without errors', (
      WidgetTester tester,
    ) async {
      tester.view.physicalSize = const Size(800, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      for (final AppThemeMode mode in <AppThemeMode>[
        AppThemeMode.dark,
        AppThemeMode.highContrast,
      ]) {
        final Widget app = await buildTestApp(
          initialProfile: UserProfile.defaults(),
          themeMode: mode,
        );
        await tester.pumpWidget(app);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      }
    });

    testWidgets('Dashboard and Profile pass Flutter accessibility guidelines', (
      WidgetTester tester,
    ) async {
      tester.view.physicalSize = const Size(1100, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final SemanticsHandle handle = tester.ensureSemantics();
      addTearDown(handle.dispose);

      final Widget dashboard = await buildTestApp(
        initialProfile: UserProfile.defaults(),
      );
      await tester.pumpWidget(dashboard);
      await tester.pumpAndSettle();

      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));

      final Widget profile = await buildTestApp();
      await tester.pumpWidget(profile);
      await tester.pumpAndSettle();

      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
    });
  });
}
