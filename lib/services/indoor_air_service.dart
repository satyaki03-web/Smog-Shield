import '../core/formatters.dart';
import '../models/enums.dart';
import '../models/hourly_forecast.dart';
import '../models/recommendation.dart';
import '../models/user_profile.dart';
import 'impact_service.dart';

/// Pure Dart engine producing deterministically ranked indoor air actions.
class IndoorAirService {
  /// Creates an [IndoorAirService] backed by [impactService].
  const IndoorAirService({ImpactService? impactService})
      : _impact = impactService ?? const ImpactService();

  final ImpactService _impact;

  /// Builds ranked indoor air recommendations for [band], [profile], and [pm25].
  List<Recommendation> build({
    required AqiBand band,
    required UserProfile profile,
    required double pm25,
    required HourlyForecast forecast,
  }) {
    final List<Recommendation> items = <Recommendation>[
      _ventilationRecommendation(band, forecast),
      _purifierRecommendation(band, profile, pm25),
      _dampMoppingAndSealing(band, profile),
      _noIndoorBurningAndCooking(band, profile),
      _mythsVsFacts(),
    ];
    items.sort(_compareDeterministic);
    return List<Recommendation>.unmodifiable(items);
  }

  Recommendation _ventilationRecommendation(
    AqiBand band,
    HourlyForecast forecast,
  ) {
    final bool highSmog =
        band == AqiBand.poor || band == AqiBand.veryPoor || band == AqiBand.severe;
    final TimeWindow? clean = forecast.cleanestWindow;
    final String window = clean != null
        ? ' (${AppFormatters.formatWindow(clean.start, clean.end)})'
        : ' (mid-afternoon, typically 13:00 to 15:00)';
    return Recommendation(
      id: 'indoor_ventilation',
      category: RecommendationCategory.indoor,
      priority: highSmog ? ActionPriority.critical : ActionPriority.medium,
      title: highSmog
          ? 'Keep windows shut; air out briefly only in the cleanest window'
          : 'Cross-ventilate during the cleanest window',
      actionDetail: highSmog
          ? 'Keep exterior doors and windows closed during morning and night smog peaks. Open briefly for 15 minutes$window to clear indoor CO2.'
          : 'Open opposite windows for fresh cross-ventilation$window to flush indoor cooking fumes and dust.',
      impact: _impact.cleanerWindowImpact(
        worstAqi: forecast.worstWindow?.averageAqi ?? 0,
        cleanestAqi: clean?.averageAqi ?? 0,
      ),
    );
  }

  Recommendation _purifierRecommendation(
    AqiBand band,
    UserProfile profile,
    double pm25,
  ) {
    final bool highSmog =
        band == AqiBand.poor || band == AqiBand.veryPoor || band == AqiBand.severe;
    if (profile.ownsPurifier) {
      return Recommendation(
        id: 'indoor_purifier_care',
        category: RecommendationCategory.indoor,
        priority: highSmog ? ActionPriority.critical : ActionPriority.medium,
        title: 'Run HEPA purifier in the main bedroom with door closed',
        actionDetail:
            'Place the purifier away from curtains, run on medium-high 30 minutes before bedtime, and vacuum the outer mesh pre-filter weekly.',
        impact: _impact.purifierImpact(pm25, isDiy: false),
      );
    }
    final bool preferDiy = profile.budgetLevel == BudgetLevel.lowCost;
    return Recommendation(
      id: 'indoor_purifier_option',
      category: RecommendationCategory.indoor,
      priority: highSmog ? ActionPriority.high : ActionPriority.low,
      title: preferDiy
          ? 'Consider a low-cost DIY box-fan MERV-13 filter'
          : 'Prioritize one clean sleeping room with HEPA filtration',
      actionDetail: preferDiy
          ? 'Taping a MERV-13 filter tightly to a standard box fan creates a low-cost bedroom cleaner when commercial HEPA units are out of budget.'
          : 'One true-HEPA unit sized for the sleeping room gives 8 hours of cleaner overnight air for the whole family.',
      impact: _impact.purifierImpact(pm25, isDiy: preferDiy),
    );
  }

  Recommendation _dampMoppingAndSealing(AqiBand band, UserProfile profile) {
    final bool highSmog =
        band == AqiBand.poor || band == AqiBand.veryPoor || band == AqiBand.severe;
    final bool roadside = profile.homeType == HomeType.groundFloorRoadside;
    return Recommendation(
      id: 'indoor_seal_and_mop',
      category: RecommendationCategory.indoor,
      priority: (highSmog || roadside) ? ActionPriority.high : ActionPriority.medium,
      title: 'Damp-mop floors and seal door gaps',
      actionDetail:
          'Swap dry brooming for a damp mop so settled soot does not re-enter the air. Place rolled damp towels or weather-strip tape under exterior doors.',
      impact: _impact.generalHabitImpact(
        reason: 'Dry sweeping kicks settled PM10 and fine soot right back to breathing height, while door gaps leak roadside smog indoors.',
        estimate: 'Estimated low-cost reduction of indoor resuspended dust by 30% to 50% after cleaning.',
        assumptions: 'Rule-of-thumb estimate comparing damp mopping and basic draft sealing against dry sweeping.',
      ),
    );
  }

  Recommendation _noIndoorBurningAndCooking(AqiBand band, UserProfile profile) {
    final bool highRisk = profile.cookingFuel == CookingFuel.biomassOrWood ||
        band == AqiBand.veryPoor ||
        band == AqiBand.severe;
    return Recommendation(
      id: 'indoor_no_burning',
      category: RecommendationCategory.indoor,
      priority: highRisk ? ActionPriority.critical : ActionPriority.high,
      title: 'Stop indoor burning and vent kitchen smoke',
      actionDetail:
          'Avoid agarbatti, dhoop, mosquito coils, and candles indoors. Run the kitchen chimney or exhaust fan while frying or tempering tadka.',
      impact: _impact.cleanFuelImpact(),
    );
  }

  Recommendation _mythsVsFacts() {
    return Recommendation(
      id: 'indoor_myths_facts',
      category: RecommendationCategory.indoor,
      priority: ActionPriority.low,
      title: 'Myth vs fact: houseplants and steam do not clear PM2.5',
      actionDetail:
          'Indoor plants add comfort, and steam may soothe a dry throat, but neither removes fine PM2.5 meaningfully. Rely on sealing, exhaust, and mechanical filtration.',
      impact: _impact.generalHabitImpact(
        reason: 'Knowing what actually filters PM2.5 stops families from spending limited budgets on ineffective fixes.',
        estimate: 'Estimated zero PM2.5 removal from typical potted houseplants at household air-exchange rates.',
        assumptions: 'Based on peer-reviewed chamber studies showing hundreds of plants per square metre would be required.',
      ),
    );
  }

  static int _compareDeterministic(Recommendation a, Recommendation b) {
    final int byPriority = a.priority.index.compareTo(b.priority.index);
    return byPriority != 0 ? byPriority : a.id.compareTo(b.id);
  }
}
