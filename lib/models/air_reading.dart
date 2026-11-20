/// Immutable point-in-time air quality observation for a city.
class AirReading {
  /// Creates an [AirReading].
  const AirReading({
    required this.aqi,
    required this.pm25,
    required this.pm10,
    required this.observedAt,
    required this.cityName,
    this.isManual = false,
  });

  /// Overall Air Quality Index value (clamped 0 to 999).
  final int aqi;

  /// Fine particulate matter PM2.5 in ug/m3.
  final double pm25;

  /// Coarse particulate matter PM10 in ug/m3.
  final double pm10;

  /// Timestamp when this observation was recorded.
  final DateTime observedAt;

  /// Name of the observed city.
  final String cityName;

  /// True when the user supplied a manual AQI override.
  final bool isManual;

  /// Returns a copy with selectively replaced fields.
  AirReading copyWith({
    int? aqi,
    double? pm25,
    double? pm10,
    DateTime? observedAt,
    String? cityName,
    bool? isManual,
  }) {
    return AirReading(
      aqi: aqi ?? this.aqi,
      pm25: pm25 ?? this.pm25,
      pm10: pm10 ?? this.pm10,
      observedAt: observedAt ?? this.observedAt,
      cityName: cityName ?? this.cityName,
      isManual: isManual ?? this.isManual,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is AirReading &&
            aqi == other.aqi &&
            pm25 == other.pm25 &&
            pm10 == other.pm10 &&
            observedAt == other.observedAt &&
            cityName == other.cityName &&
            isManual == other.isManual;
  }

  @override
  int get hashCode =>
      Object.hash(aqi, pm25, pm10, observedAt, cityName, isManual);
}
