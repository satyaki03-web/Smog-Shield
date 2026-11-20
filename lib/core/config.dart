/// Runtime configuration loaded from compile-time `--dart-define` values.
class AppConfig {
  /// Creates an [AppConfig] with explicit values, useful for testing.
  const AppConfig({
    required this.geminiApiKey,
    required this.geminiModel,
    required this.aiProxyUrl,
    this.geminiBaseUrl = defaultGeminiBaseUrl,
    this.openMeteoBaseUrl = defaultOpenMeteoBaseUrl,
  });

  /// Creates an [AppConfig] populated from `--dart-define` environment flags.
  factory AppConfig.fromEnvironment() {
    const String key = String.fromEnvironment('GEMINI_API_KEY');
    const String model = String.fromEnvironment(
      'GEMINI_MODEL',
      defaultValue: defaultGeminiModel,
    );
    const String proxy = String.fromEnvironment('AI_PROXY_URL');
    return const AppConfig(
      geminiApiKey: key,
      geminiModel: model,
      aiProxyUrl: proxy,
    );
  }

  /// Default Gemini model identifier.
  static const String defaultGeminiModel = 'gemini-4-hydrogen';

  /// Default Gemini REST API base URL.
  static const String defaultGeminiBaseUrl =
      'https://generativelanguage.googleapis.com/v1beta/models';

  /// Default Open-Meteo Air Quality API endpoint.
  static const String defaultOpenMeteoBaseUrl =
      'https://air-quality-api.open-meteo.com/v1/air-quality';

  /// Gemini API key supplied via `--dart-define=GEMINI_API_KEY=...`.
  final String geminiApiKey;

  /// Gemini model name supplied via `--dart-define=GEMINI_MODEL=...`.
  final String geminiModel;

  /// Optional HTTPS backend proxy URL supplied via `--dart-define=AI_PROXY_URL`.
  final String aiProxyUrl;

  /// Base URL for direct Gemini REST calls.
  final String geminiBaseUrl;

  /// Base URL for Open-Meteo air quality lookups.
  final String openMeteoBaseUrl;

  /// Whether either a direct API key or a backend proxy URL is configured.
  bool get hasAiEndpoint =>
      aiProxyUrl.trim().isNotEmpty || geminiApiKey.trim().isNotEmpty;

  /// Whether requests should be sent through the configured backend proxy.
  bool get usesProxy => aiProxyUrl.trim().isNotEmpty;

  /// Builds the target URI for Gemini content generation.
  Uri buildGeminiUri() {
    if (usesProxy) {
      return Uri.parse(aiProxyUrl.trim());
    }
    final String safeModel =
        geminiModel.trim().isEmpty ? defaultGeminiModel : geminiModel.trim();
    return Uri.parse('$geminiBaseUrl/$safeModel:generateContent');
  }
}
