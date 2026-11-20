/// CPCB Air Quality Index bands used across the rule engine and UI.
enum AqiBand {
  /// AQI 0 to 50.
  good('Good'),

  /// AQI 51 to 100.
  satisfactory('Satisfactory'),

  /// AQI 101 to 200.
  moderate('Moderate'),

  /// AQI 201 to 300.
  poor('Poor'),

  /// AQI 301 to 400.
  veryPoor('Very Poor'),

  /// AQI 401 and above.
  severe('Severe');

  /// Creates an [AqiBand] with its display [label].
  const AqiBand(this.label);

  /// Plain-language display label for this band.
  final String label;
}

/// Functional category for each recommendation tile.
enum RecommendationCategory {
  /// Daily routine and timing guidance.
  routine('Routine'),

  /// Indoor air quality and filtration actions.
  indoor('Indoor Air'),

  /// Sustainable commute, cooking, and heating swaps.
  swap('Swaps');

  /// Creates a [RecommendationCategory] with its display [label].
  const RecommendationCategory(this.label);

  /// Display label for tabs and badges.
  final String label;
}

/// Priority ordering for deterministic sorting of recommendations.
enum ActionPriority {
  /// Immediate protective action required.
  critical('Critical'),

  /// High-impact action for current conditions.
  high('High'),

  /// Practical medium-priority action.
  medium('Medium'),

  /// Helpful ongoing habit.
  low('Low');

  /// Creates an [ActionPriority] with its display [label].
  const ActionPriority(this.label);

  /// Plain-language priority label.
  final String label;
}

/// Supported visual contrast and theme modes.
enum AppThemeMode {
  /// Default warm paper light theme.
  light('Warm Light'),

  /// Matching dark theme.
  dark('Dark'),

  /// High-contrast accessibility theme.
  highContrast('High Contrast');

  /// Creates an [AppThemeMode] with its display [label].
  const AppThemeMode(this.label);

  /// Display label in Settings.
  final String label;
}
