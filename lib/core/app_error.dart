/// Categorized application error codes handled across layers.
enum AppErrorCode {
  /// Network connectivity or socket failure.
  network,

  /// Request exceeded configured timeout duration.
  timeout,

  /// Remote service returned a non-success HTTP status.
  server,

  /// Remote payload failed parsing or schema validation.
  invalidResponse,

  /// User input failed validation rules.
  validation,

  /// Client-side rate limiter blocked an overly frequent request.
  rateLimited,

  /// Local preference storage read or write failed.
  storage,

  /// Required runtime configuration or key was missing.
  missingConfig,

  /// Unexpected fallback error.
  unknown,
}

/// Typed, immutable error object surfaced through [Result].
class AppError {
  /// Creates an [AppError] with a user-safe message and optional debug note.
  const AppError({
    required this.code,
    required this.userMessage,
    this.debugDetail,
  });

  /// Machine-readable error category.
  final AppErrorCode code;

  /// Plain-language message safe to display directly in the UI.
  final String userMessage;

  /// Optional non-sensitive diagnostic detail for logging only.
  final String? debugDetail;

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is AppError &&
            code == other.code &&
            userMessage == other.userMessage &&
            debugDetail == other.debugDetail;
  }

  @override
  int get hashCode => Object.hash(code, userMessage, debugDetail);

  @override
  String toString() => 'AppError($code, $userMessage)';
}
