import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/config.dart';
import 'services/aqi_service.dart';
import 'services/fallback_ai_service.dart';
import 'services/forecast_service.dart';
import 'services/gemini_ai_service.dart';
import 'services/impact_service.dart';
import 'services/indoor_air_service.dart';
import 'services/open_meteo_air_quality_repository.dart';
import 'services/plan_builder.dart';
import 'services/resilient_ai_service.dart';
import 'services/routine_service.dart';
import 'services/storage_service.dart';
import 'services/swap_service.dart';
import 'state/air_controller.dart';
import 'state/chat_controller.dart';
import 'state/checklist_controller.dart';
import 'state/plan_controller.dart';
import 'state/profile_controller.dart';

/// Application entry point wiring real services and controllers.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final AppConfig config = AppConfig.fromEnvironment();
  final http.Client httpClient = http.Client();

  final StorageService storage = SharedPreferencesStorageService(prefs);
  final OpenMeteoAirQualityRepository airRepo =
      OpenMeteoAirQualityRepository(client: httpClient);
  final FallbackAiService fallbackAi = FallbackAiService();
  final ResilientAiService aiService = ResilientAiService(
    primary: GeminiAiService(client: httpClient, config: config),
    fallback: fallbackAi,
  );
  const ImpactService impactService = ImpactService();
  final PlanBuilder planBuilder = PlanBuilder(
    aqiService: AqiService(),
    forecastService: ForecastService(),
    routineService: const RoutineService(impactService: impactService),
    indoorAirService: const IndoorAirService(impactService: impactService),
    swapService: const SwapService(impactService: impactService),
  );

  final ProfileController profileCtrl = ProfileController(storage: storage);
  final ChecklistController checklistCtrl =
      ChecklistController(storage: storage);
  await profileCtrl.load();
  await checklistCtrl.load();

  runApp(
    SmogShieldApp(
      profileController: profileCtrl,
      airController: AirController(repository: airRepo),
      planController: PlanController(
        planBuilder: planBuilder,
        aiService: aiService,
        fallbackService: fallbackAi,
      ),
      chatController: ChatController(aiService: aiService),
      checklistController: checklistCtrl,
    ),
  );
}
