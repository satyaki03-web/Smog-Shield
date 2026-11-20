/// Application-wide numeric thresholds, limits, and calculation constants.
class AppConstants {
  const AppConstants._();

  /// Upper AQI boundary for the CPCB Good band (0 to 50).
  static const int aqiGoodMax = 50;

  /// Upper AQI boundary for the CPCB Satisfactory band (51 to 100).
  static const int aqiSatisfactoryMax = 100;

  /// Upper AQI boundary for the CPCB Moderate band (101 to 200).
  static const int aqiModerateMax = 200;

  /// Upper AQI boundary for the CPCB Poor band (201 to 300).
  static const int aqiPoorMax = 300;

  /// Upper AQI boundary for the CPCB Very Poor band (301 to 400).
  static const int aqiVeryPoorMax = 400;

  /// Minimum valid AQI value.
  static const int aqiMin = 0;

  /// Maximum accepted AQI value for input and display clamping.
  static const int aqiMax = 999;

  /// Maximum physically plausible PM2.5 reading in ug/m3.
  static const double maxPm25 = 1500.0;

  /// Maximum physically plausible PM10 reading in ug/m3.
  static const double maxPm10 = 3000.0;

  /// Berkeley Earth rule of thumb: ~22 ug/m3 PM2.5 per day equals 1 cigarette.
  static const double pm25PerCigaretteDaily = 22.0;

  /// Conservative fitted N95 filtration efficiency for PM2.5 particles (85%).
  static const double n95FiltrationFraction = 0.85;

  /// Typical closed-room HEPA air purifier PM2.5 reduction estimate (60%).
  static const double purifierReductionFraction = 0.60;

  /// Typical DIY box-fan MERV-13 filter PM2.5 reduction estimate (45%).
  static const double diyPurifierReductionFraction = 0.45;

  /// Estimated indoor PM2.5 reduction when replacing biomass with clean fuel.
  static const double cleanCookingReductionFraction = 0.70;

  /// Estimated daily CO2 saved in kg switching a 15 km solo car trip to metro.
  static const double carToTransitCo2KgPerDay = 2.4;

  /// Estimated daily CO2 saved in kg switching a 15 km two-wheeler to metro.
  static const double twoWheelerToTransitCo2KgPerDay = 1.0;

  /// Estimated daily CO2 saved in kg when carpooling with three riders.
  static const double carpoolCo2KgPerDay = 1.6;

  /// Hours in each forecast window evaluated for cleanest and worst periods.
  static const int forecastWindowHours = 2;

  /// Maximum hourly forecast points considered for 24-hour planning.
  static const int forecastHorizonHours = 24;

  /// Network timeout for Open-Meteo air quality requests.
  static const Duration airApiTimeout = Duration(seconds: 10);

  /// In-memory cache TTL for air quality API responses.
  static const Duration airCacheTtl = Duration(minutes: 10);

  /// Network timeout for Gemini AI requests.
  static const Duration aiApiTimeout = Duration(seconds: 30);

  /// Maximum response payload size in bytes accepted from remote APIs.
  static const int maxResponseBytes = 65536;

  /// Maximum output tokens requested from Gemini.
  static const int aiMaxOutputTokens = 700;

  /// Maximum personalized item notes accepted in a Gemini JSON response.
  static const int aiMaxPersonalizedItems = 12;

  /// Maximum cached AI responses held in memory.
  static const int aiCacheCapacity = 20;

  /// Minimum cooldown between consecutive user-initiated AI requests.
  static const Duration aiCooldown = Duration(seconds: 4);

  /// Sliding window for AI client-side rate limiting.
  static const Duration aiRateWindow = Duration(minutes: 1);

  /// Maximum AI requests permitted within [aiRateWindow].
  static const int aiMaxRequestsPerWindow = 6;

  /// Maximum character length for a user question in Ask.
  static const int maxChatQuestionLength = 500;

  /// Maximum chat messages retained in session history.
  static const int maxChatHistory = 10;

  /// Maximum adults allowed in a household profile.
  static const int maxHouseholdAdults = 20;

  /// Maximum children or elders allowed in a household profile.
  static const int maxHouseholdDependents = 20;

  /// Maximum combined household size.
  static const int maxTotalHousehold = 30;

  /// Minimum household adults required.
  static const int minHouseholdAdults = 1;

  /// Vulnerability multiplier increment for children under 12.
  static const double childRiskIncrement = 0.25;

  /// Vulnerability multiplier increment for adults over 60.
  static const double elderRiskIncrement = 0.25;

  /// Vulnerability multiplier increment per sensitive health condition.
  static const double sensitivityRiskIncrement = 0.20;

  /// Maximum combined vulnerability multiplier cap.
  static const double maxVulnerabilityMultiplier = 2.5;
}
