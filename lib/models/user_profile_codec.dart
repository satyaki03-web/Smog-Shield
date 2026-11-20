import '../core/cities.dart';
import 'enums.dart';
import 'user_profile.dart';

/// Pure Dart JSON serializer and deserializer for [UserProfile].
class UserProfileCodec {
  const UserProfileCodec._();

  /// Restores a [UserProfile] from a persisted JSON [json] map.
  static UserProfile fromJson(Map<String, Object?> json) {
    final List<Object?> rawSens = json['sensitivities'] is List<Object?>
        ? json['sensitivities']! as List<Object?>
        : const <Object?>[];
    return UserProfile(
      cityName: json['cityName'] is String
          ? json['cityName']! as String
          : AppCities.defaultCityName,
      adults: json['adults'] is int ? json['adults']! as int : 2,
      childrenUnder12:
          json['childrenUnder12'] is int ? json['childrenUnder12']! as int : 0,
      eldersOver60:
          json['eldersOver60'] is int ? json['eldersOver60']! as int : 0,
      sensitivities: _parseSensitivities(rawSens),
      commuteMode: _enumByName(
        CommuteMode.values,
        json['commuteMode'],
        CommuteMode.metroOrBus,
      ),
      cookingFuel: _enumByName(
        CookingFuel.values,
        json['cookingFuel'],
        CookingFuel.lpg,
      ),
      homeType: _enumByName(
        HomeType.values,
        json['homeType'],
        HomeType.apartment,
      ),
      ownsPurifier:
          json['ownsPurifier'] is bool && (json['ownsPurifier']! as bool),
      budgetLevel: _enumByName(
        BudgetLevel.values,
        json['budgetLevel'],
        BudgetLevel.lowCost,
      ),
      manualAqi: json['manualAqi'] is int ? json['manualAqi']! as int : null,
    );
  }

  /// Serializes [profile] into a JSON-encodable map.
  static Map<String, Object?> toJson(UserProfile profile) => <String, Object?>{
        'cityName': profile.cityName,
        'adults': profile.adults,
        'childrenUnder12': profile.childrenUnder12,
        'eldersOver60': profile.eldersOver60,
        'sensitivities':
            profile.sensitivities.map((Sensitivity s) => s.name).toList(),
        'commuteMode': profile.commuteMode.name,
        'cookingFuel': profile.cookingFuel.name,
        'homeType': profile.homeType.name,
        'ownsPurifier': profile.ownsPurifier,
        'budgetLevel': profile.budgetLevel.name,
        'manualAqi': profile.manualAqi,
      };

  static Set<Sensitivity> _parseSensitivities(List<Object?> raw) {
    final Set<Sensitivity> result = <Sensitivity>{};
    for (final Object? item in raw) {
      if (item is String) {
        for (final Sensitivity s in Sensitivity.values) {
          if (s.name == item) {
            result.add(s);
          }
        }
      }
    }
    return result;
  }

  static T _enumByName<T extends Enum>(List<T> values, Object? raw, T fallback) {
    if (raw is String) {
      for (final T item in values) {
        if (item.name == raw) {
          return item;
        }
      }
    }
    return fallback;
  }
}
