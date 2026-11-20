import '../core/formatters.dart';
import '../core/result.dart';
import '../core/strings.dart';
import '../models/air_context.dart';
import '../models/plan_narrative.dart';
import '../models/recommendation.dart';
import '../validation/input_validator.dart';
import 'ai_service.dart';

/// Offline deterministic AI fallback built directly from the verified rule engine.
class FallbackAiService implements AiService {
  /// Creates a [FallbackAiService] with an optional injectable clock.
  FallbackAiService({DateTime Function()? now}) : _now = now ?? DateTime.now;

  final DateTime Function() _now;

  @override
  Future<Result<PlanNarrative>> personalizePlan(AirContext context) async {
    final String city = context.reading.cityName;
    final int aqi = context.reading.aqi;
    final String band = context.bandInfo.band.label;
    final String headline = '$city air is $band (AQI $aqi): practical steps today';
    final String windowNote = context.forecast.cleanestWindow != null
        ? ' Your cleanest 2-hour window is '
            '${AppFormatters.formatWindow(context.forecast.cleanestWindow!.start, context.forecast.cleanestWindow!.end)}.'
        : '';
    final String summary =
        '${context.bandInfo.advice}$windowNote ${context.whoIsAtRisk}';
    final Map<String, String> notes = <String, String>{};
    for (final Recommendation item in context.recommendations.take(6)) {
      notes[item.id] =
          'Priority ${item.priority.label.toLowerCase()} for your '
          '${context.profile.homeType.label.toLowerCase()} household in $city.';
    }
    return Success<PlanNarrative>(
      PlanNarrative(
        headline: headline,
        summary: summary,
        itemNotes: Map<String, String>.unmodifiable(notes),
        isFallback: true,
        generatedAt: _now(),
      ),
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
    final String lower = validated.valueOrNull!.toLowerCase();
    final String answer = _matchOfflineTopic(context, lower);
    return Success<String>('$answer ${AppStrings.medicalDisclaimer}');
  }

  String _matchOfflineTopic(AirContext ctx, String q) {
    final String band = ctx.bandInfo.band.label;
    final int aqi = ctx.reading.aqi;
    if (q.contains('mask') || q.contains('n95')) {
      return 'At AQI $aqi ($band), ${ctx.bandInfo.maskGuidance} '
          'Ensure the nose wire pinches firmly with no side gaps.';
    }
    if (q.contains('window') || q.contains('ventilat') || q.contains('open')) {
      final String window = ctx.forecast.cleanestWindow != null
          ? AppFormatters.formatWindow(
              ctx.forecast.cleanestWindow!.start,
              ctx.forecast.cleanestWindow!.end,
            )
          : 'mid-afternoon (around 13:00 to 15:00)';
      return 'At AQI $aqi ($band), keep windows closed during morning and night '
          'peaks and air rooms briefly during $window.';
    }
    if (q.contains('purifier') || q.contains('plant') || q.contains('diy')) {
      return 'Run a HEPA purifier in the closed bedroom overnight, or pair a box '
          'fan with a MERV-13 filter on a tight budget. Houseplants do not clear '
          'fine PM2.5 meaningfully.';
    }
    if (q.contains('school') || q.contains('child') || q.contains('play')) {
      return 'At AQI $aqi ($band), ${ctx.whoIsAtRisk} Use child-sized fitted '
          'masks on high-smog mornings and move active play indoors above AQI 200.';
    }
    final List<Recommendation> top = ctx.topActions(2);
    final String actions = top.map((Recommendation r) => r.title).join('; ');
    return 'In ${ctx.reading.cityName} at AQI $aqi ($band), focus first on: '
        '$actions.';
  }
}
