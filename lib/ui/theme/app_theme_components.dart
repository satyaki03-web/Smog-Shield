import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/spacing.dart';

/// Shared flat button, input, and typography theme builders for [AppTheme].
class AppThemeComponents {
  const AppThemeComponents._();

  /// Builds Atkinson Hyperlegible body text paired with Newsreader headings.
  static TextTheme buildTextTheme(ColorScheme scheme) {
    final TextTheme base = GoogleFonts.atkinsonHyperlegibleTextTheme(
      ThemeData(brightness: scheme.brightness).textTheme,
    ).apply(bodyColor: scheme.onSurface, displayColor: scheme.onSurface);
    return base.copyWith(
      displayLarge: GoogleFonts.newsreader(
        fontSize: 48,
        fontWeight: FontWeight.w600,
        color: scheme.onSurface,
        height: 1.05,
      ),
      headlineMedium: GoogleFonts.newsreader(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: scheme.onSurface,
      ),
      titleLarge: GoogleFonts.newsreader(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: scheme.onSurface,
      ),
    );
  }

  /// Pointer cursor resolver enforcing click when enabled and forbidden when disabled.
  static WidgetStateProperty<MouseCursor> pointerCursor() {
    return WidgetStateProperty.resolveWith<MouseCursor>(
      (Set<WidgetState> states) => states.contains(WidgetState.disabled)
          ? SystemMouseCursors.forbidden
          : SystemMouseCursors.click,
    );
  }

  /// Flat filled button theme with 48x48 minimum target and pointer cursor.
  static FilledButtonThemeData filledButtons(OutlinedBorder shape) {
    return FilledButtonThemeData(
      style: ButtonStyle(
        minimumSize: const WidgetStatePropertyAll<Size>(
          Size(AppSpacing.minTapTarget, AppSpacing.minTapTarget),
        ),
        shape: WidgetStatePropertyAll<OutlinedBorder>(shape),
        mouseCursor: pointerCursor(),
      ),
    );
  }

  /// Flat outlined button theme with 48x48 minimum target and pointer cursor.
  static OutlinedButtonThemeData outlinedButtons(
    ColorScheme scheme,
    double borderWidth,
    OutlinedBorder shape,
  ) {
    return OutlinedButtonThemeData(
      style: ButtonStyle(
        minimumSize: const WidgetStatePropertyAll<Size>(
          Size(AppSpacing.minTapTarget, AppSpacing.minTapTarget),
        ),
        shape: WidgetStatePropertyAll<OutlinedBorder>(shape),
        side: WidgetStatePropertyAll<BorderSide>(
          BorderSide(color: scheme.outline, width: borderWidth),
        ),
        mouseCursor: pointerCursor(),
      ),
    );
  }

  /// Flat input decoration theme with crisp focus ring.
  static InputDecorationTheme inputDecoration(
    ColorScheme scheme,
    double borderWidth,
  ) {
    final BorderRadius radius = BorderRadius.circular(AppSpacing.radiusMd);
    return InputDecorationTheme(
      filled: true,
      fillColor: scheme.surface,
      border: OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide(color: scheme.outline, width: borderWidth),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide(color: scheme.outline, width: borderWidth),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide(
          color: scheme.primary,
          width: AppSpacing.borderSelected,
        ),
      ),
    );
  }
}
