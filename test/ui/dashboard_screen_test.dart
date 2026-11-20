import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/core/app_error.dart';
import 'package:smog_shield/core/result.dart';
import 'package:smog_shield/core/strings.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/air_quality_repository.dart';

import 'test_helpers.dart';

void main() {
  group('DashboardScreen tabs, notices, and keyboard navigation', () {
    testWidgets('renders all five tabs, impact notes, medical disclaimer, and Ask reply', (
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

      expect(find.text('340'), findsOneWidget);
      expect(find.text(AppStrings.medicalDisclaimer), findsOneWidget);
      expect(find.text(AppStrings.fallbackAiNotice), findsOneWidget);

      await tester.tap(find.text(DashboardStrings.tabRoutine));
      await tester.pumpAndSettle();
      expect(find.text(DashboardStrings.whyThisHelps), findsWidgets);

      await tester.tap(find.text(DashboardStrings.tabIndoor));
      await tester.pumpAndSettle();
      expect(find.text(DashboardStrings.howWeEstimated), findsWidgets);

      await tester.tap(find.text(DashboardStrings.tabSwaps));
      await tester.pumpAndSettle();
      expect(find.textContaining('CO2'), findsWidgets);

      await tester.tap(find.text(DashboardStrings.tabAsk));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'What mask should we wear?');
      await tester.tap(find.text(DashboardStrings.askSendButton));
      await tester.pumpAndSettle();
      expect(find.textContaining('N95'), findsWidgets);
    });

    testWidgets('shows error notice when air repository fails', (
      WidgetTester tester,
    ) async {
      tester.view.physicalSize = const Size(900, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final Widget app = await buildTestApp(
        initialProfile: UserProfile.defaults(),
        airResult: const Failure<AirSnapshot>(
          AppError(
            code: AppErrorCode.network,
            userMessage: AppStrings.errorNetwork,
          ),
        ),
      );
      await tester.pumpWidget(app);
      await tester.pumpAndSettle();

      expect(find.text(AppStrings.errorNetwork), findsOneWidget);
      expect(find.text(AppStrings.retryButton), findsOneWidget);
    });

    testWidgets('supports keyboard traversal across tabs', (
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

      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });
}
