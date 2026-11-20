import 'package:flutter/material.dart';

import '../../models/enums.dart';

/// Semantic color tokens for light, dark, and high-contrast themes.
class AppColors {
  const AppColors._();

  /// Warm paper background for the default light theme.
  static const Color paper = Color(0xFFF6F2EA);

  /// Subtle elevated surface for cards on warm paper.
  static const Color surfaceLight = Color(0xFFFFFDF8);

  /// Primary ink text color on light surfaces (high contrast).
  static const Color ink = Color(0xFF1D2B26);

  /// Secondary muted ink meeting WCAG AA on paper (#F6F2EA).
  static const Color inkMuted = Color(0xFF43544E);

  /// Forest-teal primary accent.
  static const Color forestTeal = Color(0xFF1F5F5B);

  /// Clay secondary accent.
  static const Color clay = Color(0xFFB5502F);

  /// Neutral 1 px border on light surfaces.
  static const Color borderLight = Color(0xFFC8C0B2);

  /// Deep charcoal background for dark mode.
  static const Color darkBackground = Color(0xFF131B18);

  /// Elevated card surface for dark mode.
  static const Color darkSurface = Color(0xFF1B2622);

  /// Primary text ink in dark mode.
  static const Color darkInk = Color(0xFFF3EFE6);

  /// Muted text ink in dark mode meeting WCAG AA.
  static const Color darkInkMuted = Color(0xFFC3CEC9);

  /// Brightened teal primary for WCAG AA contrast on dark surfaces.
  static const Color darkTeal = Color(0xFF6BC2BA);

  /// Brightened clay accent for WCAG AA contrast on dark surfaces.
  static const Color darkClay = Color(0xFFEB8A68);

  /// Border color in dark mode.
  static const Color borderDark = Color(0xFF3E4F49);

  /// High-contrast surface (pure white).
  static const Color hcBackground = Color(0xFFFFFFFF);

  /// High-contrast ink (pure black).
  static const Color hcInk = Color(0xFF000000);

  /// High-contrast primary (deep forest).
  static const Color hcPrimary = Color(0xFF0A3D3A);

  /// High-contrast accent (deep clay).
  static const Color hcAccent = Color(0xFF8C2D12);

  /// Returns a WCAG AA foreground color for [band] given [brightness].
  static Color bandColor(AqiBand band, Brightness brightness) {
    final bool isDark = brightness == Brightness.dark;
    return switch (band) {
      AqiBand.good => isDark ? const Color(0xFF6DD49E) : const Color(0xFF1B643D),
      AqiBand.satisfactory =>
        isDark ? const Color(0xFF9CD46A) : const Color(0xFF3D6616),
      AqiBand.moderate =>
        isDark ? const Color(0xFFE8C15A) : const Color(0xFF7A5600),
      AqiBand.poor =>
        isDark ? const Color(0xFFF29C6B) : const Color(0xFF9E4412),
      AqiBand.veryPoor =>
        isDark ? const Color(0xFFF27979) : const Color(0xFFA12222),
      AqiBand.severe =>
        isDark ? const Color(0xFFFF8F8F) : const Color(0xFF7A1111),
    };
  }

  /// Returns a distinct Material icon shape paired with [band] so color is never sole indicator.
  static IconData bandIcon(AqiBand band) {
    return switch (band) {
      AqiBand.good => Icons.check_circle_outline,
      AqiBand.satisfactory => Icons.circle_outlined,
      AqiBand.moderate => Icons.change_history,
      AqiBand.poor => Icons.crop_square,
      AqiBand.veryPoor => Icons.report_outlined,
      AqiBand.severe => Icons.warning_amber_rounded,
    };
  }
}
