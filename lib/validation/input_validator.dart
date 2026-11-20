import '../core/app_error.dart';
import '../core/cities.dart';
import '../core/constants.dart';
import '../core/result.dart';
import '../core/strings.dart';
import '../models/user_profile.dart';

/// Pure Dart input validation and text sanitization helpers.
class InputValidator {
  const InputValidator._();

  static final RegExp _controlChars = RegExp(r'[\x00-\x1F\x7F]');
  static final RegExp _multiWhitespace = RegExp(r'\s+');

  /// Strips control characters, collapses whitespace, trims, and caps length.
  static String sanitizeText(
    String raw, {
    int maxLength = AppConstants.maxChatQuestionLength,
  }) {
    final String stripped = raw.replaceAll(_controlChars, ' ');
    final String collapsed = stripped.replaceAll(_multiWhitespace, ' ').trim();
    if (collapsed.length <= maxLength) {
      return collapsed;
    }
    return collapsed.substring(0, maxLength).trim();
  }

  /// Validates a [UserProfile] and returns field keys mapped to error messages.
  static Map<String, String> validateProfile(UserProfile profile) {
    final Map<String, String> errors = <String, String>{};
    if (AppCities.findByName(profile.cityName) == null) {
      errors['city'] = ProfileStrings.errInvalidCity;
    }
    if (profile.adults < AppConstants.minHouseholdAdults ||
        profile.adults > AppConstants.maxHouseholdAdults) {
      errors['adults'] = ProfileStrings.errAdultsRange;
    }
    if (profile.childrenUnder12 < 0 ||
        profile.childrenUnder12 > AppConstants.maxHouseholdDependents) {
      errors['children'] = ProfileStrings.errDependentsRange;
    }
    if (profile.eldersOver60 < 0 ||
        profile.eldersOver60 > AppConstants.maxHouseholdDependents) {
      errors['elders'] = ProfileStrings.errDependentsRange;
    }
    if (profile.totalMembers > AppConstants.maxTotalHousehold) {
      errors['household'] = ProfileStrings.errTotalHousehold;
    }
    final int? manual = profile.manualAqi;
    if (manual != null &&
        (manual < AppConstants.aqiMin || manual > AppConstants.aqiMax)) {
      errors['manualAqi'] = ProfileStrings.errManualAqi;
    }
    return errors;
  }

  /// Validates and parses an optional manual AQI text field.
  static Result<int?> validateManualAqiText(String raw) {
    final String cleaned = sanitizeText(raw, maxLength: 10);
    if (cleaned.isEmpty) {
      return const Success<int?>(null);
    }
    final int? parsed = int.tryParse(cleaned);
    if (parsed == null ||
        parsed < AppConstants.aqiMin ||
        parsed > AppConstants.aqiMax) {
      return const Failure<int?>(
        AppError(
          code: AppErrorCode.validation,
          userMessage: ProfileStrings.errManualAqi,
        ),
      );
    }
    return Success<int?>(parsed);
  }

  /// Validates and sanitizes an Ask question within the 500-character bound.
  static Result<String> validateChatQuestion(String raw) {
    final String stripped = raw.replaceAll(_controlChars, ' ');
    final String normalized = stripped.replaceAll(_multiWhitespace, ' ').trim();
    if (normalized.isEmpty) {
      return const Failure<String>(
        AppError(
          code: AppErrorCode.validation,
          userMessage: DashboardStrings.askEmptyError,
        ),
      );
    }
    if (normalized.length > AppConstants.maxChatQuestionLength) {
      return const Failure<String>(
        AppError(
          code: AppErrorCode.validation,
          userMessage: DashboardStrings.askTooLongError,
        ),
      );
    }
    return Success<String>(normalized);
  }

  /// Checks whether numeric API air metrics are finite and within bounds.
  static bool isValidReading({
    required double aqi,
    required double pm25,
    required double pm10,
  }) {
    final bool finite = aqi.isFinite && pm25.isFinite && pm10.isFinite;
    if (!finite) {
      return false;
    }
    return aqi >= AppConstants.aqiMin &&
        aqi <= AppConstants.aqiMax &&
        pm25 >= 0.0 &&
        pm25 <= AppConstants.maxPm25 &&
        pm10 >= 0.0 &&
        pm10 <= AppConstants.maxPm10;
  }
}
