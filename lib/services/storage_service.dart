import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../core/app_error.dart';
import '../core/result.dart';
import '../core/strings.dart';
import '../models/enums.dart';
import '../models/user_profile.dart';

/// Abstract local storage contract for profile, checklist, and theme state.
abstract class StorageService {
  /// Loads the saved [UserProfile], or returns null if none is stored.
  Future<Result<UserProfile?>> loadProfile();

  /// Persists [profile] locally.
  Future<Result<void>> saveProfile(UserProfile profile);

  /// Loads completed community checklist item IDs.
  Future<Result<Set<String>>> loadChecklistIds();

  /// Persists completed community checklist item IDs.
  Future<Result<void>> saveChecklistIds(Set<String> ids);

  /// Loads the saved [AppThemeMode].
  Future<Result<AppThemeMode>> loadThemeMode();

  /// Persists the chosen [AppThemeMode].
  Future<Result<void>> saveThemeMode(AppThemeMode mode);

  /// Clears all user data saved by Smog Shield.
  Future<Result<void>> clearAll();
}

/// [StorageService] implementation backed by `shared_preferences`.
class SharedPreferencesStorageService implements StorageService {
  /// Creates a [SharedPreferencesStorageService] with injected [prefs].
  const SharedPreferencesStorageService(this._prefs);

  static const String _profileKey = 'smog_shield_profile_v1';
  static const String _checklistKey = 'smog_shield_checklist_v1';
  static const String _themeKey = 'smog_shield_theme_v1';

  final SharedPreferences _prefs;

  @override
  Future<Result<UserProfile?>> loadProfile() async {
    try {
      final String? raw = _prefs.getString(_profileKey);
      if (raw == null || raw.isEmpty) {
        return const Success<UserProfile?>(null);
      }
      final Object? decoded = jsonDecode(raw);
      if (decoded is! Map<String, Object?>) {
        return const Success<UserProfile?>(null);
      }
      return Success<UserProfile?>(UserProfile.fromJson(decoded));
    } catch (_) {
      return const Failure<UserProfile?>(
        AppError(code: AppErrorCode.storage, userMessage: AppStrings.errorStorage),
      );
    }
  }

  @override
  Future<Result<void>> saveProfile(UserProfile profile) async {
    try {
      await _prefs.setString(_profileKey, jsonEncode(profile.toJson()));
      return const Success<void>(null);
    } catch (_) {
      return const Failure<void>(
        AppError(code: AppErrorCode.storage, userMessage: AppStrings.errorStorage),
      );
    }
  }

  @override
  Future<Result<Set<String>>> loadChecklistIds() async {
    try {
      final List<String> stored =
          _prefs.getStringList(_checklistKey) ?? const <String>[];
      return Success<Set<String>>(stored.toSet());
    } catch (_) {
      return const Failure<Set<String>>(
        AppError(code: AppErrorCode.storage, userMessage: AppStrings.errorStorage),
      );
    }
  }

  @override
  Future<Result<void>> saveChecklistIds(Set<String> ids) async {
    try {
      await _prefs.setStringList(_checklistKey, ids.toList(growable: false));
      return const Success<void>(null);
    } catch (_) {
      return const Failure<void>(
        AppError(code: AppErrorCode.storage, userMessage: AppStrings.errorStorage),
      );
    }
  }

  @override
  Future<Result<AppThemeMode>> loadThemeMode() async {
    try {
      final String? raw = _prefs.getString(_themeKey);
      for (final AppThemeMode mode in AppThemeMode.values) {
        if (mode.name == raw) {
          return Success<AppThemeMode>(mode);
        }
      }
      return const Success<AppThemeMode>(AppThemeMode.light);
    } catch (_) {
      return const Failure<AppThemeMode>(
        AppError(code: AppErrorCode.storage, userMessage: AppStrings.errorStorage),
      );
    }
  }

  @override
  Future<Result<void>> saveThemeMode(AppThemeMode mode) async {
    try {
      await _prefs.setString(_themeKey, mode.name);
      return const Success<void>(null);
    } catch (_) {
      return const Failure<void>(
        AppError(code: AppErrorCode.storage, userMessage: AppStrings.errorStorage),
      );
    }
  }

  @override
  Future<Result<void>> clearAll() async {
    try {
      await _prefs.remove(_profileKey);
      await _prefs.remove(_checklistKey);
      await _prefs.remove(_themeKey);
      return const Success<void>(null);
    } catch (_) {
      return const Failure<void>(
        AppError(code: AppErrorCode.storage, userMessage: AppStrings.errorStorage),
      );
    }
  }
}
