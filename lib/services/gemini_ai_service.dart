import 'package:http/http.dart' as http;

import '../core/app_error.dart';
import '../core/config.dart';
import '../core/constants.dart';
import '../core/logger.dart';
import '../core/result.dart';
import '../core/strings.dart';
import '../models/air_context.dart';
import '../models/plan_narrative.dart';
import '../validation/input_validator.dart';
import 'ai_service.dart';
import 'gemini_http_client.dart';
import 'gemini_prompt_builder.dart';
import 'gemini_response_parser.dart';
import 'lru_cache.dart';
import 'rate_limiter.dart';

/// Gemini REST API service with LRU caching, prompt safety, and JSON validation.
class GeminiAiService implements AiService {
  /// Creates a [GeminiAiService] with injectable dependencies.
  GeminiAiService({
    required http.Client client,
    required AppConfig config,
    DateTime Function()? now,
    RateLimiter? rateLimiter,
    LruCache<String, PlanNarrative>? planCache,
    LruCache<String, String>? askCache,
    AppLogger logger = const AppLogger(),
  })  : _http = GeminiHttpClient(
          client: client,
          config: config,
          rateLimiter: rateLimiter ?? RateLimiter(now: now),
          logger: logger,
        ),
        _now = now ?? DateTime.now,
        _planCache = planCache ??
            LruCache<String, PlanNarrative>(
              capacity: AppConstants.aiCacheCapacity,
            ),
        _askCache = askCache ??
            LruCache<String, String>(capacity: AppConstants.aiCacheCapacity);

  final GeminiHttpClient _http;
  final DateTime Function() _now;
  final LruCache<String, PlanNarrative> _planCache;
  final LruCache<String, String> _askCache;

  @override
  Future<Result<PlanNarrative>> personalizePlan(AirContext context) async {
    final String key = _planCacheKey(context);
    final PlanNarrative? cached = _planCache.get(key);
    if (cached != null) {
      return Success<PlanNarrative>(cached);
    }
    final Result<String> raw =
        await _http.postPrompt(GeminiPromptBuilder.buildPlanBody(context));
    return raw.fold(
      onFailure: Failure<PlanNarrative>.new,
      onSuccess: (String text) => _decodePlan(key, text),
    );
  }

  @override
  Future<Result<String>> askAssistant(
    AirContext context,
    String question,
  ) async {
    final Result<String> validated =
        InputValidator.validateChatQuestion(question);
    if (validated.isFailure) {
      return Failure<String>(validated.errorOrNull!);
    }
    final String safeQ = validated.valueOrNull!;
    final String key =
        LruCache.stableHash('${_planCacheKey(context)}|${safeQ.toLowerCase()}');
    final String? cached = _askCache.get(key);
    if (cached != null) {
      return Success<String>(cached);
    }
    final Result<String> raw =
        await _http.postPrompt(GeminiPromptBuilder.buildAskBody(context, safeQ));
    return raw.fold(
      onFailure: Failure<String>.new,
      onSuccess: (String text) {
        final String clean = InputValidator.sanitizeText(text, maxLength: 1000);
        if (clean.isEmpty) {
          return _invalid<String>();
        }
        _askCache.put(key, clean);
        return Success<String>(clean);
      },
    );
  }

  Result<PlanNarrative> _decodePlan(String key, String text) {
    try {
      final PlanNarrative? parsed =
          GeminiResponseParser.parsePlanJson(text, _now());
      if (parsed == null) {
        return _invalid<PlanNarrative>();
      }
      _planCache.put(key, parsed);
      return Success<PlanNarrative>(parsed);
    } catch (_) {
      return _invalid<PlanNarrative>();
    }
  }

  String _planCacheKey(AirContext ctx) => LruCache.stableHash(
        '${ctx.reading.cityName}|${ctx.reading.aqi}|${ctx.bandInfo.band.name}|'
        '${ctx.profile.adults}|${ctx.profile.childrenUnder12}|'
        '${ctx.profile.eldersOver60}|${ctx.profile.commuteMode.name}|'
        '${ctx.profile.cookingFuel.name}|${ctx.profile.ownsPurifier}',
      );

  Failure<T> _invalid<T>() => Failure<T>(
        const AppError(
          code: AppErrorCode.invalidResponse,
          userMessage: AppStrings.errorInvalidResponse,
        ),
      );
}
