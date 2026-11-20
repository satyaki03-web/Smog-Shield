import '../models/air_context.dart';
import '../models/air_reading.dart';
import '../models/aqi_band_info.dart';
import '../models/enums.dart';
import '../models/hourly_forecast.dart';
import '../models/recommendation.dart';
import '../models/user_profile.dart';
import 'aqi_service.dart';
import 'forecast_service.dart';
import 'indoor_air_service.dart';
import 'routine_service.dart';
import 'swap_service.dart';

/// Pure Dart orchestrator building a deterministic [AirContext].
class PlanBuilder {
  /// Creates a [PlanBuilder] with injected deterministic rule services.
  const PlanBuilder({
    required AqiService aqiService,
    required ForecastService forecastService,
    required RoutineService routineService,
    required IndoorAirService indoorAirService,
    required SwapService swapService,
  })  : _aqiService = aqiService,
        _forecastService = forecastService,
        _routineService = routineService,
        _indoorAirService = indoorAirService,
        _swapService = swapService;

  final AqiService _aqiService;
  final ForecastService _forecastService;
  final RoutineService _routineService;
  final IndoorAirService _indoorAirService;
  final SwapService _swapService;

  /// Builds a complete, deterministically sorted [AirContext].
  AirContext build({
    required UserProfile profile,
    required AirReading reading,
    required List<HourlyPoint> forecastPoints,
  }) {
    final int safeAqi = _aqiService.normalizeAqi(reading.aqi);
    final AirReading safeReading = reading.copyWith(aqi: safeAqi);
    final AqiBand band = _aqiService.bandForAqi(safeAqi);
    final AqiBandInfo bandInfo = _aqiService.infoForBand(band);
    final HourlyForecast forecast = _forecastService.analyze(forecastPoints);
    final double multiplier = _aqiService.vulnerabilityMultiplier(profile, band);
    final String riskText = _aqiService.describeWhoIsAtRisk(profile, band);

    final List<Recommendation> all = <Recommendation>[
      ..._routineService.build(
        band: band,
        profile: profile,
        pm25: safeReading.pm25,
        forecast: forecast,
      ),
      ..._indoorAirService.build(
        band: band,
        profile: profile,
        pm25: safeReading.pm25,
        forecast: forecast,
      ),
      ..._swapService.build(band: band, profile: profile),
    ];

    all.sort(_compareDeterministic);

    return AirContext(
      profile: profile,
      reading: safeReading,
      bandInfo: bandInfo,
      forecast: forecast,
      vulnerabilityMultiplier: multiplier,
      whoIsAtRisk: riskText,
      recommendations: List<Recommendation>.unmodifiable(all),
    );
  }

  static int _compareDeterministic(Recommendation a, Recommendation b) {
    final int byPriority = a.priority.index.compareTo(b.priority.index);
    return byPriority != 0 ? byPriority : a.id.compareTo(b.id);
  }
}
