import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:smog_shield/core/app_error.dart';
import 'package:smog_shield/core/cities.dart';
import 'package:smog_shield/core/result.dart';
import 'package:smog_shield/models/air_context.dart';
import 'package:smog_shield/models/air_reading.dart';
import 'package:smog_shield/models/hourly_forecast.dart';
import 'package:smog_shield/models/plan_narrative.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/ai_service.dart';
import 'package:smog_shield/services/air_quality_repository.dart';
import 'package:smog_shield/services/aqi_service.dart';
import 'package:smog_shield/services/fallback_ai_service.dart';
import 'package:smog_shield/services/forecast_service.dart';
import 'package:smog_shield/services/indoor_air_service.dart';
import 'package:smog_shield/services/plan_builder.dart';
import 'package:smog_shield/services/routine_service.dart';
import 'package:smog_shield/services/swap_service.dart';
import 'package:smog_shield/state/air_controller.dart';
import 'package:smog_shield/state/chat_controller.dart';
import 'package:smog_shield/state/plan_controller.dart';

class _MockAirRepo extends Mock implements AirQualityRepository {}

class _MockAi extends Mock implements AiService {}

class _FakeCity extends Fake implements CityOption {}

class _FakeContext extends Fake implements AirContext {}

void main() {
  final DateTime now = DateTime(2026, 11, 20, 8);

  setUpAll(() {
    registerFallbackValue(_FakeCity());
    registerFallbackValue(_FakeContext());
  });

  PlanBuilder makeBuilder() => PlanBuilder(
        aqiService: AqiService(now: () => now),
        forecastService: ForecastService(now: () => now),
        routineService: const RoutineService(),
        indoorAirService: const IndoorAirService(),
        swapService: const SwapService(),
      );

  test('AirController transitions through success, failure fallback, and manual AQI', () async {
    final _MockAirRepo repo = _MockAirRepo();
    final AirController ctrl = AirController(repository: repo, now: () => now);

    when(() => repo.fetchAirQuality(any(), forceRefresh: any(named: 'forceRefresh')))
        .thenAnswer(
      (_) async => Success<AirSnapshot>(
        AirSnapshot(
          reading: AirReading(
            aqi: 280,
            pm25: 150,
            pm10: 210,
            observedAt: now,
            cityName: 'Delhi',
          ),
          hourlyPoints: <HourlyPoint>[HourlyPoint(time: now, aqi: 280, pm25: 150)],
        ),
      ),
    );
    await ctrl.loadForProfile(UserProfile.defaults());
    expect(ctrl.reading?.aqi, 280);
    expect(ctrl.error, isNull);

    when(() => repo.fetchAirQuality(any(), forceRefresh: any(named: 'forceRefresh')))
        .thenAnswer(
      (_) async => const Failure<AirSnapshot>(
        AppError(code: AppErrorCode.network, userMessage: 'Offline'),
      ),
    );
    await ctrl.loadForProfile(UserProfile.defaults());
    expect(ctrl.error?.code, AppErrorCode.network);

    ctrl.setManualAqi('Delhi', 410);
    expect(ctrl.reading?.aqi, 410);
    expect(ctrl.reading?.isManual, isTrue);
  });

  test('PlanController builds immediate rule plan and upgrades on explicit AI call', () async {
    final _MockAi ai = _MockAi();
    final PlanController ctrl = PlanController(
      planBuilder: makeBuilder(),
      aiService: ai,
      fallbackService: FallbackAiService(now: () => now),
    );

    await ctrl.rebuildDeterministic(
      profile: UserProfile.defaults(),
      reading: AirReading(
        aqi: 320,
        pm25: 175,
        pm10: 240,
        observedAt: now,
        cityName: 'Delhi',
      ),
      hourlyPoints: const <HourlyPoint>[],
    );
    expect(ctrl.narrative?.isFallback, isTrue);
    verifyNever(() => ai.personalizePlan(any()));

    when(() => ai.personalizePlan(any())).thenAnswer(
      (_) async => Success<PlanNarrative>(
        PlanNarrative(
          headline: 'Personalized Delhi note',
          summary: 'Custom summary',
          itemNotes: const <String, String>{'routine_mask': 'Fit check'},
          isFallback: false,
          generatedAt: now,
        ),
      ),
    );
    await ctrl.personalizeWithAi();
    expect(ctrl.narrative?.isFallback, isFalse);
    expect(ctrl.narrative?.headline, 'Personalized Delhi note');
  });

  test('ChatController enforces validation and caps history at 10 messages', () async {
    final ChatController chat = ChatController(aiService: FallbackAiService());
    final AirContext ctx = makeBuilder().build(
      profile: UserProfile.defaults(),
      reading: AirReading(
        aqi: 300,
        pm25: 160,
        pm10: 220,
        observedAt: now,
        cityName: 'Delhi',
      ),
      forecastPoints: const <HourlyPoint>[],
    );
    await chat.ask(ctx, '   ');
    expect(chat.error?.code, AppErrorCode.validation);

    for (int i = 0; i < 6; i++) {
      await chat.ask(ctx, 'Question $i about masks');
    }
    expect(chat.messages.length, 10);
    chat.clearHistory();
    expect(chat.messages, isEmpty);
  });
}
