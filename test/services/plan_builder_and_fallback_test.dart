import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/air_context.dart';
import 'package:smog_shield/models/air_reading.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/hourly_forecast.dart';
import 'package:smog_shield/models/recommendation.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/aqi_service.dart';
import 'package:smog_shield/services/fallback_ai_service.dart';
import 'package:smog_shield/services/forecast_service.dart';
import 'package:smog_shield/services/indoor_air_service.dart';
import 'package:smog_shield/services/plan_builder.dart';
import 'package:smog_shield/services/routine_service.dart';
import 'package:smog_shield/services/swap_service.dart';

void main() {
  final DateTime t0 = DateTime(2026, 11, 20, 6);
  final PlanBuilder builder = PlanBuilder(
    aqiService: AqiService(now: () => t0),
    forecastService: ForecastService(now: () => t0),
    routineService: const RoutineService(),
    indoorAirService: const IndoorAirService(),
    swapService: const SwapService(),
  );
  final FallbackAiService fallback = FallbackAiService(now: () => t0);

  AirContext makeContext(int aqi) {
    return builder.build(
      profile: UserProfile.defaults(),
      reading: AirReading(
        aqi: aqi,
        pm25: aqi * 0.55,
        pm10: aqi * 0.8,
        observedAt: t0,
        cityName: 'Delhi',
      ),
      forecastPoints: <HourlyPoint>[
        HourlyPoint(time: t0, aqi: aqi, pm25: aqi * 0.55),
        HourlyPoint(
          time: t0.add(const Duration(hours: 1)),
          aqi: (aqi - 40).clamp(0, 999),
          pm25: aqi * 0.45,
        ),
      ],
    );
  }

  group('PlanBuilder', () {
    test('sorts combined recommendations deterministically by priority then id', () {
      final AirContext ctx = makeContext(420);
      final List<Recommendation> recs = ctx.recommendations;
      for (int i = 1; i < recs.length; i++) {
        final int prevP = recs[i - 1].priority.index;
        final int currP = recs[i].priority.index;
        expect(currP, greaterThanOrEqualTo(prevP));
        if (currP == prevP) {
          expect(recs[i].id.compareTo(recs[i - 1].id), greaterThan(0));
        }
      }
    });

    test('topActions returns 3 items and byCategory partitions all recommendations', () {
      final AirContext ctx = makeContext(310);
      expect(ctx.topActions(3).length, 3);
      final int total = ctx.byCategory(RecommendationCategory.routine).length +
          ctx.byCategory(RecommendationCategory.indoor).length +
          ctx.byCategory(RecommendationCategory.swap).length;
      expect(total, ctx.recommendations.length);
    });

    test('clamps negative AQI input inside PlanBuilder', () {
      final AirContext ctx = makeContext(-50);
      expect(ctx.reading.aqi, 0);
      expect(ctx.bandInfo.band, AqiBand.good);
    });
  });

  group('FallbackAiService topic routing', () {
    test('answers mask questions with N95 guidance and disclaimer', () async {
      final res = await fallback.askAssistant(makeContext(360), 'Best mask today?');
      expect(res.valueOrNull, contains('N95'));
      expect(res.valueOrNull, contains('not medical advice'));
    });

    test('answers window ventilation questions with cleanest window', () async {
      final res =
          await fallback.askAssistant(makeContext(320), 'When should I open windows?');
      expect(res.valueOrNull, contains('06:00 to 08:00'));
    });

    test('answers purifier and plant myth questions offline', () async {
      final res =
          await fallback.askAssistant(makeContext(290), 'Do plants replace a purifier?');
      expect(res.valueOrNull, contains('MERV-13'));
      expect(res.valueOrNull, contains('Houseplants'));
    });

    test('answers school and child questions offline', () async {
      final res =
          await fallback.askAssistant(makeContext(340), 'Is school outdoor play safe?');
      expect(res.valueOrNull, contains('children'));
    });

    test('answers general questions with top actions from context', () async {
      final res = await fallback.askAssistant(makeContext(380), 'What should we do?');
      expect(res.valueOrNull, contains('Delhi'));
      expect(res.valueOrNull, contains('380'));
    });
  });
}
