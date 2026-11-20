import '../core/constants.dart';
import '../models/enums.dart';
import '../models/impact_estimate.dart';
import '../models/recommendation.dart';
import '../models/user_profile.dart';
import 'impact_service.dart';

/// Pure Dart engine generating sustainable commute, cooking, and heating swaps.
class SwapService {
  /// Creates a [SwapService] backed by [impactService].
  const SwapService({ImpactService? impactService})
      : _impact = impactService ?? const ImpactService();

  final ImpactService _impact;

  /// Builds deterministically ranked sustainable swaps for [profile] and [band].
  List<Recommendation> build({
    required AqiBand band,
    required UserProfile profile,
  }) {
    final List<Recommendation> items = <Recommendation>[
      _commuteSwap(band, profile),
      _cookingSwap(profile),
      _heatingSwap(band),
      _wasteBurningSwap(band),
    ]..sort(_compare);
    return List<Recommendation>.unmodifiable(items);
  }

  Recommendation _rec(
    String id,
    ActionPriority p,
    String title,
    String detail,
    ImpactEstimate impact,
  ) => Recommendation(id: id, category: RecommendationCategory.swap, priority: p, title: title, actionDetail: detail, impact: impact);

  Recommendation _commuteSwap(AqiBand b, UserProfile p) {
    final bool high =
        b == AqiBand.poor || b == AqiBand.veryPoor || b == AqiBand.severe;
    final ({String id, ActionPriority pr, String title, String detail, double kg, String label}) spec =
        switch (p.commuteMode) {
      CommuteMode.carSolo => (
          id: 'swap_commute_car',
          pr: high ? ActionPriority.high : ActionPriority.medium,
          title: 'Shift two or more weekly car trips to metro, bus, or carpool',
          detail: 'Pair metro with an e-rickshaw last mile, or rotate driving with neighbours.',
          kg: AppConstants.carToTransitCo2KgPerDay,
          label: 'solo car to metro/bus',
        ),
      CommuteMode.twoWheeler => (
          id: 'swap_commute_twowheeler',
          pr: high ? ActionPriority.critical : ActionPriority.high,
          title: 'Swap open two-wheeler rides for metro or closed bus on smog days',
          detail: 'Two-wheeler riders sit in exhaust plumes. Switching to metro or AC bus cuts exposure and soot.',
          kg: AppConstants.twoWheelerToTransitCo2KgPerDay,
          label: 'two-wheeler to metro/bus',
        ),
      CommuteMode.carpool => (
          id: 'swap_commute_carpool',
          pr: ActionPriority.medium,
          title: 'Keep carpooling and use cabin air recirculation in traffic',
          detail: 'Set car AC to recirculate in heavy traffic and switch off engines at long red lights.',
          kg: AppConstants.carpoolCo2KgPerDay,
          label: '3-person carpool vs solo car',
        ),
      CommuteMode.walkOrCycle => (
          id: 'swap_commute_active',
          pr: high ? ActionPriority.high : ActionPriority.low,
          title: high ? 'Use enclosed transit or a fitted N95 on smoggy walks' : 'Keep zero-emission walking and cycling on side lanes',
          detail: high ? 'Wear a fitted N95 or take the bus above AQI 200.' : 'Choose tree-lined inner lanes away from diesel traffic.',
          kg: AppConstants.carToTransitCo2KgPerDay,
          label: 'zero-emission commute vs solo car',
        ),
      CommuteMode.metroOrBus || CommuteMode.workFromHome => (
          id: 'swap_commute_low_emission',
          pr: ActionPriority.low,
          title: 'Maintain your low-emission commute and combine errands',
          detail: 'Public transit and remote work keep vehicles off winter roads. Batch deliveries to avoid extra trips.',
          kg: AppConstants.carToTransitCo2KgPerDay,
          label: 'transit or remote work vs solo car',
        ),
    };
    return _rec(
      spec.id,
      spec.pr,
      spec.title,
      spec.detail,
      _impact.commuteSwapImpact(co2KgSavedPerDay: spec.kg, comparisonLabel: spec.label),
    );
  }

  Recommendation _cookingSwap(UserProfile p) {
    if (p.cookingFuel == CookingFuel.biomassOrWood) {
      return _rec(
        'swap_cooking_biomass',
        ActionPriority.critical,
        'Transition from wood or biomass to LPG, PNG, or induction',
        'Shifting daily tea and boiling to an electric kettle or induction plate cuts kitchen smoke immediately.',
        _impact.cleanFuelImpact(),
      );
    }
    final bool lpg = p.cookingFuel == CookingFuel.lpg;
    return _rec(
      lpg ? 'swap_cooking_lpg' : 'swap_cooking_clean',
      lpg ? ActionPriority.medium : ActionPriority.low,
      lpg ? 'Pair LPG with an electric kettle or induction for boiling' : 'Keep using clean cooking fuel with lids on pots',
      lpg ? 'Electric boiling reduces indoor NO2 and cylinder refills.' : 'Cover pans and run exhaust while frying.',
      _impact.generalHabitImpact(
        reason: 'Electric boiling emits zero indoor flames, and lids trap airborne cooking aerosols.',
        estimate: lpg ? 'Estimated 25% to 40% reduction in indoor cooking NO2 peaks.' : 'Estimated 15% to 25% lower cooking energy use.',
        assumptions: 'Rule-of-thumb indoor kitchen emission and energy estimate.',
      ),
    );
  }

  Recommendation _heatingSwap(AqiBand b) => _rec(
        'swap_heating',
        b == AqiBand.veryPoor || b == AqiBand.severe ? ActionPriority.high : ActionPriority.medium,
        'Use layers or an electric heater instead of open coal or wood fires',
        'Never burn wood or coal indoors or at guard posts. Share warm jackets or an electric heater with staff.',
        _impact.generalHabitImpact(
          reason: 'Open bonfires release heavy PM2.5 and carbon monoxide at breathing level during stagnant nights.',
          estimate: 'Estimated elimination of bonfire plumes that spike neighbourhood PM2.5 above 500 ug/m3.',
          assumptions: 'Based on winter neighbourhood air monitoring studies in Delhi NCR.',
        ),
      );

  Recommendation _wasteBurningSwap(AqiBand b) => _rec(
        'swap_waste_burning',
        b == AqiBand.severe || b == AqiBand.veryPoor ? ActionPriority.high : ActionPriority.medium,
        'Stop dry-leaf and garbage burning; compost in the colony',
        'Ask your RWA or gardener to place dry leaves into a wire-mesh compost pit instead of burning piles.',
        _impact.generalHabitImpact(
          reason: 'Burning trash and dry leaves releases dense black carbon into residential lanes.',
          estimate: 'Estimated avoidance of 8 to 15 grams of fine PM2.5 per kilogram kept unburned.',
          assumptions: 'Rule-of-thumb open biomass and municipal waste emission factor estimate.',
        ),
      );

  static int _compare(Recommendation a, Recommendation b) =>
      a.priority.index != b.priority.index
          ? a.priority.index.compareTo(b.priority.index)
          : a.id.compareTo(b.id);
}
