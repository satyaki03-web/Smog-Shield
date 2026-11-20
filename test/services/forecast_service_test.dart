import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/hourly_forecast.dart';
import 'package:smog_shield/services/forecast_service.dart';

void main() {
  late ForecastService service;
  final DateTime baseTime = DateTime(2026, 11, 20, 6);

  setUp(() {
    service = ForecastService(now: () => baseTime);
  });

  List<HourlyPoint> makeSeries(List<int> aqis) {
    return List<HourlyPoint>.generate(
      aqis.length,
      (int i) => HourlyPoint(
        time: baseTime.add(Duration(hours: i)),
        aqi: aqis[i],
        pm25: aqis[i] * 0.5,
      ),
    );
  }

  group('ForecastService', () {
    test('handles empty list gracefully', () {
      final HourlyForecast result = service.analyze(const <HourlyPoint>[]);
      expect(result.points, isEmpty);
      expect(result.cleanestWindow, isNull);
      expect(result.worstWindow, isNull);
    });

    test('handles single point list by returning a 1-hour window', () {
      final HourlyForecast result = service.analyze(makeSeries(<int>[180]));
      expect(result.points.length, 1);
      expect(result.cleanestWindow?.averageAqi, 180);
      expect(result.worstWindow?.averageAqi, 180);
      expect(result.cleanestWindow?.end, baseTime.add(const Duration(hours: 1)));
    });

    test('handles ties by deterministically picking the earliest window', () {
      final HourlyForecast result =
          service.analyze(makeSeries(<int>[200, 200, 200, 200]));
      expect(result.cleanestWindow?.start, baseTime);
      expect(result.cleanestWindow?.averageAqi, 200);
      expect(result.worstWindow?.start, baseTime);
    });

    test('finds cleanest at start and worst at end for rising series', () {
      final HourlyForecast result =
          service.analyze(makeSeries(<int>[80, 90, 150, 220, 320, 360]));
      expect(result.cleanestWindow?.start, baseTime);
      expect(result.cleanestWindow?.averageAqi, 85);
      expect(result.worstWindow?.start, baseTime.add(const Duration(hours: 4)));
      expect(result.worstWindow?.end, baseTime.add(const Duration(hours: 6)));
      expect(result.worstWindow?.averageAqi, 340);
    });

    test('finds worst at start and cleanest at end for falling series', () {
      final HourlyForecast result =
          service.analyze(makeSeries(<int>[420, 400, 300, 200, 120, 100]));
      expect(result.worstWindow?.start, baseTime);
      expect(result.worstWindow?.averageAqi, 410);
      expect(
        result.cleanestWindow?.start,
        baseTime.add(const Duration(hours: 4)),
      );
      expect(result.cleanestWindow?.averageAqi, 110);
    });

    test('evaluates 24-hour horizon and ignores hours beyond 24', () {
      final List<int> thirtyHours = List<int>.filled(30, 300);
      thirtyHours[10] = 110;
      thirtyHours[11] = 120;
      thirtyHours[26] = 10;
      thirtyHours[27] = 10;

      final HourlyForecast result = service.analyze(makeSeries(thirtyHours));
      expect(result.points.length, 24);
      expect(
        result.cleanestWindow?.start,
        baseTime.add(const Duration(hours: 10)),
      );
      expect(result.cleanestWindow?.averageAqi, 115);
    });
  });
}
