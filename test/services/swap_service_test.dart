import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/recommendation.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/swap_service.dart';

void main() {
  const SwapService service = SwapService();

  group('SwapService personas and bands', () {
    test('solo car commuter receives transit/carpool swap with CO2 estimate', () {
      final UserProfile carCommuter = UserProfile.defaults().copyWith(
        commuteMode: CommuteMode.carSolo,
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.poor,
        profile: carCommuter,
      );
      final Recommendation commute =
          items.firstWhere((Recommendation r) => r.id == 'swap_commute_car');
      expect(commute.priority, ActionPriority.high);
      expect(commute.impact.quantifiedEstimate, contains('2.4 kg'));
    });

    test('two-wheeler rider at Severe gets critical swap to enclosed transit', () {
      final UserProfile rider = UserProfile.defaults().copyWith(
        commuteMode: CommuteMode.twoWheeler,
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.severe,
        profile: rider,
      );
      final Recommendation commute = items.firstWhere(
        (Recommendation r) => r.id == 'swap_commute_twowheeler',
      );
      expect(commute.priority, ActionPriority.critical);
    });

    test('biomass cooking at Severe gets critical clean-fuel swap', () {
      final UserProfile biomass = UserProfile.defaults().copyWith(
        cookingFuel: CookingFuel.biomassOrWood,
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.severe,
        profile: biomass,
      );
      final Recommendation cooking = items.firstWhere(
        (Recommendation r) => r.id == 'swap_cooking_biomass',
      );
      expect(cooking.priority, ActionPriority.critical);
      expect(cooking.impact.quantifiedEstimate, contains('70%'));
    });

    test('covers carpool, active commute, induction, and deterministic ordering', () {
      for (final CommuteMode mode in CommuteMode.values) {
        final UserProfile p = UserProfile.defaults().copyWith(
          commuteMode: mode,
          cookingFuel: CookingFuel.induction,
        );
        final List<Recommendation> a = service.build(band: AqiBand.good, profile: p);
        final List<Recommendation> b = service.build(band: AqiBand.good, profile: p);
        expect(a, b);
        expect(a.map((Recommendation r) => r.id).toSet().length, a.length);
        expect(a.any((Recommendation r) => r.id == 'swap_waste_burning'), isTrue);
        expect(a.any((Recommendation r) => r.id == 'swap_heating'), isTrue);
      }
    });
  });
}
