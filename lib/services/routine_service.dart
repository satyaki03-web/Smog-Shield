import '../core/formatters.dart';
import '../models/enums.dart';
import '../models/hourly_forecast.dart';
import '../models/impact_estimate.dart';
import '../models/recommendation.dart';
import '../models/user_profile.dart';
import 'impact_service.dart';

/// Pure Dart engine producing deterministically ranked daily routine actions.
class RoutineService {
  /// Creates a [RoutineService] backed by [impactService].
  const RoutineService({ImpactService? impactService})
      : _impact = impactService ?? const ImpactService();

  final ImpactService _impact;

  /// Builds ranked routine recommendations for [band], [profile], and [forecast].
  List<Recommendation> build({
    required AqiBand band,
    required UserProfile profile,
    required double pm25,
    required HourlyForecast forecast,
  }) {
    final List<Recommendation> items = <Recommendation>[
      _maskRec(band, profile, pm25),
      _exerciseRec(band, forecast),
      _errandsRec(band, forecast),
      if (profile.childrenUnder12 > 0) _schoolAndPlay(band, forecast),
      if (profile.eldersOver60 > 0 || profile.sensitivities.isNotEmpty)
        _vulnerableCheckIn(band),
    ]..sort(_compare);
    return List<Recommendation>.unmodifiable(items);
  }

  Recommendation _rec(
    String id,
    ActionPriority p,
    String title,
    String detail,
    ImpactEstimate impact,
  ) => Recommendation(id: id, category: RecommendationCategory.routine, priority: p, title: title, actionDetail: detail, impact: impact);

  Recommendation _maskRec(AqiBand b, UserProfile p, double pm25) {
    final bool high = _isHighSmog(b);
    final ActionPriority pr = switch (b) {
      AqiBand.severe || AqiBand.veryPoor => ActionPriority.critical,
      AqiBand.poor => ActionPriority.high,
      AqiBand.moderate =>
        p.hasVulnerableMembers ? ActionPriority.high : ActionPriority.medium,
      AqiBand.satisfactory || AqiBand.good => ActionPriority.low,
    };
    final String detail = high
        ? 'Wear a snug N95 or KN95 mask (no loose cloth scarves) outdoors and check nose-bridge fit.'
        : b == AqiBand.moderate
            ? 'Keep a fitted N95 mask ready for busy junctions, especially for children, elders, or asthma.'
            : 'No pollution mask is needed today. Keep spare N95 masks dry for sudden smog spikes.';
    return _rec(
      'routine_mask',
      pr,
      high ? 'Wear a fitted N95 mask outdoors' : 'Keep N95 masks ready for spikes',
      detail,
      _impact.n95MaskImpact(pm25),
    );
  }

  Recommendation _exerciseRec(AqiBand b, HourlyForecast f) {
    final bool indoors = _isHighSmog(b);
    final ActionPriority pr = switch (b) {
      AqiBand.severe || AqiBand.veryPoor => ActionPriority.critical,
      AqiBand.poor => ActionPriority.high,
      AqiBand.moderate => ActionPriority.medium,
      AqiBand.satisfactory || AqiBand.good => ActionPriority.low,
    };
    return _rec(
      'routine_exercise',
      pr,
      indoors ? 'Move workouts indoors today' : 'Pick low-traffic routes for walks',
      indoors
          ? 'Skip outdoor runs and brisk walks. Switch to indoor stretching or yoga while AQI is ${b.label}.'
          : 'Outdoor exercise is fine, preferably away from main roads${_win(f.cleanestWindow)}.',
      _impact.cleanerWindowImpact(
        worstAqi: f.worstWindow?.averageAqi ?? 0,
        cleanestAqi: f.cleanestWindow?.averageAqi ?? 0,
      ),
    );
  }

  Recommendation _errandsRec(AqiBand b, HourlyForecast f) => _rec(
        'routine_errands',
        b == AqiBand.severe || b == AqiBand.veryPoor
            ? ActionPriority.high
            : ActionPriority.medium,
        'Batch errands during cleaner hours',
        'Combine grocery and pharmacy stops into one short trip${_win(f.cleanestWindow)}. Avoid trips${_win(f.worstWindow)}.',
        _impact.cleanerWindowImpact(
          worstAqi: f.worstWindow?.averageAqi ?? 0,
          cleanestAqi: f.cleanestWindow?.averageAqi ?? 0,
        ),
      );

  Recommendation _schoolAndPlay(AqiBand b, HourlyForecast f) {
    final bool restrict = _isHighSmog(b);
    return _rec(
      'routine_school_play',
      b == AqiBand.severe || b == AqiBand.veryPoor
          ? ActionPriority.critical
          : (restrict ? ActionPriority.high : ActionPriority.medium),
      restrict ? 'Protect children on school runs and pause outdoor play' : 'Plan children play away from traffic',
      restrict
          ? 'Use a child-sized fitted mask on school runs and move evening play indoors. Ask schools to pause outdoor PT.'
          : 'Outdoor play is fine today; prefer parks away from idling traffic${_win(f.cleanestWindow)}.',
      _impact.generalHabitImpact(
        reason: 'Children breathe faster per kg and inhale more PM2.5 during active play.',
        estimate: 'Estimated child inhaled particle dose cut by 40% to 60% when swapping active play indoors.',
        assumptions: 'Rule-of-thumb estimate based on higher ventilation during active outdoor play.',
      ),
    );
  }

  Recommendation _vulnerableCheckIn(AqiBand b) => _rec(
        'routine_vulnerable_checkin',
        _isHighSmog(b) ? ActionPriority.high : ActionPriority.low,
        'Keep rescue inhalers and check-ins ready',
        'Keep prescribed reliever inhalers within reach and check twice daily for wheezing or fatigue.',
        _impact.generalHabitImpact(
          reason: 'Early symptom recognition prevents delayed care during sudden winter smog inversions.',
          estimate: 'Estimated zero-cost safety step for elders and sensitive household members.',
          assumptions: 'General preparedness guidance only; always follow your doctor written action plan.',
        ),
      );

  bool _isHighSmog(AqiBand b) =>
      b == AqiBand.poor || b == AqiBand.veryPoor || b == AqiBand.severe;

  String _win(TimeWindow? w) => w == null
      ? ''
      : ' (${AppFormatters.formatWindow(w.start, w.end)}, avg AQI ${w.averageAqi})';

  static int _compare(Recommendation a, Recommendation b) =>
      a.priority.index != b.priority.index
          ? a.priority.index.compareTo(b.priority.index)
          : a.id.compareTo(b.id);
}
