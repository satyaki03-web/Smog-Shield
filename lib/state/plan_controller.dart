import 'package:flutter/foundation.dart';

import '../core/app_error.dart';
import '../core/result.dart';
import '../models/air_context.dart';
import '../models/air_reading.dart';
import '../models/hourly_forecast.dart';
import '../models/plan_narrative.dart';
import '../models/recommendation.dart';
import '../models/user_profile.dart';
import '../services/ai_service.dart';
import '../services/fallback_ai_service.dart';
import '../services/plan_builder.dart';

/// Builds deterministic plans immediately and personalizes wording on demand.
class PlanController extends ChangeNotifier {
  /// Creates a [PlanController] with injected rule builder and AI services.
  PlanController({
    required PlanBuilder planBuilder,
    required AiService aiService,
    FallbackAiService? fallbackService,
  })  : _planBuilder = planBuilder,
        _aiService = aiService,
        _fallbackService = fallbackService ?? FallbackAiService();

  final PlanBuilder _planBuilder;
  final AiService _aiService;
  final FallbackAiService _fallbackService;

  AirContext? _context;
  PlanNarrative? _narrative;
  bool _isPersonalizing = false;
  AppError? _aiError;
  int _aiRequestToken = 0;

  /// Latest deterministic [AirContext] with optional AI notes attached.
  AirContext? get context => _context;

  /// Latest narrative (starts offline; upgrades on explicit AI action).
  PlanNarrative? get narrative => _narrative;

  /// True while a user-initiated Gemini personalization call is running.
  bool get isPersonalizing => _isPersonalizing;

  /// Latest AI rate-limit or error message, if any.
  AppError? get aiError => _aiError;

  /// Rebuilds the deterministic plan immediately without calling Gemini.
  Future<void> rebuildDeterministic({
    required UserProfile profile,
    required AirReading reading,
    required List<HourlyPoint> hourlyPoints,
  }) async {
    _aiRequestToken++;
    _isPersonalizing = false;
    _aiError = null;
    final AirContext built = _planBuilder.build(
      profile: profile,
      reading: reading,
      forecastPoints: hourlyPoints,
    );
    _context = built;
    final Result<PlanNarrative> offline =
        await _fallbackService.personalizePlan(built);
    _narrative = offline.valueOrNull;
    notifyListeners();
  }

  /// Explicitly invokes [AiService.personalizePlan] on user action.
  Future<void> personalizeWithAi() async {
    final AirContext? current = _context;
    if (current == null) {
      return;
    }
    final int token = ++_aiRequestToken;
    _isPersonalizing = true;
    _aiError = null;
    notifyListeners();

    final Result<PlanNarrative> result =
        await _aiService.personalizePlan(current);
    if (token != _aiRequestToken) {
      return;
    }

    result.fold(
      onSuccess: (PlanNarrative updated) {
        _narrative = updated;
        _context = _attachNotes(current, updated.itemNotes);
        _aiError = null;
      },
      onFailure: (AppError err) {
        _aiError = err;
      },
    );

    _isPersonalizing = false;
    notifyListeners();
  }

  AirContext _attachNotes(AirContext base, Map<String, String> notes) {
    if (notes.isEmpty) {
      return base;
    }
    final List<Recommendation> merged = base.recommendations
        .map(
          (Recommendation item) => notes.containsKey(item.id)
              ? item.copyWith(personalizedNote: notes[item.id])
              : item,
        )
        .toList(growable: false);
    return base.copyWith(recommendations: merged);
  }
}
