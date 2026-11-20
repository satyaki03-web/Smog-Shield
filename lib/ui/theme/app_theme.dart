import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../models/enums.dart';
import 'app_colors.dart';
import 'app_theme_components.dart';

/// Builds flat, editorial Light, Dark, and High-Contrast Material themes.
class AppTheme {
  const AppTheme._();

  /// Returns the [ThemeData] corresponding to [mode].
  static ThemeData forMode(AppThemeMode mode) {
    return switch (mode) {
      AppThemeMode.light => light(),
      AppThemeMode.dark => dark(),
      AppThemeMode.highContrast => highContrast(),
    };
  }

  /// Default warm paper light theme.
  static ThemeData light() {
    const ColorScheme scheme = ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.forestTeal,
      onPrimary: Colors.white,
      secondary: AppColors.clay,
      onSecondary: Colors.white,
      error: Color(0xFF9E1C1C),
      onError: Colors.white,
      surface: AppColors.surfaceLight,
      onSurface: AppColors.ink,
      onSurfaceVariant: AppColors.inkMuted,
      outline: AppColors.borderLight,
    );
    return _buildTheme(scheme, AppColors.paper, AppSpacing.borderThin);
  }

  /// Matching dark theme with WCAG AA contrast.
  static ThemeData dark() {
    const ColorScheme scheme = ColorScheme(
      brightness: Brightness.dark,
      primary: AppColors.darkTeal,
      onPrimary: AppColors.darkBackground,
      secondary: AppColors.darkClay,
      onSecondary: AppColors.darkBackground,
      error: Color(0xFFFF8A8A),
      onError: AppColors.darkBackground,
      surface: AppColors.darkSurface,
      onSurface: AppColors.darkInk,
      onSurfaceVariant: AppColors.darkInkMuted,
      outline: AppColors.borderDark,
    );
    return _buildTheme(scheme, AppColors.darkBackground, AppSpacing.borderThin);
  }

  /// High-contrast accessibility theme with crisp 2 px borders.
  static ThemeData highContrast() {
    const ColorScheme scheme = ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.hcPrimary,
      onPrimary: Colors.white,
      secondary: AppColors.hcAccent,
      onSecondary: Colors.white,
      error: Color(0xFF8A0000),
      onError: Colors.white,
      surface: AppColors.hcBackground,
      onSurface: AppColors.hcInk,
      onSurfaceVariant: AppColors.hcInk,
      outline: AppColors.hcInk,
    );
    return _buildTheme(
      scheme,
      AppColors.hcBackground,
      AppSpacing.borderSelected,
    );
  }

  static ThemeData _buildTheme(
    ColorScheme scheme,
    Color scaffoldBg,
    double borderWidth,
  ) {
    final OutlinedBorder shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: scaffoldBg,
      textTheme: AppThemeComponents.buildTextTheme(scheme),
      splashFactory: NoSplash.splashFactory,
      dividerTheme: DividerThemeData(color: scheme.outline, thickness: 1),
      appBarTheme: AppBarTheme(
        backgroundColor: scaffoldBg,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        shape: Border(
          bottom: BorderSide(color: scheme.outline, width: borderWidth),
        ),
      ),
      filledButtonTheme: AppThemeComponents.filledButtons(shape),
      outlinedButtonTheme:
          AppThemeComponents.outlinedButtons(scheme, borderWidth, shape),
      inputDecorationTheme:
          AppThemeComponents.inputDecoration(scheme, borderWidth),
    );
  }
}
