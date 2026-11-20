/// Single hourly forecast data point for air quality planning.
class HourlyPoint {
  /// Creates an [HourlyPoint].
  const HourlyPoint({
    required this.time,
    required this.aqi,
    required this.pm25,
  });

  /// Start timestamp of the forecast hour.
  final DateTime time;

  /// Forecast AQI value for this hour.
  final int aqi;

  /// Forecast PM2.5 concentration in ug/m3.
  final double pm25;

  /// Returns a copy with selectively updated fields.
  HourlyPoint copyWith({DateTime? time, int? aqi, double? pm25}) {
    return HourlyPoint(
      time: time ?? this.time,
      aqi: aqi ?? this.aqi,
      pm25: pm25 ?? this.pm25,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is HourlyPoint &&
            time == other.time &&
            aqi == other.aqi &&
            pm25 == other.pm25;
  }

  @override
  int get hashCode => Object.hash(time, aqi, pm25);
}

/// Summary of a contiguous multi-hour window (cleanest or worst).
class TimeWindow {
  /// Creates a [TimeWindow].
  const TimeWindow({
    required this.start,
    required this.end,
    required this.averageAqi,
  });

  /// Start of the time window.
  final DateTime start;

  /// End of the time window.
  final DateTime end;

  /// Mean AQI rounded to the nearest integer across the window.
  final int averageAqi;

  /// Returns a copy with selectively replaced fields.
  TimeWindow copyWith({DateTime? start, DateTime? end, int? averageAqi}) {
    return TimeWindow(
      start: start ?? this.start,
      end: end ?? this.end,
      averageAqi: averageAqi ?? this.averageAqi,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is TimeWindow &&
            start == other.start &&
            end == other.end &&
            averageAqi == other.averageAqi;
  }

  @override
  int get hashCode => Object.hash(start, end, averageAqi);
}

/// Hourly forecast series together with computed cleanest and worst windows.
class HourlyForecast {
  /// Creates an [HourlyForecast].
  const HourlyForecast({
    required this.points,
    this.cleanestWindow,
    this.worstWindow,
  });

  /// Empty forecast used when offline or using manual AQI.
  static const HourlyForecast empty = HourlyForecast(points: <HourlyPoint>[]);

  /// Ordered hourly points for up to the next 24 hours.
  final List<HourlyPoint> points;

  /// Best 2-hour window for brief ventilation or essential errands.
  final TimeWindow? cleanestWindow;

  /// Worst 2-hour window to avoid outdoor exposure.
  final TimeWindow? worstWindow;

  /// Returns a copy with selectively replaced fields.
  HourlyForecast copyWith({
    List<HourlyPoint>? points,
    TimeWindow? cleanestWindow,
    TimeWindow? worstWindow,
  }) {
    return HourlyForecast(
      points: points ?? this.points,
      cleanestWindow: cleanestWindow ?? this.cleanestWindow,
      worstWindow: worstWindow ?? this.worstWindow,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is HourlyForecast &&
            _listEquals(points, other.points) &&
            cleanestWindow == other.cleanestWindow &&
            worstWindow == other.worstWindow;
  }

  @override
  int get hashCode =>
      Object.hash(Object.hashAll(points), cleanestWindow, worstWindow);

  static bool _listEquals<T>(List<T> a, List<T> b) {
    if (a.length != b.length) {
      return false;
    }
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) {
        return false;
      }
    }
    return true;
  }
}
