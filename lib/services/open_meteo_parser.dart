import 'dart:convert';

import '../core/app_error.dart';
import '../core/cities.dart';
import '../core/constants.dart';
import '../core/result.dart';
import '../core/strings.dart';
import '../models/air_reading.dart';
import '../models/hourly_forecast.dart';
import '../validation/input_validator.dart';
import 'air_quality_repository.dart';

/// Defensive JSON parser for Open-Meteo hourly air quality responses.
class OpenMeteoParser {
  const OpenMeteoParser._();

  /// Parses raw JSON [body] for [city] into a validated [AirSnapshot].
  static Result<AirSnapshot> parse(String body, CityOption city) {
    try {
      final Object? decoded = jsonDecode(body);
      if (decoded is! Map<String, Object?>) {
        return _invalid();
      }
      final Object? hourly = decoded['hourly'];
      if (hourly is! Map<String, Object?>) {
        return _invalid();
      }
      final List<HourlyPoint> points = _extractPoints(hourly);
      if (points.isEmpty) {
        return _invalid();
      }
      final double firstPm10 = _extractFirstPm10(hourly);
      if (!InputValidator.isValidReading(
        aqi: points.first.aqi.toDouble(),
        pm25: points.first.pm25,
        pm10: firstPm10,
      )) {
        return _invalid();
      }
      return Success<AirSnapshot>(
        AirSnapshot(
          reading: AirReading(
            aqi: points.first.aqi,
            pm25: points.first.pm25,
            pm10: firstPm10,
            observedAt: points.first.time,
            cityName: city.name,
          ),
          hourlyPoints: points,
        ),
      );
    } catch (_) {
      return _invalid();
    }
  }

  static double _extractFirstPm10(Map<String, Object?> hourly) {
    final Object? rawPm10 = hourly['pm10'];
    if (rawPm10 is List<Object?> &&
        rawPm10.isNotEmpty &&
        rawPm10.first is num) {
      return (rawPm10.first! as num).toDouble();
    }
    return 0.0;
  }

  static List<HourlyPoint> _extractPoints(Map<String, Object?> hourly) {
    final Object? times = hourly['time'];
    final Object? aqis = hourly['us_aqi'];
    final Object? pm25s = hourly['pm2_5'];
    if (times is! List<Object?> ||
        aqis is! List<Object?> ||
        pm25s is! List<Object?>) {
      return const <HourlyPoint>[];
    }
    final int count = <int>[
      times.length,
      aqis.length,
      pm25s.length,
      AppConstants.forecastHorizonHours,
    ].reduce((int a, int b) => a < b ? a : b);
    final List<HourlyPoint> result = <HourlyPoint>[];
    for (int i = 0; i < count; i++) {
      final HourlyPoint? point = _parseRow(times[i], aqis[i], pm25s[i]);
      if (point != null) {
        result.add(point);
      }
    }
    return List<HourlyPoint>.unmodifiable(result);
  }

  static HourlyPoint? _parseRow(
    Object? rawTime,
    Object? rawAqi,
    Object? rawPm25,
  ) {
    if (rawTime is! String || rawAqi is! num || rawPm25 is! num) {
      return null;
    }
    final DateTime? dt = DateTime.tryParse(rawTime);
    final double aqiVal = rawAqi.toDouble();
    final double pm25Val = rawPm25.toDouble();
    if (dt == null ||
        !InputValidator.isValidReading(aqi: aqiVal, pm25: pm25Val, pm10: 0)) {
      return null;
    }
    return HourlyPoint(time: dt, aqi: aqiVal.round(), pm25: pm25Val);
  }

  static Failure<AirSnapshot> _invalid() => const Failure<AirSnapshot>(
        AppError(
          code: AppErrorCode.invalidResponse,
          userMessage: AppStrings.errorInvalidResponse,
        ),
      );
}
