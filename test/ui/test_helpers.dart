import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smog_shield/app.dart';
import 'package:smog_shield/core/cities.dart';
import 'package:smog_shield/core/result.dart';
import 'package:smog_shield/models/air_reading.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/hourly_forecast.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/air_quality_repository.dart';
import 'package:smog_shield/services/aqi_service.dart';
import 'package:smog_shield/services/fallback_ai_service.dart';
import 'package:smog_shield/services/forecast_service.dart';
import 'package:smog_shield/services/indoor_air_service.dart';
import 'package:smog_shield/services/plan_builder.dart';
import 'package:smog_shield/services/routine_service.dart';
import 'package:smog_shield/services/storage_service.dart';
import 'package:smog_shield/services/swap_service.dart';
import 'package:smog_shield/state/air_controller.dart';
import 'package:smog_shield/state/chat_controller.dart';
import 'package:smog_shield/state/checklist_controller.dart';
import 'package:smog_shield/state/plan_controller.dart';
import 'package:smog_shield/state/profile_controller.dart';

/// In-memory [StorageService] for deterministic widget tests.
class FakeStorageService implements StorageService {
  /// Creates a [FakeStorageService].
  FakeStorageService({this.savedProfile, this.savedTheme = AppThemeMode.light});

  /// Stored profile returned by [loadProfile].
  UserProfile? savedProfile;

  /// Stored theme mode returned by [loadThemeMode].
  AppThemeMode savedTheme;

  /// Stored completed checklist item IDs.
  Set<String> savedChecklist = <String>{};

  @override
  Future<Result<UserProfile?>> loadProfile() async => Success<UserProfile?>(savedProfile);
  @override
  Future<Result<void>> saveProfile(UserProfile p) async {
    savedProfile = p;
    return const Success<void>(null);
  }
  @override
  Future<Result<Set<String>>> loadChecklistIds() async => Success<Set<String>>(savedChecklist);
  @override
  Future<Result<void>> saveChecklistIds(Set<String> ids) async {
    savedChecklist = Set<String>.from(ids);
    return const Success<void>(null);
  }
  @override
  Future<Result<AppThemeMode>> loadThemeMode() async => Success<AppThemeMode>(savedTheme);
  @override
  Future<Result<void>> saveThemeMode(AppThemeMode m) async {
    savedTheme = m;
    return const Success<void>(null);
  }
  @override
  Future<Result<void>> clearAll() async {
    savedProfile = null;
    savedChecklist.clear();
    savedTheme = AppThemeMode.light;
    return const Success<void>(null);
  }
}

/// Deterministic offline [AirQualityRepository] for widget tests.
class FakeAirQualityRepository implements AirQualityRepository {
  /// Creates a [FakeAirQualityRepository].
  FakeAirQualityRepository({this.resultOverride});

  /// Optional forced result for testing error banners.
  Result<AirSnapshot>? resultOverride;

  @override
  Future<Result<AirSnapshot>> fetchAirQuality(
    CityOption city, {
    bool forceRefresh = false,
  }) async {
    if (resultOverride != null) {
      return resultOverride!;
    }
    final DateTime base = DateTime(2026, 11, 20, 6);
    final List<HourlyPoint> pts = List<HourlyPoint>.generate(
      24,
      (int i) => HourlyPoint(
        time: base.add(Duration(hours: i)),
        aqi: i >= 8 && i <= 10 ? 190 : 340,
        pm25: i >= 8 && i <= 10 ? 95.0 : 190.0,
      ),
    );
    return Success<AirSnapshot>(
      AirSnapshot(
        reading: AirReading(aqi: 340, pm25: 190, pm10: 270, observedAt: base, cityName: city.name),
        hourlyPoints: pts,
      ),
    );
  }
}

/// Builds a fully wired [SmogShieldApp] using offline fake services.
Future<Widget> buildTestApp({
  UserProfile? initialProfile,
  AppThemeMode themeMode = AppThemeMode.light,
  Result<AirSnapshot>? airResult,
}) async {
  GoogleFonts.config.allowRuntimeFetching = false;
  final DateTime t0 = DateTime(2026, 11, 20, 8);
  final FakeStorageService store = FakeStorageService(savedProfile: initialProfile, savedTheme: themeMode);
  final ProfileController profile = ProfileController(storage: store);
  final ChecklistController checklist = ChecklistController(storage: store);
  await profile.load();
  await checklist.load();
  final FallbackAiService ai = FallbackAiService(now: () => t0);
  final AirController air = AirController(repository: FakeAirQualityRepository(resultOverride: airResult), now: () => t0);
  final PlanController plan = PlanController(
    planBuilder: PlanBuilder(
      aqiService: AqiService(now: () => t0),
      forecastService: ForecastService(now: () => t0),
      routineService: const RoutineService(),
      indoorAirService: const IndoorAirService(),
      swapService: const SwapService(),
    ),
    aiService: ai,
    fallbackService: ai,
  );
  if (initialProfile != null) {
    await air.loadForProfile(initialProfile);
    if (air.reading != null) {
      await plan.rebuildDeterministic(profile: initialProfile, reading: air.reading!, hourlyPoints: air.hourlyPoints);
    }
  }
  return SmogShieldApp(
    profileController: profile,
    airController: air,
    planController: plan,
    chatController: ChatController(aiService: ai),
    checklistController: checklist,
  );
}
