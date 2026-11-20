/// User-facing strings for Dashboard tabs, Ask, Export, and Settings.
class DashboardStrings {
  const DashboardStrings._();

  /// Tab label for Today overview.
  static const String tabToday = 'Today';

  /// Tab label for daily Routine.
  static const String tabRoutine = 'Routine';

  /// Tab label for Indoor Air.
  static const String tabIndoor = 'Indoor Air';

  /// Tab label for Sustainable Swaps.
  static const String tabSwaps = 'Swaps';

  /// Tab label for Ask assistant.
  static const String tabAsk = 'Ask';

  /// Heading for the who-is-at-risk section.
  static const String riskHeading = 'Who is most at risk today';

  /// Heading for the cleanest and worst hours section.
  static const String hoursHeading = 'Next 24 hours: best and worst windows';

  /// Label for cleanest 2-hour window.
  static const String cleanestWindowLabel = 'Cleanest 2-hour window';

  /// Label for worst 2-hour window.
  static const String worstWindowLabel = 'Worst 2-hour window to avoid';

  /// Message when forecast windows are unavailable.
  static const String noForecastWindow =
      'Hourly forecast unavailable for manual or offline readings.';

  /// Heading for top three actions on Today tab.
  static const String topActionsHeading = 'Top 3 actions right now';

  /// Heading for the AI narrative panel.
  static const String narrativeHeading = 'Summary for your household';

  /// Button to trigger explicit Gemini personalization.
  static const String personalizeButton = 'Personalize wording with AI';

  /// Impact block heading for plain-language reason.
  static const String whyThisHelps = 'Why this helps';

  /// Impact block heading for estimation methodology.
  static const String howWeEstimated = 'How we estimated this';

  /// Button to copy Markdown plan to clipboard.
  static const String copyPlanButton = 'Copy plan';

  /// Confirmation snackbar after copying plan.
  static const String copiedPlanMessage = 'Plan copied as Markdown.';

  /// Button to share Markdown plan.
  static const String sharePlanButton = 'Share plan';

  /// Button to open RWA and school community checklist.
  static const String checklistButton = 'Community checklist';

  /// Heading for community checklist sheet.
  static const String checklistHeading = 'Community checklist (RWAs and schools)';

  /// Button to refresh air readings.
  static const String refreshButton = 'Refresh air data';

  /// Ask tab heading.
  static const String askHeading = 'Ask a practical smog question';

  /// Ask input label.
  static const String askInputLabel = 'Your question (up to 500 characters)';

  /// Ask input helper text.
  static const String askInputHelper =
      'Ask about masks, school runs, ventilation, purifiers, or cleaner swaps.';

  /// Ask submit button label.
  static const String askSendButton = 'Ask';

  /// Validation error when Ask input is empty.
  static const String askEmptyError = 'Please enter a question first.';

  /// Validation error when Ask input exceeds limit.
  static const String askTooLongError =
      'Keep your question under 500 characters.';

  /// Settings button label.
  static const String settingsTitle = 'Settings';

  /// Settings action to edit household profile.
  static const String editProfileAction = 'Edit household profile';

  /// Settings action to erase stored data.
  static const String clearDataAction = 'Clear my data';

  /// Confirmation message after clearing stored data.
  static const String clearedDataMessage = 'Saved profile and checklist cleared.';

  /// Settings heading for theme choice.
  static const String themeHeading = 'Display contrast and theme';

  /// Settings heading for data sources.
  static const String sourcesHeading = 'Data sources and assumptions';

  /// Data sources summary text.
  static const String sourcesBody =
      'Live hourly PM2.5, PM10, and AQI come from Open-Meteo Air Quality API '
      'mapped to CPCB AQI bands. Exposure and emission numbers are transparent '
      'rule-of-thumb estimates, not clinical measurements.';
}
