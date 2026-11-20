import '../core/result.dart';
import '../models/air_context.dart';
import '../models/plan_narrative.dart';

/// Contract for AI personalization and Q&A services.
abstract class AiService {
  /// Rewrites and personalizes the deterministic [context] plan into a narrative.
  Future<Result<PlanNarrative>> personalizePlan(AirContext context);

  /// Answers a bounded user [question] grounded in [context].
  Future<Result<String>> askAssistant(AirContext context, String question);
}
