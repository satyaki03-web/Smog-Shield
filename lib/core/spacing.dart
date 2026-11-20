/// Layout spacing, sizing, and responsive breakpoint constants.
class AppSpacing {
  const AppSpacing._();

  /// Extra-small spacing unit (4 px).
  static const double xs = 4.0;

  /// Small spacing unit (8 px).
  static const double sm = 8.0;

  /// Medium spacing unit (16 px).
  static const double md = 16.0;

  /// Large spacing unit (24 px).
  static const double lg = 24.0;

  /// Extra-large spacing unit (32 px).
  static const double xl = 32.0;

  /// Minimum interactive tap target dimension for accessibility (48 px).
  static const double minTapTarget = 48.0;

  /// Standard hairline border width (1 px).
  static const double borderThin = 1.0;

  /// Selected or focused border width (2 px).
  static const double borderSelected = 2.0;

  /// Small corner radius for badges and chips (4 px).
  static const double radiusSm = 4.0;

  /// Medium corner radius for cards and inputs (6 px).
  static const double radiusMd = 6.0;

  /// Maximum centered content width on wide screens (1100 px).
  static const double contentMaxWidth = 1100.0;

  /// Breakpoint separating compact phones from medium screens (600 px).
  static const double compactBreakpoint = 600.0;

  /// Breakpoint where two-column asymmetric Today layout activates (780 px).
  static const double splitBreakpoint = 780.0;

  /// Breakpoint for wide desktop navigation rail layout (1000 px).
  static const double wideBreakpoint = 1000.0;
}
