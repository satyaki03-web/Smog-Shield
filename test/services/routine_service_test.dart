import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/hourly_forecast.dart';
import 'package:smog_shield/models/recommendation.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/routine_service.dart';

void main() {
  const RoutineService service = RoutineService();

  final HourlyForecast sampleForecast = HourlyForecast(
    points: const <HourlyPoint>[],
    cleanestWindow: TimeWindow(
      start: DateTime(2026, 11, 20, 14),
      end: DateTime(2026, 11, 20, 16),
      averageAqi: 180,
    ),
    worstWindow: TimeWindow(
      start: DateTime(2026, 11, 20, 6),
      end: DateTime(2026, 11, 20, 8),
      averageAqi: 380,
    ),
  );

  group('RoutineService personas and bands', () {
    test('asthmatic child at Severe prioritizes mask, indoor workout, and school play', () {
      final UserProfile profile = UserProfile.defaults().copyWith(
        childrenUnder12: 1,
        sensitivities: const <Sensitivity>{Sensitivity.asthma},
        cookingFuel: CookingFuel.biomassOrWood,
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.severe,
        profile: profile,
        pm25: 290,
        forecast: sampleForecast,
      );

      expect(items.map((Recommendation r) => r.id).toSet().length, items.length);
      expect(items.first.priority, ActionPriority.critical);
      expect(
        items.any((Recommendation r) => r.id == 'routine_school_play'),
        isTrue,
      );
      expect(
        items.any((Recommendation r) => r.title.contains('Move workouts indoors')),
        isTrue,
      );
      expect(
        items.any((Recommendation r) => r.title.contains('No pollution mask')),
        isFalse,
      );
    });

    test('healthy adult at Good never advises moving workouts indoors', () {
      final UserProfile profile = UserProfile.defaults().copyWith(
        childrenUnder12: 0,
        eldersOver60: 0,
        sensitivities: const <Sensitivity>{},
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.good,
        profile: profile,
        pm25: 15,
        forecast: HourlyForecast.empty,
      );

      expect(
        items.any((Recommendation r) => r.title.contains('Move workouts indoors')),
        isFalse,
      );
      expect(
        items.any((Recommendation r) => r.id == 'routine_school_play'),
        isFalse,
      );
    });

    test('elder at Poor includes rescue check-in and high-priority mask', () {
      final UserProfile profile = UserProfile.defaults().copyWith(
        childrenUnder12: 0,
        eldersOver60: 2,
      );
      final List<Recommendation> items = service.build(
        band: AqiBand.poor,
        profile: profile,
        pm25: 160,
        forecast: sampleForecast,
      );

      expect(
        items.any((Recommendation r) => r.id == 'routine_vulnerable_checkin'),
        isTrue,
      );
      final Recommendation mask =
          items.firstWhere((Recommendation r) => r.id == 'routine_mask');
      expect(mask.priority, ActionPriority.high);
    });

    test('output ordering is deterministic across repeated calls for every band', () {
      final UserProfile profile = UserProfile.defaults();
      for (final AqiBand band in AqiBand.values) {
        final List<Recommendation> a = service.build(
          band: band,
          profile: profile,
          pm25: 100,
          forecast: sampleForecast,
        );
        final List<Recommendation> b = service.build(
          band: band,
          profile: profile,
          pm25: 100,
          forecast: sampleForecast,
        );
        expect(a, b);
      }
    });
  });
}
