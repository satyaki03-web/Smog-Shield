import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:smog_shield/core/result.dart';
import 'package:smog_shield/models/enums.dart';
import 'package:smog_shield/models/user_profile.dart';
import 'package:smog_shield/services/storage_service.dart';
import 'package:smog_shield/state/checklist_controller.dart';
import 'package:smog_shield/state/profile_controller.dart';

class _MockStorage extends Mock implements StorageService {}

class _FakeProfile extends Fake implements UserProfile {}

void main() {
  setUpAll(() {
    registerFallbackValue(_FakeProfile());
    registerFallbackValue(AppThemeMode.light);
    registerFallbackValue(<String>{});
  });

  group('ProfileController', () {
    test('loads, validates, saves, updates theme, and clears data', () async {
      final _MockStorage storage = _MockStorage();
      when(storage.loadProfile).thenAnswer(
        (_) async => const Success<UserProfile?>(null),
      );
      when(storage.loadThemeMode).thenAnswer(
        (_) async => const Success<AppThemeMode>(AppThemeMode.light),
      );
      when(() => storage.saveProfile(any()))
          .thenAnswer((_) async => const Success<void>(null));
      when(() => storage.saveThemeMode(any()))
          .thenAnswer((_) async => const Success<void>(null));
      when(storage.clearAll).thenAnswer((_) async => const Success<void>(null));

      final ProfileController ctrl = ProfileController(storage: storage);
      await ctrl.load();
      expect(ctrl.hasCompletedSetup, isFalse);

      final Map<String, String> errs =
          await ctrl.saveProfile(UserProfile.defaults().copyWith(adults: 0));
      expect(errs['adults'], isNotNull);

      final Map<String, String> ok =
          await ctrl.saveProfile(UserProfile.defaults());
      expect(ok, isEmpty);
      expect(ctrl.hasCompletedSetup, isTrue);

      await ctrl.setThemeMode(AppThemeMode.dark);
      expect(ctrl.themeMode, AppThemeMode.dark);

      await ctrl.clearAllData();
      expect(ctrl.hasCompletedSetup, isFalse);
      expect(ctrl.themeMode, AppThemeMode.light);
    });
  });

  group('ChecklistController', () {
    test('loads, toggles, persists, and resets items', () async {
      final _MockStorage storage = _MockStorage();
      when(storage.loadChecklistIds)
          .thenAnswer((_) async => const Success<Set<String>>(<String>{}));
      when(() => storage.saveChecklistIds(any()))
          .thenAnswer((_) async => const Success<void>(null));

      final ChecklistController ctrl = ChecklistController(storage: storage);
      await ctrl.load();
      expect(ctrl.itemsForBand(AqiBand.severe), isNotEmpty);

      await ctrl.toggle('comm_no_leaf_burning');
      expect(ctrl.isCompleted('comm_no_leaf_burning'), isTrue);

      await ctrl.toggle('comm_no_leaf_burning');
      expect(ctrl.isCompleted('comm_no_leaf_burning'), isFalse);

      await ctrl.toggle('comm_school_idling');
      ctrl.resetLocal();
      expect(ctrl.completedIds, isEmpty);
    });
  });
}
