import 'dart:async';

import 'package:http/http.dart' as http;

import '../core/app_error.dart';
import '../core/cities.dart';
import '../core/config.dart';
import '../core/constants.dart';
import '../core/logger.dart';
import '../core/result.dart';
import '../core/strings.dart';
import 'air_quality_repository.dart';
import 'open_meteo_parser.dart';

class _CachedAirEntry {
  const _CachedAirEntry({required this.snapshot, required this.cachedAt});
  final AirSnapshot snapshot;
  final DateTime cachedAt;
}

/// Fetches hourly PM2.5, PM10, and US AQI from the keyless Open-Meteo API.
class OpenMeteoAirQualityRepository implements AirQualityRepository {
  /// Creates an [OpenMeteoAirQualityRepository] with injectable dependencies.
  OpenMeteoAirQualityRepository({
    required http.Client client,
    DateTime Function()? now,
    String baseUrl = AppConfig.defaultOpenMeteoBaseUrl,
    AppLogger logger = const AppLogger(),
  })  : _client = client,
        _now = now ?? DateTime.now,
        _baseUrl = baseUrl,
        _logger = logger;

  final http.Client _client;
  final DateTime Function() _now;
  final String _baseUrl;
  final AppLogger _logger;
  final Map<String, _CachedAirEntry> _cache = <String, _CachedAirEntry>{};

  @override
  Future<Result<AirSnapshot>> fetchAirQuality(
    CityOption city, {
    bool forceRefresh = false,
  }) async {
    final DateTime current = _now();
    if (!forceRefresh) {
      final _CachedAirEntry? cached = _cache[city.name];
      if (cached != null &&
          current.difference(cached.cachedAt) < AppConstants.airCacheTtl) {
        return Success<AirSnapshot>(cached.snapshot);
      }
    }
    final Uri uri = _buildUri(city);
    if (uri.scheme != 'https') {
      return const Failure<AirSnapshot>(
        AppError(
          code: AppErrorCode.invalidResponse,
          userMessage: AppStrings.errorInvalidResponse,
        ),
      );
    }
    return _performRequest(uri, city, current);
  }

  Uri _buildUri(CityOption city) {
    return Uri.parse(_baseUrl).replace(
      queryParameters: <String, String>{
        'latitude': city.latitude.toStringAsFixed(4),
        'longitude': city.longitude.toStringAsFixed(4),
        'hourly': 'pm2_5,pm10,us_aqi',
        'forecast_days': '2',
        'timezone': 'auto',
      },
    );
  }

  Future<Result<AirSnapshot>> _performRequest(
    Uri uri,
    CityOption city,
    DateTime now,
  ) async {
    try {
      final http.Response response =
          await _client.get(uri).timeout(AppConstants.airApiTimeout);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        _logger.warn('open_meteo', 'HTTP ${response.statusCode}');
        return Failure<AirSnapshot>(
          AppError(
            code: AppErrorCode.server,
            userMessage: AppStrings.errorServer,
            debugDetail: 'HTTP ${response.statusCode}',
          ),
        );
      }
      if (response.bodyBytes.length > AppConstants.maxResponseBytes) {
        return const Failure<AirSnapshot>(
          AppError(
            code: AppErrorCode.invalidResponse,
            userMessage: AppStrings.errorInvalidResponse,
          ),
        );
      }
      final Result<AirSnapshot> parsed =
          OpenMeteoParser.parse(response.body, city);
      if (parsed.isSuccess) {
        _cache[city.name] = _CachedAirEntry(
          snapshot: parsed.valueOrNull!,
          cachedAt: now,
        );
      }
      return parsed;
    } on TimeoutException {
      return const Failure<AirSnapshot>(
        AppError(code: AppErrorCode.timeout, userMessage: AppStrings.errorTimeout),
      );
    } catch (e) {
      _logger.warn('open_meteo', 'Network failure: $e');
      return const Failure<AirSnapshot>(
        AppError(code: AppErrorCode.network, userMessage: AppStrings.errorNetwork),
      );
    }
  }
}
