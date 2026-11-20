import 'dart:developer' as developer;

/// Minimal redacting logger that avoids `print` and strips secret tokens.
class AppLogger {
  /// Creates an [AppLogger] with an optional custom [sink] for testing.
  const AppLogger({this.sink});

  /// Optional custom log sink used in unit tests.
  final void Function(String name, String message)? sink;

  static final RegExp _apiKeyQueryPattern = RegExp(
    r'(key|api_key|apikey|token)=([^&\s]+)',
    caseSensitive: false,
  );

  static final RegExp _headerSecretPattern = RegExp(
    r'(x-goog-api-key|authorization)\s*[:=]\s*([^\s,;]+)',
    caseSensitive: false,
  );

  static final RegExp _bearerPattern = RegExp(
    r'Bearer\s+[A-Za-z0-9\-._~+/]+=*',
    caseSensitive: false,
  );

  static final RegExp _googleKeyPattern = RegExp(r'AIza[0-9A-Za-z\-_]{20,}');

  /// Redacts sensitive key patterns from [raw] text.
  static String redact(String raw) {
    var safe = raw.replaceAll(_googleKeyPattern, '[REDACTED]');
    safe = safe.replaceAll(_bearerPattern, 'Bearer [REDACTED]');
    safe = safe.replaceAllMapped(
      _apiKeyQueryPattern,
      (Match m) => '${m.group(1)}=[REDACTED]',
    );
    safe = safe.replaceAllMapped(
      _headerSecretPattern,
      (Match m) => '${m.group(1)}: [REDACTED]',
    );
    return safe;
  }

  /// Logs an informational [message] under [tag].
  void info(String tag, String message) {
    _emit(tag, redact(message));
  }

  /// Logs a warning [message] under [tag].
  void warn(String tag, String message) {
    _emit(tag, 'WARN: ${redact(message)}');
  }

  void _emit(String tag, String safeMessage) {
    final void Function(String, String)? customSink = sink;
    if (customSink != null) {
      customSink(tag, safeMessage);
      return;
    }
    developer.log(safeMessage, name: 'smog_shield.$tag');
  }
}
