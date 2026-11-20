import 'package:flutter/foundation.dart';

import '../core/app_error.dart';
import '../core/cities.dart';
import '../core/constants.dart';
import '../core/result.dart';
import '../models/air_reading.dart';
import '../models/hourly_forecast.dart';
import '../models/user_profile.dart';
import '../services/air_quality_repository.dart';

/// Fetches live air quality data or applies manual AQI overrides safely.
class AirController extends ChangeNotifier {
  /// Creates an [AirController] with an injected repository and clock.
  AirController({
    required AirQualityRepository repository,
    DateTime Function()? now,
  })  : _repository = repository,
        _now = now ?? DateTime.now;

  final AirQualityRepository _repository;
  final DateTime Function() _now;

  AirReading? _reading;
  List<HourlyPoint> _hourlyPoints = const <HourlyPoint>[];
  bool _isLoading = false;
  AppError? _error;
  int _requestToken = 0;

  /// Latest air reading (live, manual, or offline fallback).
  AirReading? get reading => _reading;

  /// Latest hourly forecast points for the next 24 hours.
  List<HourlyPoint> get hourlyPoints => _hourlyPoints;

  /// True while fetching live readings.
  bool get isLoading => _isLoading;

  /// Latest user-safe error if the live fetch failed.
  AppError? get error => _error;

  /// Loads air data for [profile], honouring manual AQI overrides immediately.
  Future<void> loadForProfile(
    UserProfile profile, {
    bool forceRefresh = false,
  }) async {
    final int token = ++_requestToken;
    final int? manual = profile.manualAqi;
    if (manual != null) {
      _applyManualReading(profile.cityName, manual);
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    final CityOption city = AppCities.byNameOrDefault(profile.cityName);
    final Result<AirSnapshot> result = await _repository.fetchAirQuality(
      city,
      forceRefresh: forceRefresh,
    );
    if (token != _requestToken) {
      return;
    }

    result.fold(
      onSuccess: (AirSnapshot snapshot) {
        _reading = snapshot.reading;
        _hourlyPoints = snapshot.hourlyPoints;
        _error = null;
      },
      onFailure: (AppError err) {
        _error = err;
        _reading ??= _offlineFallbackReading(profile.cityName);
        _hourlyPoints = const <HourlyPoint>[];
      },
    );

    _isLoading = false;
    notifyListeners();
  }

  /// Sets an ad-hoc manual AQI override without waiting for network calls.
  void setManualAqi(String cityName, int aqi) {
    _requestToken++;
    _applyManualReading(cityName, aqi);
  }

  void _applyManualReading(String cityName, int rawAqi) {
    final int clamped = rawAqi.clamp(AppConstants.aqiMin, AppConstants.aqiMax);
    final double estimatedPm25 = clamped * 0.55;
    _reading = AirReading(
      aqi: clamped,
      pm25: estimatedPm25,
      pm10: estimatedPm25 * 1.4,
      observedAt: _now(),
      cityName: cityName,
      isManual: true,
    );
    _hourlyPoints = const <HourlyPoint>[];
    _isLoading = false;
    _error = null;
    notifyListeners();
  }

  AirReading _offlineFallbackReading(String cityName) {
    return AirReading(
      aqi: 260,
      pm25: 145.0,
      pm10: 210.0,
      observedAt: _now(),
      cityName: cityName,
      isManual: true,
    );
  }
}
