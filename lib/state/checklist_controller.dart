import 'package:flutter/foundation.dart';

import '../core/app_error.dart';
import '../core/result.dart';
import '../models/enums.dart';
import '../services/plan_exporter.dart';
import '../services/storage_service.dart';

/// Persists RWA and school community checklist progress.
class ChecklistController extends ChangeNotifier {
  /// Creates a [ChecklistController] backed by [storage].
  ChecklistController({required StorageService storage}) : _storage = storage;

  final StorageService _storage;
  Set<String> _completedIds = <String>{};
  AppError? _error;

  /// Set of completed checklist item IDs.
  Set<String> get completedIds => Set<String>.unmodifiable(_completedIds);

  /// Latest storage error, if any.
  AppError? get error => _error;

  /// Loads saved checklist IDs from local storage.
  Future<void> load() async {
    final Result<Set<String>> result = await _storage.loadChecklistIds();
    result.fold(
      onSuccess: (Set<String> ids) {
        _completedIds = Set<String>.from(ids);
        _error = null;
      },
      onFailure: (AppError err) => _error = err,
    );
    notifyListeners();
  }

  /// Returns community checklist items appropriate for [band].
  List<ChecklistItem> itemsForBand(AqiBand band) {
    return PlanExporter.communityChecklistForBand(band);
  }

  /// Whether checklist item [id] is marked complete.
  bool isCompleted(String id) => _completedIds.contains(id);

  /// Toggles completion state of [id] and persists immediately.
  Future<void> toggle(String id) async {
    if (_completedIds.contains(id)) {
      _completedIds.remove(id);
    } else {
      _completedIds.add(id);
    }
    notifyListeners();
    final Result<void> saved = await _storage.saveChecklistIds(_completedIds);
    if (saved.isFailure) {
      _error = saved.errorOrNull;
      notifyListeners();
    }
  }

  /// Clears in-memory checklist progress.
  void resetLocal() {
    _completedIds.clear();
    _error = null;
    notifyListeners();
  }
}
