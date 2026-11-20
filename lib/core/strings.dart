export 'strings_dashboard.dart';
export 'strings_profile.dart';

/// Core user-facing application strings, disclaimers, and generic errors.
class AppStrings {
  const AppStrings._();

  /// Application title.
  static const String appTitle = 'Smog Shield';

  /// Short subtitle describing the app purpose.
  static const String appSubtitle =
      'Practical daily routines for urban smog and cleaner air';

  /// Medical disclaimer displayed on Today and in Settings.
  static const String medicalDisclaimer =
      'Smog Shield gives general environmental estimates, not medical advice. '
      'If anyone has chest pain, severe wheezing, bluish lips, or trouble '
      'breathing, seek urgent medical care right away.';

  /// Label displayed on selected cards alongside the checkmark icon.
  static const String selectedLabel = 'Selected';

  /// Generic network error message.
  static const String errorNetwork =
      'Could not reach the air quality service. Check your connection or enter '
      'an AQI reading manually.';

  /// Generic timeout error message.
  static const String errorTimeout =
      'The service took too long to respond. Showing offline guidance instead.';

  /// Generic server error message.
  static const String errorServer =
      'The remote service returned an unexpected status. Please try again.';

  /// Generic invalid response message.
  static const String errorInvalidResponse =
      'Received incomplete data from the service. Using verified offline rules.';

  /// Rate limit warning message.
  static const String errorRateLimited =
      'Please wait a few seconds before sending another AI request.';

  /// Missing AI key message.
  static const String errorMissingAiKey =
      'No Gemini API key is set. Showing verified offline guidance.';

  /// Generic storage failure message.
  static const String errorStorage =
      'Could not save changes locally on this device.';

  /// Banner note when showing deterministic fallback text instead of live AI.
  static const String fallbackAiNotice =
      'Offline rule-based summary shown. Add a Gemini API key or check your '
      'network to personalize wording with AI.';

  /// Banner note when manual AQI override is active.
  static const String manualAqiNotice =
      'Using your manual AQI entry. Live hourly forecast is paused until you '
      'clear manual AQI in your profile.';

  /// Loading indicator label for air data.
  static const String loadingAirData = 'Fetching latest air quality readings...';

  /// Loading indicator label for AI personalization.
  static const String loadingAiNote = 'Personalizing wording for your home...';

  /// Loading indicator label for Ask replies.
  static const String loadingAskReply = 'Preparing a practical answer...';

  /// Action label to retry failed requests.
  static const String retryButton = 'Retry';

  /// Action label to close dialogs or sheets.
  static const String closeButton = 'Close';
}
