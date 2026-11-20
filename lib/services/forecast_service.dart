import '../core/constants.dart';
import '../models/hourly_forecast.dart';

/// Pure Dart service finding the cleanest and worst 2-hour forecast windows.
class ForecastService {
  /// Creates a [ForecastService] with an optional injectable clock.
  ForecastService({DateTime Function()? now}) : _now = now ?? DateTime.now;

  final DateTime Function() _now;

  /// Current time helper for forecasting bounds.
  DateTime currentTime() => _now();

  /// Computes cleanest and worst 2-hour windows from up to the next 24 points.
  HourlyForecast analyze(List<HourlyPoint> rawPoints) {
    if (rawPoints.isEmpty) {
      return HourlyForecast.empty;
    }
    final int limit = rawPoints.length > AppConstants.forecastHorizonHours
        ? AppConstants.forecastHorizonHours
        : rawPoints.length;
    final List<HourlyPoint> bounded = List<HourlyPoint>.unmodifiable(
      rawPoints.sublist(0, limit),
    );
    if (bounded.length == 1) {
      final TimeWindow single = _windowForSingle(bounded.first);
      return HourlyForecast(
        points: bounded,
        cleanestWindow: single,
        worstWindow: single,
      );
    }
    final TimeWindow cleanest = _findWindow(bounded, findMinimum: true);
    final TimeWindow worst = _findWindow(bounded, findMinimum: false);
    return HourlyForecast(
      points: bounded,
      cleanestWindow: cleanest,
      worstWindow: worst,
    );
  }

  TimeWindow _windowForSingle(HourlyPoint point) {
    return TimeWindow(
      start: point.time,
      end: point.time.add(const Duration(hours: 1)),
      averageAqi: point.aqi,
    );
  }

  TimeWindow _findWindow(
    List<HourlyPoint> points, {
    required bool findMinimum,
  }) {
    const int width = AppConstants.forecastWindowHours;
    int bestIndex = 0;
    int bestSum = points[0].aqi + points[1].aqi;

    for (int i = 1; i <= points.length - width; i++) {
      final int sum = points[i].aqi + points[i + 1].aqi;
      final bool isBetter = findMinimum ? sum < bestSum : sum > bestSum;
      if (isBetter) {
        bestSum = sum;
        bestIndex = i;
      }
    }

    final DateTime start = points[bestIndex].time;
    final DateTime end = points[bestIndex + width - 1].time.add(
      const Duration(hours: 1),
    );
    return TimeWindow(
      start: start,
      end: end,
      averageAqi: (bestSum / width).round(),
    );
  }
}
