import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/app_error.dart';
import '../core/config.dart';
import '../core/constants.dart';
import '../core/logger.dart';
import '../core/result.dart';
import '../core/strings.dart';
import 'gemini_response_parser.dart';
import 'rate_limiter.dart';

/// Low-level HTTPS transport for Gemini REST requests with rate limiting and caps.
class GeminiHttpClient {
  /// Creates a [GeminiHttpClient] with injectable transport and limiter.
  GeminiHttpClient({
    required http.Client client,
    required AppConfig config,
    required RateLimiter rateLimiter,
    AppLogger logger = const AppLogger(),
  })  : _client = client,
        _config = config,
        _rateLimiter = rateLimiter,
        _logger = logger;

  final http.Client _client;
  final AppConfig _config;
  final RateLimiter _rateLimiter;
  final AppLogger _logger;

  /// Sends [body] to Gemini or configured proxy and extracts candidate text.
  Future<Result<String>> postPrompt(Map<String, Object?> body) async {
    if (!_config.hasAiEndpoint) {
      return const Failure<String>(
        AppError(
          code: AppErrorCode.missingConfig,
          userMessage: AppStrings.errorMissingAiKey,
        ),
      );
    }
    final Uri uri = _config.buildGeminiUri();
    if (uri.scheme != 'https') {
      return _invalid();
    }
    if (!_rateLimiter.tryAcquire()) {
      return const Failure<String>(
        AppError(
          code: AppErrorCode.rateLimited,
          userMessage: AppStrings.errorRateLimited,
        ),
      );
    }
    return _send(uri, body);
  }

  Future<Result<String>> _send(Uri uri, Map<String, Object?> body) async {
    final Map<String, String> headers = <String, String>{
      'Content-Type': 'application/json',
      if (!_config.usesProxy) 'x-goog-api-key': _config.geminiApiKey.trim(),
    };
    try {
      final http.Response res = await _client
          .post(uri, headers: headers, body: jsonEncode(body))
          .timeout(AppConstants.aiApiTimeout);
      return _parseHttpResponse(res);
    } on TimeoutException {
      return const Failure<String>(
        AppError(
          code: AppErrorCode.timeout,
          userMessage: AppStrings.errorTimeout,
        ),
      );
    } catch (e) {
      _logger.warn('gemini', 'Request failed: $e');
      return const Failure<String>(
        AppError(
          code: AppErrorCode.network,
          userMessage: AppStrings.errorNetwork,
        ),
      );
    }
  }

  Result<String> _parseHttpResponse(http.Response res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _logger.warn('gemini', 'HTTP ${res.statusCode}');
      return Failure<String>(
        AppError(
          code: AppErrorCode.server,
          userMessage: AppStrings.errorServer,
          debugDetail: 'HTTP ${res.statusCode}',
        ),
      );
    }
    if (res.bodyBytes.length > AppConstants.maxResponseBytes) {
      return _invalid();
    }
    final Object? decoded = jsonDecode(res.body);
    if (decoded is! Map<String, Object?>) {
      return _invalid();
    }
    final String? text = GeminiResponseParser.extractCandidateText(decoded);
    return (text == null || text.isEmpty) ? _invalid() : Success<String>(text);
  }

  Failure<String> _invalid() => const Failure<String>(
        AppError(
          code: AppErrorCode.invalidResponse,
          userMessage: AppStrings.errorInvalidResponse,
        ),
      );
}
