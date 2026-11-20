import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/hourly_forecast.dart';
import 'package:smog_shield/models/recommendation.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/indoor_air_service.dart';

void main() {
  const IndoorAirService service = IndoorAirService();

  group('IndoorAirService personas and bands', () {
    test('purifier owner at Severe receives HEPA care and closed-window ventilation', () {
      final UserProfile owner = UserProfile.defaults().copyWith(
        ownsPurifier: true,
        cookingFuel: CookingFuel.biomassOrWood,
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.severe,
        profile: owner,
        pm25: 260,
        forecast: HourlyForecast.empty,
      );

      expect(items.map((Recommendation r) => r.id).toSet().length, items.length);
      expect(
        items.any((Recommendation r) => r.id == 'indoor_purifier_care'),
        isTrue,
      );
      expect(
        items.any((Recommendation r) => r.title.contains('Keep windows shut')),
        isTrue,
      );
      expect(
        items.any((Recommendation r) => r.id == 'indoor_myths_facts'),
        isTrue,
      );
    });

    test('low-budget non-owner receives DIY box-fan MERV-13 option', () {
      final UserProfile lowBudget = UserProfile.defaults().copyWith(
        ownsPurifier: false,
        budgetLevel: BudgetLevel.lowCost,
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.poor,
        profile: lowBudget,
        pm25: 150,
        forecast: HourlyForecast.empty,
      );

      final Recommendation purifier = items.firstWhere(
        (Recommendation r) => r.id == 'indoor_purifier_option',
      );
      expect(purifier.title, contains('DIY'));
      expect(purifier.impact.quantifiedEstimate, contains('45%'));
    });

    test('healthy adult at Good gets cross-ventilation rather than shut-windows', () {
      final UserProfile healthy = UserProfile.defaults().copyWith(
        ownsPurifier: false,
        budgetLevel: BudgetLevel.flexible,
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.good,
        profile: healthy,
        pm25: 18,
        forecast: HourlyForecast.empty,
      );
      final Recommendation vent = items.firstWhere(
        (Recommendation r) => r.id == 'indoor_ventilation',
      );
      expect(vent.title, contains('Cross-ventilate'));
      expect(vent.title, isNot(contains('Keep windows shut')));
    });

    test('roadside ground-floor home elevates sealing and damp-mopping priority', () {
      final UserProfile roadside = UserProfile.defaults().copyWith(
        homeType: HomeType.groundFloorRoadside,
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.moderate,
        profile: roadside,
        pm25: 60,
        forecast: HourlyForecast.empty,
      );
      final Recommendation seal = items.firstWhere(
        (Recommendation r) => r.id == 'indoor_seal_and_mop',
      );
      expect(seal.priority, ActionPriority.high);
    });
  });
}
