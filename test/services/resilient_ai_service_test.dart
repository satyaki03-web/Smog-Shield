import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:smog_shield/core/app_error.dart';
import 'package:smog_shield/core/result.dart';
import 'package:smog_shield/models/air_context.dart';
import 'package:smog_shield/models/air_reading.dart';
import 'package:smog_shield/models/plan_narrative.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/ai_service.dart';
import 'package:smog_shield/services/aqi_service.dart';
import 'package:smog_shield/services/fallback_ai_service.dart';
import 'package:smog_shield/services/forecast_service.dart';
import 'package:smog_shield/services/indoor_air_service.dart';
import 'package:smog_shield/services/plan_builder.dart';
import 'package:smog_shield/services/resilient_ai_service.dart';
import 'package:smog_shield/services/routine_service.dart';
import 'package:smog_shield/services/swap_service.dart';

class _MockAiService extends Mock implements AiService {}

class _FakeAirContext extends Fake implements AirContext {}

void main() {
  late _MockAiService primary;
  late FallbackAiService fallback;
  late ResilientAiService resilient;
  late AirContext context;

  setUpAll(() {
    registerFallbackValue(_FakeAirContext());
  });

  setUp(() {
    primary = _MockAiService();
    fallback = FallbackAiService(now: () => DateTime(2026, 11, 20, 9));
    resilient = ResilientAiService(primary: primary, fallback: fallback);
    final PlanBuilder builder = PlanBuilder(
      aqiService: AqiService(),
      forecastService: ForecastService(),
      routineService: const RoutineService(),
      indoorAirService: const IndoorAirService(),
      swapService: const SwapService(),
    );
    context = builder.build(
      profile: UserProfile.defaults(),
      reading: AirReading(
        aqi: 315,
        pm25: 170,
        pm10: 240,
        observedAt: DateTime(2026, 11, 20, 9),
        cityName: 'Delhi',
      ),
      forecastPoints: const [],
    );
  });

  group('ResilientAiService', () {
    test('returns primary success with isFallback = false', () async {
      final PlanNarrative live = PlanNarrative(
        headline: 'Live headline',
        summary: 'Live summary',
        itemNotes: const <String, String>{},
        isFallback: false,
        generatedAt: DateTime(2026, 11, 20, 9),
      );
      when(() => primary.personalizePlan(any()))
          .thenAnswer((_) async => Success<PlanNarrative>(live));

      final Result<PlanNarrative> res = await resilient.personalizePlan(context);
      expect(res.valueOrNull?.isFallback, isFalse);
      expect(res.valueOrNull?.headline, 'Live headline');
    });

    test('falls back on missingConfig, network, and invalidResponse with isFallback = true', () async {
      for (final AppErrorCode code in <AppErrorCode>[
        AppErrorCode.missingConfig,
        AppErrorCode.network,
        AppErrorCode.invalidResponse,
      ]) {
        when(() => primary.personalizePlan(any())).thenAnswer(
          (_) async => Failure<PlanNarrative>(
            AppError(code: code, userMessage: 'err'),
          ),
        );
        final Result<PlanNarrative> res =
            await resilient.personalizePlan(context);
        expect(res.isSuccess, isTrue);
        expect(res.valueOrNull?.isFallback, isTrue);
        expect(res.valueOrNull?.headline, contains('Delhi'));
      }
    });

    test('propagates rateLimited instead of masking cooldown', () async {
      when(() => primary.personalizePlan(any())).thenAnswer(
        (_) async => const Failure<PlanNarrative>(
          AppError(code: AppErrorCode.rateLimited, userMessage: 'Wait'),
        ),
      );
      final Result<PlanNarrative> res = await resilient.personalizePlan(context);
      expect(res.errorOrNull?.code, AppErrorCode.rateLimited);
    });

    test('askWithSource reports fallback topics cleanly when primary fails', () async {
      when(() => primary.askAssistant(any(), any())).thenAnswer(
        (_) async => const Failure<String>(
          AppError(code: AppErrorCode.network, userMessage: 'offline'),
        ),
      );
      final res = await resilient.askWithSource(context, 'Should I wear a mask?');
      expect(res.isSuccess, isTrue);
      expect(res.valueOrNull!.isFallback, isTrue);
      expect(res.valueOrNull!.text, contains('N95'));
    });
  });
}
