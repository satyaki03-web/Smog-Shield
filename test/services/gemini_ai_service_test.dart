import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smog_shield/core/app_error.dart';
import 'package:smog_shield/core/config.dart';
import 'package:smog_shield/core/result.dart';
import 'package:smog_shield/models/air_context.dart';
import 'package:smog_shield/models/air_reading.dart';
import 'package:smog_shield/models/plan_narrative.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/aqi_service.dart';
import 'package:smog_shield/services/forecast_service.dart';
import 'package:smog_shield/services/gemini_ai_service.dart';
import 'package:smog_shield/services/indoor_air_service.dart';
import 'package:smog_shield/services/plan_builder.dart';
import 'package:smog_shield/services/routine_service.dart';
import 'package:smog_shield/services/swap_service.dart';

void main() {
  final DateTime t0 = DateTime(2026, 11, 20, 8);
  const AppConfig cfg = AppConfig(
    geminiApiKey: 'test-key-123',
    geminiModel: 'gemini-4-hydrogen',
    aiProxyUrl: '',
  );

  AirContext ctx() => PlanBuilder(
        aqiService: AqiService(now: () => t0),
        forecastService: ForecastService(now: () => t0),
        routineService: const RoutineService(),
        indoorAirService: const IndoorAirService(),
        swapService: const SwapService(),
      ).build(
        profile: UserProfile.defaults(),
        reading: AirReading(
          aqi: 342,
          pm25: 195,
          pm10: 270,
          observedAt: t0,
          cityName: 'Delhi',
        ),
        forecastPoints: const [],
      );

  String wrap(String inner) => jsonEncode(<String, Object?>{
        'candidates': <Object?>[
          <String, Object?>{
            'content': <String, Object?>{
              'parts': <Object?>[<String, Object?>{'text': inner}],
            },
          },
        ],
      });

  group('GeminiAiService', () {
    test('sends real readings, <user_data>, safety settings, and parses JSON', () async {
      late http.Request sent;
      final MockClient client = MockClient((http.Request req) async {
        sent = req;
        return http.Response(
          wrap(
            jsonEncode(<String, Object?>{
              'headline': 'Heavy smog in Delhi today',
              'summary': 'Stay indoors and wear a fitted N95 on errands.',
              'items': <Object?>[
                <String, Object?>{
                  'id': 'routine_mask',
                  'personalizedNote': 'Pack a child-sized mask for school.',
                },
              ],
            }),
          ),
          200,
        );
      });
      final GeminiAiService ai =
          GeminiAiService(client: client, config: cfg, now: () => t0);
      final Result<PlanNarrative> res = await ai.personalizePlan(ctx());

      expect(res.isSuccess, isTrue);
      expect(res.valueOrNull!.isFallback, isFalse);
      expect(res.valueOrNull!.headline, 'Heavy smog in Delhi today');
      expect(sent.headers['x-goog-api-key'], 'test-key-123');
      expect(sent.body, contains('<user_data>'));
      expect(sent.body, contains('</user_data>'));
      expect(sent.body, contains('AQI: 342'));
      expect(sent.body, contains('HARM_CATEGORY_DANGEROUS_CONTENT'));
    });

    test('rejects malformed, empty, schema-invalid, and oversized JSON', () async {
      Future<AppErrorCode?> run(String inner) async {
        final GeminiAiService ai = GeminiAiService(
          client: MockClient((_) async => http.Response(wrap(inner), 200)),
          config: cfg,
          now: () => t0,
        );
        return (await ai.personalizePlan(ctx())).errorOrNull?.code;
      }

      expect(await run('{bad'), AppErrorCode.invalidResponse);
      expect(await run(''), AppErrorCode.invalidResponse);
      expect(await run(jsonEncode(<String, Object?>{'headline': 'H'})), AppErrorCode.invalidResponse);
      final List<Map<String, String>> big = List<Map<String, String>>.generate(
        20,
        (int i) => <String, String>{'id': 'i$i', 'personalizedNote': 'n'},
      );
      expect(
        await run(jsonEncode(<String, Object?>{'headline': 'H', 'summary': 'S', 'items': big})),
        AppErrorCode.invalidResponse,
      );
    });

    test('handles missing key, timeout, and bad HTTP status', () async {
      final GeminiAiService noKey = GeminiAiService(
        client: MockClient((_) async => http.Response('{}', 200)),
        config: const AppConfig(geminiApiKey: '', geminiModel: '', aiProxyUrl: ''),
      );
      expect((await noKey.personalizePlan(ctx())).errorOrNull?.code, AppErrorCode.missingConfig);

      final GeminiAiService slow = GeminiAiService(
        client: MockClient((_) async => throw TimeoutException('slow')),
        config: cfg,
      );
      expect((await slow.askAssistant(ctx(), 'Mask?')).errorOrNull?.code, AppErrorCode.timeout);

      final GeminiAiService err = GeminiAiService(
        client: MockClient((_) async => http.Response('err', 500)),
        config: cfg,
      );
      expect((await err.askAssistant(ctx(), 'Mask?')).errorOrNull?.code, AppErrorCode.server);
    });
  });
}
