import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smog_shield/core/strings.dart';
import 'package:smog_shield/ui/theme/app_theme.dart';
import 'package:smog_shield/ui/widgets/selectable_card.dart';

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  group('SelectableCard', () {
    testWidgets('shows Selected text, check icon, pointer cursor, and selected semantics', (
      WidgetTester tester,
    ) async {
      bool tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: SelectableCard(
              title: 'Asthma',
              selected: true,
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Asthma'), findsOneWidget);
      expect(find.text(AppStrings.selectedLabel), findsOneWidget);
      expect(find.byIcon(Icons.check), findsOneWidget);

      final MouseRegion region = tester.widget<MouseRegion>(
        find.descendant(
          of: find.byType(SelectableCard),
          matching: find.byType(MouseRegion),
        ).first,
      );
      expect(region.cursor, SystemMouseCursors.click);

      final SemanticsNode node = tester.getSemantics(find.byType(SelectableCard));
      expect(node.hasFlag(SemanticsFlag.isSelected), isTrue);

      await tester.tap(find.byType(SelectableCard));
      expect(tapped, isTrue);
    });

    testWidgets('shows forbidden cursor when disabled and omits Selected label when unselected', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: const Scaffold(
            body: SelectableCard(
              title: 'Disabled choice',
              selected: false,
              enabled: false,
              onTap: null,
            ),
          ),
        ),
      );

      expect(find.text(AppStrings.selectedLabel), findsNothing);
      final MouseRegion region = tester.widget<MouseRegion>(
        find.descendant(
          of: find.byType(SelectableCard),
          matching: find.byType(MouseRegion),
        ).first,
      );
      expect(region.cursor, SystemMouseCursors.forbidden);
    });
  });
}
