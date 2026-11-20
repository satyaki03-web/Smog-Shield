import 'package:flutter/foundation.dart';

import '../core/app_error.dart';
import '../core/result.dart';
import '../models/enums.dart';
import '../models/user_profile.dart';
import '../services/storage_service.dart';
import '../validation/input_validator.dart';

/// Manages the saved [UserProfile], onboarding completion, and theme mode.
class ProfileController extends ChangeNotifier {
  /// Creates a [ProfileController] backed by [storage].
  ProfileController({required StorageService storage}) : _storage = storage;

  final StorageService _storage;

  UserProfile _profile = UserProfile.defaults();
  AppThemeMode _themeMode = AppThemeMode.light;
  bool _hasCompletedSetup = false;
  bool _isLoading = false;
  AppError? _error;

  /// Active household profile.
  UserProfile get profile => _profile;

  /// Active visual theme mode.
  AppThemeMode get themeMode => _themeMode;

  /// Whether the user has completed and saved their profile at least once.
  bool get hasCompletedSetup => _hasCompletedSetup;

  /// Whether storage load/save is in progress.
  bool get isLoading => _isLoading;

  /// Latest non-fatal storage error, if any.
  AppError? get error => _error;

  /// Loads persisted profile and theme settings from [StorageService].
  Future<void> load() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final Result<UserProfile?> profileResult = await _storage.loadProfile();
    profileResult.fold(
      onSuccess: (UserProfile? saved) {
        if (saved != null) {
          _profile = saved;
          _hasCompletedSetup = true;
        }
      },
      onFailure: (AppError err) => _error = err,
    );

    final Result<AppThemeMode> themeResult = await _storage.loadThemeMode();
    themeResult.fold(
      onSuccess: (AppThemeMode savedMode) => _themeMode = savedMode,
      onFailure: (AppError err) => _error = err,
    );

    _isLoading = false;
    notifyListeners();
  }

  /// Validates and saves [updated], returning field validation errors if any.
  Future<Map<String, String>> saveProfile(UserProfile updated) async {
    final Map<String, String> fieldErrors =
        InputValidator.validateProfile(updated);
    if (fieldErrors.isNotEmpty) {
      return fieldErrors;
    }
    _profile = updated;
    _hasCompletedSetup = true;
    _error = null;
    notifyListeners();

    final Result<void> saved = await _storage.saveProfile(updated);
    if (saved.isFailure) {
      _error = saved.errorOrNull;
      notifyListeners();
    }
    return const <String, String>{};
  }

  /// Switches and persists the active [AppThemeMode].
  Future<void> setThemeMode(AppThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    final Result<void> saved = await _storage.saveThemeMode(mode);
    if (saved.isFailure) {
      _error = saved.errorOrNull;
      notifyListeners();
    }
  }

  /// Clears all locally persisted profile, checklist, and theme preferences.
  Future<Result<void>> clearAllData() async {
    final Result<void> cleared = await _storage.clearAll();
    if (cleared.isSuccess) {
      _profile = UserProfile.defaults();
      _themeMode = AppThemeMode.light;
      _hasCompletedSetup = false;
      _error = null;
      notifyListeners();
    } else {
      _error = cleared.errorOrNull;
      notifyListeners();
    }
    return cleared;
  }
}
