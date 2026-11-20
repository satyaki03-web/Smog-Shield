/// Immutable metadata for a supported Indian city.
class CityOption {
  /// Creates a [CityOption] with geographic coordinates.
  const CityOption({
    required this.name,
    required this.state,
    required this.latitude,
    required this.longitude,
  });

  /// Display name of the city.
  final String name;

  /// State or union territory name.
  final String state;

  /// Geographic latitude in decimal degrees.
  final double latitude;

  /// Geographic longitude in decimal degrees.
  final double longitude;

  /// Formatted label combining city and state.
  String get displayLabel => '$name, $state';

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is CityOption &&
            name == other.name &&
            state == other.state &&
            latitude == other.latitude &&
            longitude == other.longitude;
  }

  @override
  int get hashCode => Object.hash(name, state, latitude, longitude);
}

/// Curated list of Indian cities focused on Delhi NCR and northern plains.
class AppCities {
  const AppCities._();

  /// Default city used for first-time setup.
  static const String defaultCityName = 'Delhi';

  /// Fifteen supported cities with coordinates for Open-Meteo lookups.
  static const List<CityOption> list = <CityOption>[
    CityOption(name: 'Delhi', state: 'NCT', latitude: 28.6139, longitude: 77.2090),
    CityOption(name: 'Gurugram', state: 'Haryana', latitude: 28.4595, longitude: 77.0266),
    CityOption(name: 'Noida', state: 'Uttar Pradesh', latitude: 28.5355, longitude: 77.3910),
    CityOption(name: 'Faridabad', state: 'Haryana', latitude: 28.4089, longitude: 77.3178),
    CityOption(name: 'Ghaziabad', state: 'Uttar Pradesh', latitude: 28.6692, longitude: 77.4538),
    CityOption(name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462),
    CityOption(name: 'Kanpur', state: 'Uttar Pradesh', latitude: 26.4499, longitude: 80.3319),
    CityOption(name: 'Patna', state: 'Bihar', latitude: 25.5941, longitude: 85.1376),
    CityOption(name: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739),
    CityOption(name: 'Chandigarh', state: 'Chandigarh', latitude: 30.7333, longitude: 76.7794),
    CityOption(name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873),
    CityOption(name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639),
    CityOption(name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777),
    CityOption(name: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946),
    CityOption(name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707),
  ];

  /// Looks up a [CityOption] by exact [cityName], or returns null if absent.
  static CityOption? findByName(String cityName) {
    for (final CityOption city in list) {
      if (city.name == cityName) {
        return city;
      }
    }
    return null;
  }

  /// Returns the [CityOption] for [cityName], falling back to Delhi.
  static CityOption byNameOrDefault(String cityName) {
    return findByName(cityName) ?? list.first;
  }
}
