import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/air_context.dart';
import 'package:smog_shield/models/air_reading.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/aqi_service.dart';
import 'package:smog_shield/services/fallback_ai_service.dart';
import 'package:smog_shield/services/forecast_service.dart';
import 'package:smog_shield/services/indoor_air_service.dart';
import 'package:smog_shield/services/plan_builder.dart';
import 'package:smog_shield/services/plan_exporter.dart';
import 'package:smog_shield/services/routine_service.dart';
import 'package:smog_shield/services/storage_service.dart';
import 'package:smog_shield/services/swap_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('PlanExporter', () {
    test('exports Markdown containing AQI, sections, and medical disclaimer', () async {
      final PlanBuilder builder = PlanBuilder(
        aqiService: AqiService(),
        forecastService: ForecastService(),
        routineService: const RoutineService(),
        indoorAirService: const IndoorAirService(),
        swapService: const SwapService(),
      );
      final AirContext ctx = builder.build(
        profile: UserProfile.defaults(),
        reading: AirReading(
          aqi: 350,
          pm25: 190,
          pm10: 270,
          observedAt: DateTime(2026, 11, 20, 8),
          cityName: 'Noida',
        ),
        forecastPoints: const [],
      );
      final narrative = (await FallbackAiService().personalizePlan(ctx)).valueOrNull;
      final String md = PlanExporter.toMarkdown(ctx, narrative: narrative);

      expect(md, contains('# Smog Shield Daily Plan: Noida'));
      expect(md, contains('350 (Very Poor)'));
      expect(md, contains('## Routine'));
      expect(md, contains('## Indoor Air'));
      expect(md, contains('## Swaps'));
      expect(md, contains('not medical advice'));
    });

    test('communityChecklistForBand adds stricter RWA and school steps on high bands', () {
      final List<ChecklistItem> goodList =
          PlanExporter.communityChecklistForBand(AqiBand.good);
      final List<ChecklistItem> severeList =
          PlanExporter.communityChecklistForBand(AqiBand.severe);
      expect(severeList.length, greaterThan(goodList.length));
      expect(
        severeList.any((ChecklistItem i) => i.id == 'comm_school_mask_stock'),
        isTrue,
      );
    });
  });

  group('SharedPreferencesStorageService', () {
    test('persists, reloads, and clears profile, checklist, and theme mode', () async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final SharedPreferencesStorageService storage =
          SharedPreferencesStorageService(prefs);

      expect((await storage.loadProfile()).valueOrNull, isNull);
      final UserProfile custom = UserProfile.defaults().copyWith(
        cityName: 'Gurugram',
        adults: 3,
        sensitivities: const <Sensitivity>{Sensitivity.asthma},
        ownsPurifier: true,
        manualAqi: 240,
      );

      await storage.saveProfile(custom);
      await storage.saveChecklistIds(<String>{'comm_no_leaf_burning'});
      await storage.saveThemeMode(AppThemeMode.highContrast);

      expect((await storage.loadProfile()).valueOrNull, custom);
      expect(
        (await storage.loadChecklistIds()).valueOrNull,
        <String>{'comm_no_leaf_burning'},
      );
      expect(
        (await storage.loadThemeMode()).valueOrNull,
        AppThemeMode.highContrast,
      );

      await storage.clearAll();
      expect((await storage.loadProfile()).valueOrNull, isNull);
      expect((await storage.loadChecklistIds()).valueOrNull, isEmpty);
      expect((await storage.loadThemeMode()).valueOrNull, AppThemeMode.light);
    });
  });
}
