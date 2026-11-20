import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smog_shield/core/app_error.dart';
import 'package:smog_shield/core/cities.dart';
import 'package:smog_shield/core/result.dart';
import 'package:smog_shield/services/air_quality_repository.dart';
import 'package:smog_shield/services/open_meteo_air_quality_repository.dart';

void main() {
  final CityOption delhi = AppCities.list.first;

  String validPayload() => jsonEncode(<String, Object?>{
        'hourly': <String, Object?>{
          'time': <String>['2026-11-20T06:00', '2026-11-20T07:00'],
          'us_aqi': <int>[312, 290],
          'pm2_5': <double>[180.5, 165.0],
          'pm10': <double>[250.0, 230.0],
        },
      });

  group('OpenMeteoAirQualityRepository', () {
    test('parses valid response and caches within 10 minutes then refreshes after', () async {
      int calls = 0;
      DateTime clock = DateTime(2026, 11, 20, 8);
      final MockClient client = MockClient((http.Request req) async {
        calls++;
        return http.Response(validPayload(), 200);
      });
      final OpenMeteoAirQualityRepository repo = OpenMeteoAirQualityRepository(
        client: client,
        now: () => clock,
      );

      final Result<AirSnapshot> first = await repo.fetchAirQuality(delhi);
      expect(first.isSuccess, isTrue);
      expect(first.valueOrNull!.reading.aqi, 312);
      expect(first.valueOrNull!.hourlyPoints.length, 2);
      expect(calls, 1);

      clock = clock.add(const Duration(minutes: 9));
      final Result<AirSnapshot> cached = await repo.fetchAirQuality(delhi);
      expect(cached.isSuccess, isTrue);
      expect(calls, 1);

      clock = clock.add(const Duration(minutes: 2));
      final Result<AirSnapshot> refreshed = await repo.fetchAirQuality(delhi);
      expect(refreshed.isSuccess, isTrue);
      expect(calls, 2);
    });

    test('handles 4xx, 5xx, timeout, and network errors cleanly', () async {
      final OpenMeteoAirQualityRepository repo404 = OpenMeteoAirQualityRepository(
        client: MockClient((_) async => http.Response('not found', 404)),
      );
      expect(
        (await repo404.fetchAirQuality(delhi)).errorOrNull?.code,
        AppErrorCode.server,
      );

      final OpenMeteoAirQualityRepository repo500 = OpenMeteoAirQualityRepository(
        client: MockClient((_) async => http.Response('err', 503)),
      );
      expect(
        (await repo500.fetchAirQuality(delhi)).errorOrNull?.code,
        AppErrorCode.server,
      );

      final OpenMeteoAirQualityRepository repoTimeout =
          OpenMeteoAirQualityRepository(
        client: MockClient((_) async => throw TimeoutException('slow')),
      );
      expect(
        (await repoTimeout.fetchAirQuality(delhi)).errorOrNull?.code,
        AppErrorCode.timeout,
      );
    });

    test('rejects malformed JSON, missing fields, and out-of-range values', () async {
      final OpenMeteoAirQualityRepository badJson = OpenMeteoAirQualityRepository(
        client: MockClient((_) async => http.Response('{not-json', 200)),
      );
      expect(
        (await badJson.fetchAirQuality(delhi)).errorOrNull?.code,
        AppErrorCode.invalidResponse,
      );

      final OpenMeteoAirQualityRepository missingHourly =
          OpenMeteoAirQualityRepository(
        client: MockClient((_) async => http.Response('{}', 200)),
      );
      expect(
        (await missingHourly.fetchAirQuality(delhi)).errorOrNull?.code,
        AppErrorCode.invalidResponse,
      );

      final OpenMeteoAirQualityRepository outOfRange =
          OpenMeteoAirQualityRepository(
        client: MockClient(
          (_) async => http.Response(
            jsonEncode(<String, Object?>{
              'hourly': <String, Object?>{
                'time': <String>['2026-11-20T06:00'],
                'us_aqi': <int>[9999],
                'pm2_5': <double>[-5.0],
                'pm10': <double>[10.0],
              },
            }),
            200,
          ),
        ),
      );
      expect(
        (await outOfRange.fetchAirQuality(delhi)).errorOrNull?.code,
        AppErrorCode.invalidResponse,
      );
    });
  });
}
