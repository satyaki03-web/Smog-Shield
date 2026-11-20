import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/hourly_forecast.dart';
import 'package:smog_shield/models/recommendation.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/indoor_air_service.dart';
import 'package:smog_shield/services/routine_service.dart';
import 'package:smog_shield/services/swap_service.dart';

void main() {
  const RoutineService routine = RoutineService();
  const IndoorAirService indoor = IndoorAirService();
  const SwapService swap = SwapService();

  final Map<String, UserProfile> personas = <String, UserProfile>{
    'asthmatic_child_biomass': UserProfile.defaults().copyWith(
      childrenUnder12: 1,
      sensitivities: const <Sensitivity>{Sensitivity.asthma},
      cookingFuel: CookingFuel.biomassOrWood,
      commuteMode: CommuteMode.twoWheeler,
      ownsPurifier: false,
      budgetLevel: BudgetLevel.lowCost,
    ),
    'healthy_adult_good': UserProfile.defaults().copyWith(
      childrenUnder12: 0,
      eldersOver60: 0,
      sensitivities: const <Sensitivity>{},
      commuteMode: CommuteMode.walkOrCycle,
      cookingFuel: CookingFuel.induction,
    ),
    'elder_poor_roadside': UserProfile.defaults().copyWith(
      childrenUnder12: 0,
      eldersOver60: 2,
      sensitivities: const <Sensitivity>{Sensitivity.heartCondition},
      homeType: HomeType.groundFloorRoadside,
      commuteMode: CommuteMode.carpool,
      cookingFuel: CookingFuel.png,
    ),
    'car_commuter_purifier_owner': UserProfile.defaults().copyWith(
      commuteMode: CommuteMode.carSolo,
      ownsPurifier: true,
      budgetLevel: BudgetLevel.flexible,
      cookingFuel: CookingFuel.lpg,
    ),
    'wfh_pregnancy': UserProfile.defaults().copyWith(
      childrenUnder12: 0,
      sensitivities: const <Sensitivity>{Sensitivity.pregnancy},
      commuteMode: CommuteMode.workFromHome,
      budgetLevel: BudgetLevel.moderate,
    ),
  };

  for (final MapEntry<String, UserProfile> persona in personas.entries) {
    for (final AqiBand band in AqiBand.values) {
      test('matrix ${persona.key} at ${band.name}: unique IDs, valid impacts, no contradictions', () {
        final List<Recommendation> rItems = routine.build(
          band: band,
          profile: persona.value,
          pm25: 120,
          forecast: HourlyForecast.empty,
        );
        final List<Recommendation> iItems = indoor.build(
          band: band,
          profile: persona.value,
          pm25: 120,
          forecast: HourlyForecast.empty,
        );
        final List<Recommendation> sItems = swap.build(
          band: band,
          profile: persona.value,
        );
        final List<Recommendation> all = <Recommendation>[
          ...rItems,
          ...iItems,
          ...sItems,
        ];

        expect(all.map((Recommendation r) => r.id).toSet().length, all.length);
        for (final Recommendation item in all) {
          expect(item.title, isNotEmpty);
          expect(item.actionDetail, isNotEmpty);
          expect(item.impact.reason, isNotEmpty);
          expect(item.impact.quantifiedEstimate, isNotEmpty);
          expect(item.impact.assumptionsNote, isNotEmpty);
        }
        if (band == AqiBand.severe) {
          expect(
            iItems.any((Recommendation r) => r.title.contains('Cross-ventilate')),
            isFalse,
          );
        }
      });
    }
  }
}
