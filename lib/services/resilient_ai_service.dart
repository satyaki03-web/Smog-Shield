import '../core/app_error.dart';
import '../core/logger.dart';
import '../core/result.dart';
import '../models/air_context.dart';
import '../models/plan_narrative.dart';
import 'ai_service.dart';

/// Wraps a primary [AiService] and degrades smoothly to an offline fallback.
class ResilientAiService implements AiService {
  /// Creates a [ResilientAiService] with [primary] and [fallback] services.
  const ResilientAiService({
    required AiService primary,
    required AiService fallback,
    AppLogger logger = const AppLogger(),
  })  : _primary = primary,
        _fallback = fallback,
        _logger = logger;

  final AiService _primary;
  final AiService _fallback;
  final AppLogger _logger;

  @override
  Future<Result<PlanNarrative>> personalizePlan(AirContext context) async {
    final Result<PlanNarrative> primaryResult =
        await _primary.personalizePlan(context);
    if (primaryResult.isSuccess) {
      return primaryResult;
    }
    final AppError? err = primaryResult.errorOrNull;
    if (err?.code == AppErrorCode.rateLimited) {
      return primaryResult;
    }
    _logger.info(
      'resilient_ai',
      'Falling back to offline plan narrative (${err?.code.name})',
    );
    return _fallback.personalizePlan(context);
  }

  @override
  Future<Result<String>> askAssistant(
    AirContext context,
    String question,
  ) async {
    final Result<String> primaryResult =
        await _primary.askAssistant(context, question);
    if (primaryResult.isSuccess) {
      return primaryResult;
    }
    final AppError? err = primaryResult.errorOrNull;
    if (err?.code == AppErrorCode.validation ||
        err?.code == AppErrorCode.rateLimited) {
      return primaryResult;
    }
    _logger.info(
      'resilient_ai',
      'Falling back to offline Ask reply (${err?.code.name})',
    );
    return _fallback.askAssistant(context, question);
  }

  /// Calls [askAssistant] and reports whether the answer came from fallback.
  Future<Result<({String text, bool isFallback})>> askWithSource(
    AirContext context,
    String question,
  ) async {
    final Result<String> primaryResult =
        await _primary.askAssistant(context, question);
    if (primaryResult.isSuccess) {
      return Success<({String text, bool isFallback})>(
        (text: primaryResult.valueOrNull!, isFallback: false),
      );
    }
    final AppError? err = primaryResult.errorOrNull;
    if (err?.code == AppErrorCode.validation ||
        err?.code == AppErrorCode.rateLimited) {
      return Failure<({String text, bool isFallback})>(err!);
    }
    final Result<String> fallbackResult =
        await _fallback.askAssistant(context, question);
    return fallbackResult.fold(
      onFailure: Failure<({String text, bool isFallback})>.new,
      onSuccess: (String text) => Success<({String text, bool isFallback})>(
        (text: text, isFallback: true),
      ),
    );
  }
}
