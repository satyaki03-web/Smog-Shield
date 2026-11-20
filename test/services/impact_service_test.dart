import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/impact_estimate.dart';
import 'package:smog_shield/services/impact_service.dart';

void main() {
  const ImpactService service = ImpactService();

  group('ImpactService', () {
    test('computes cigarette equivalents accurately for zero, normal, and NaN', () {
      expect(service.cigaretteEquivalents(0), 0.0);
      expect(service.cigaretteEquivalents(-10), 0.0);
      expect(service.cigaretteEquivalents(double.nan), 0.0);
      expect(service.cigaretteEquivalents(22.0), closeTo(1.0, 0.001));
      expect(service.cigaretteEquivalents(220.0), closeTo(10.0, 0.001));
    });

    test('n95MaskImpact includes estimate wording and assumptions', () {
      final ImpactEstimate impact = service.n95MaskImpact(220.0);
      expect(impact.quantifiedEstimate, contains('Estimated'));
      expect(impact.quantifiedEstimate, contains('85%'));
      expect(impact.quantifiedEstimate, contains('8.5'));
      expect(impact.assumptionsNote, contains('22 ug/m3'));
      expect(impact.assumptionsNote, contains('Not a medical claim'));
    });

    test('cleanerWindowImpact handles positive drop and zero drop', () {
      final ImpactEstimate drop =
          service.cleanerWindowImpact(worstAqi: 360, cleanestAqi: 210);
      expect(drop.quantifiedEstimate, contains('150'));
      expect(drop.assumptionsNote, isNotEmpty);

      final ImpactEstimate flat =
          service.cleanerWindowImpact(worstAqi: 150, cleanestAqi: 180);
      expect(flat.quantifiedEstimate, contains('steady'));
    });

    test('purifierImpact differentiates HEPA (60%) and DIY MERV-13 (45%)', () {
      final ImpactEstimate hepa = service.purifierImpact(200.0, isDiy: false);
      final ImpactEstimate diy = service.purifierImpact(200.0, isDiy: true);
      expect(hepa.quantifiedEstimate, contains('60%'));
      expect(hepa.quantifiedEstimate, contains('120.0'));
      expect(diy.quantifiedEstimate, contains('45%'));
      expect(diy.quantifiedEstimate, contains('90.0'));
      expect(hepa.assumptionsNote, isNotEmpty);
      expect(diy.assumptionsNote, isNotEmpty);
    });

    test('commuteSwapImpact computes monthly CO2 and handles negative inputs', () {
      final ImpactEstimate carSwap = service.commuteSwapImpact(
        co2KgSavedPerDay: 2.4,
        comparisonLabel: 'solo car to metro',
      );
      expect(carSwap.quantifiedEstimate, contains('2.4 kg'));
      expect(carSwap.quantifiedEstimate, contains('52.8 kg'));
      expect(carSwap.assumptionsNote, contains('15 km'));

      final ImpactEstimate zero = service.commuteSwapImpact(
        co2KgSavedPerDay: -5.0,
        comparisonLabel: 'zero',
      );
      expect(zero.quantifiedEstimate, contains('0.0 kg'));
    });

    test('cleanFuelImpact includes 70% estimate and assumptions', () {
      final ImpactEstimate fuel = service.cleanFuelImpact();
      expect(fuel.quantifiedEstimate, contains('70%'));
      expect(fuel.assumptionsNote, isNotEmpty);
    });
  });
}
