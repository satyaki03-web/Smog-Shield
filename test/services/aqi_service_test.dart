import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/aqi_service.dart';

void main() {
  late AqiService service;

  setUp(() {
    service = AqiService(now: () => DateTime(2026, 11, 20, 8));
  });

  group('AqiService band boundaries', () {
    test('maps Good boundary (0, 49, 50) and Satisfactory start (51)', () {
      expect(service.bandForAqi(0), AqiBand.good);
      expect(service.bandForAqi(49), AqiBand.good);
      expect(service.bandForAqi(50), AqiBand.good);
      expect(service.bandForAqi(51), AqiBand.satisfactory);
    });

    test('maps Satisfactory (99, 100) and Moderate (101, 199, 200)', () {
      expect(service.bandForAqi(99), AqiBand.satisfactory);
      expect(service.bandForAqi(100), AqiBand.satisfactory);
      expect(service.bandForAqi(101), AqiBand.moderate);
      expect(service.bandForAqi(199), AqiBand.moderate);
      expect(service.bandForAqi(200), AqiBand.moderate);
    });

    test('maps Poor (201, 299, 300) and Very Poor (301, 399, 400)', () {
      expect(service.bandForAqi(201), AqiBand.poor);
      expect(service.bandForAqi(299), AqiBand.poor);
      expect(service.bandForAqi(300), AqiBand.poor);
      expect(service.bandForAqi(301), AqiBand.veryPoor);
      expect(service.bandForAqi(399), AqiBand.veryPoor);
      expect(service.bandForAqi(400), AqiBand.veryPoor);
    });

    test('maps Severe boundary (401, 500, 999)', () {
      expect(service.bandForAqi(401), AqiBand.severe);
      expect(service.bandForAqi(500), AqiBand.severe);
      expect(service.bandForAqi(999), AqiBand.severe);
    });

    test('safely handles negative, NaN, infinity, and huge values', () {
      expect(service.normalizeAqi(-40), 0);
      expect(service.bandForAqi(-40), AqiBand.good);
      expect(service.normalizeAqi(double.nan), 0);
      expect(service.normalizeAqi(double.infinity), 0);
      expect(service.normalizeAqi(50000), 999);
      expect(service.bandForAqi(50000), AqiBand.severe);
    });
  });

  group('AqiService metadata and vulnerability multiplier', () {
    test('provides distinct advice and range label for every band', () {
      for (final AqiBand band in AqiBand.values) {
        final info = service.infoForBand(band);
        expect(info.band, band);
        expect(info.advice, isNotEmpty);
        expect(info.rangeLabel, isNotEmpty);
        expect(info.maskGuidance, isNotEmpty);
      }
    });

    test('increases vulnerability multiplier with children, elders, sensitivities and caps at 2.5', () {
      final UserProfile healthyAdult = UserProfile.defaults().copyWith(
        childrenUnder12: 0,
        eldersOver60: 0,
        sensitivities: const <Sensitivity>{},
      );
      final UserProfile vulnerableFamily = healthyAdult.copyWith(
        childrenUnder12: 2,
        eldersOver60: 1,
        sensitivities: const <Sensitivity>{
          Sensitivity.asthma,
          Sensitivity.heartCondition,
          Sensitivity.pregnancy,
        },
      );

      final double baseFactor =
          service.vulnerabilityMultiplier(healthyAdult, AqiBand.moderate);
      final double highFactor =
          service.vulnerabilityMultiplier(vulnerableFamily, AqiBand.severe);

      expect(baseFactor, 1.25);
      expect(highFactor, 2.5);
    });

    test('describes who is most at risk for both healthy and sensitive homes', () {
      final UserProfile healthy = UserProfile.defaults().copyWith(
        childrenUnder12: 0,
        eldersOver60: 0,
        sensitivities: const <Sensitivity>{},
      );
      final UserProfile asthmaticChild = healthy.copyWith(
        childrenUnder12: 1,
        sensitivities: const <Sensitivity>{Sensitivity.asthma},
      );

      expect(
        service.describeWhoIsAtRisk(healthy, AqiBand.good),
        contains('Healthy adults'),
      );
      expect(
        service.describeWhoIsAtRisk(healthy, AqiBand.severe),
        contains('Everyone'),
      );
      final String risk =
          service.describeWhoIsAtRisk(asthmaticChild, AqiBand.poor);
      expect(risk, contains('children under 12'));
      expect(risk, contains('asthma'));
    });
  });
}
