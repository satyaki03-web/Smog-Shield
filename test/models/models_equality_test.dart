import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/models/air_reading.dart';
import 'package:smog_shield/models/aqi_band_info.dart';
import 'package:smog_shield/models/chat_message.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/hourly_forecast.dart';
import 'package:smog_shield/models/impact_estimate.dart';
import 'package:smog_shield/models/plan_narrative.dart';
import 'package:smog_shield/models/recommendation.dart';
import 'package:smog_shield/models/user_profile.dart';

void main() {
  final DateTime t0 = DateTime(2026, 11, 20, 8);

  group('Immutable model value equality and copyWith', () {
    test('UserProfile round-trips JSON, supports copyWith, and value equality', () {
      final UserProfile p1 = UserProfile.defaults().copyWith(
        cityName: 'Lucknow',
        adults: 2,
        childrenUnder12: 1,
        eldersOver60: 1,
        sensitivities: const <Sensitivity>{Sensitivity.asthma, Sensitivity.copd},
        manualAqi: 215,
      );
      final UserProfile roundTripped = UserProfile.fromJson(p1.toJson());
      expect(roundTripped, p1);
      expect(roundTripped.hashCode, p1.hashCode);
      expect(p1.totalMembers, 4);
      expect(p1.hasVulnerableMembers, isTrue);

      final UserProfile cleared = p1.copyWith(clearManualAqi: true);
      expect(cleared.manualAqi, isNull);
    });

    test('AirReading, HourlyPoint, TimeWindow, HourlyForecast equality works', () {
      final AirReading r = AirReading(
        aqi: 200,
        pm25: 100,
        pm10: 150,
        observedAt: t0,
        cityName: 'Delhi',
      );
      expect(r.copyWith(aqi: 200), r);
      expect(r.copyWith(aqi: 200).hashCode, r.hashCode);

      final HourlyPoint hp = HourlyPoint(time: t0, aqi: 180, pm25: 90);
      expect(hp.copyWith(aqi: 180), hp);

      final TimeWindow tw = TimeWindow(
        start: t0,
        end: t0.add(const Duration(hours: 2)),
        averageAqi: 180,
      );
      expect(tw.copyWith(averageAqi: 180), tw);

      final HourlyForecast hf = HourlyForecast(
        points: <HourlyPoint>[hp],
        cleanestWindow: tw,
        worstWindow: tw,
      );
      expect(hf.copyWith(), hf);
      expect(hf.hashCode, hf.copyWith().hashCode);
    });

    test('AqiBandInfo, ImpactEstimate, Recommendation, PlanNarrative, ChatMessage equality', () {
      const AqiBandInfo bandInfo = AqiBandInfo(
        band: AqiBand.poor,
        rangeLabel: '201 to 300',
        advice: 'Stay indoors',
        maskGuidance: 'Wear N95',
        baseRiskMultiplier: 1.45,
      );
      expect(bandInfo.copyWith(), bandInfo);

      const ImpactEstimate impact = ImpactEstimate(
        reason: 'r',
        quantifiedEstimate: 'q',
        assumptionsNote: 'a',
      );
      expect(impact.copyWith(), impact);

      const Recommendation rec = Recommendation(
        id: 'r1',
        category: RecommendationCategory.routine,
        priority: ActionPriority.high,
        title: 'Title',
        actionDetail: 'Detail',
        impact: impact,
      );
      expect(rec.copyWith(personalizedNote: 'Note').personalizedNote, 'Note');
      expect(rec.copyWith(), rec);

      final PlanNarrative narrative = PlanNarrative(
        headline: 'H',
        summary: 'S',
        itemNotes: const <String, String>{'r1': 'Note'},
        isFallback: false,
        generatedAt: t0,
      );
      expect(narrative.copyWith(), narrative);
      expect(narrative.hashCode, narrative.copyWith().hashCode);

      final ChatMessage msg = ChatMessage(
        id: 'm1',
        isUser: true,
        text: 'Hello',
        sentAt: t0,
      );
      expect(msg.copyWith(), msg);
    });
  });
}
