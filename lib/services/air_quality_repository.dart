import '../core/cities.dart';
import '../core/result.dart';
import '../models/air_reading.dart';
import '../models/hourly_forecast.dart';

/// Combined live reading and hourly forecast returned by a repository.
class AirSnapshot {
  /// Creates an immutable [AirSnapshot].
  const AirSnapshot({
    required this.reading,
    required this.hourlyPoints,
  });

  /// Latest point-in-time air quality reading.
  final AirReading reading;

  /// Hourly forecast points for up to the next 24 hours.
  final List<HourlyPoint> hourlyPoints;
}

/// Abstract repository contract for fetching live air quality data.
abstract class AirQualityRepository {
  /// Fetches current and hourly air quality readings for [city].
  Future<Result<AirSnapshot>> fetchAirQuality(
    CityOption city, {
    bool forceRefresh = false,
  });
}
