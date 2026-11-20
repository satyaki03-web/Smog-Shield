import '../core/cities.dart';
import 'enums.dart';
import 'user_profile_codec.dart';

/// Immutable household profile used to personalize smog guidance.
class UserProfile {
  /// Creates an immutable [UserProfile].
  const UserProfile({
    required this.cityName,
    required this.adults,
    required this.childrenUnder12,
    required this.eldersOver60,
    required this.sensitivities,
    required this.commuteMode,
    required this.cookingFuel,
    required this.homeType,
    required this.ownsPurifier,
    required this.budgetLevel,
    this.manualAqi,
  });

  /// Default starter profile for a Delhi NCR family.
  factory UserProfile.defaults() => const UserProfile(
        cityName: AppCities.defaultCityName,
        adults: 2,
        childrenUnder12: 1,
        eldersOver60: 0,
        sensitivities: <Sensitivity>{},
        commuteMode: CommuteMode.metroOrBus,
        cookingFuel: CookingFuel.lpg,
        homeType: HomeType.apartment,
        ownsPurifier: false,
        budgetLevel: BudgetLevel.lowCost,
      );

  /// Restores a [UserProfile] from a persisted JSON map.
  factory UserProfile.fromJson(Map<String, Object?> json) =>
      UserProfileCodec.fromJson(json);

  /// Selected city name from [AppCities].
  final String cityName;

  /// Number of household adults aged 12 to 60.
  final int adults;

  /// Number of children under age 12.
  final int childrenUnder12;

  /// Number of older adults over age 60.
  final int eldersOver60;

  /// Health sensitivities present in the household.
  final Set<Sensitivity> sensitivities;

  /// Primary daily commute mode.
  final CommuteMode commuteMode;

  /// Primary household cooking fuel.
  final CookingFuel cookingFuel;

  /// Type of home construction or location.
  final HomeType homeType;

  /// Whether the household currently owns a HEPA air purifier.
  final bool ownsPurifier;

  /// Budget preference for clean-air recommendations.
  final BudgetLevel budgetLevel;

  /// Optional user-entered AQI override when offline.
  final int? manualAqi;

  /// Total number of people in the household.
  int get totalMembers => adults + childrenUnder12 + eldersOver60;

  /// Whether any child, elder, or sensitive person lives in the home.
  bool get hasVulnerableMembers =>
      childrenUnder12 > 0 || eldersOver60 > 0 || sensitivities.isNotEmpty;

  /// Serializes this profile into a JSON-encodable map.
  Map<String, Object?> toJson() => UserProfileCodec.toJson(this);

  /// Returns a copy with selectively overridden fields.
  UserProfile copyWith({
    String? cityName,
    int? adults,
    int? childrenUnder12,
    int? eldersOver60,
    Set<Sensitivity>? sensitivities,
    CommuteMode? commuteMode,
    CookingFuel? cookingFuel,
    HomeType? homeType,
    bool? ownsPurifier,
    BudgetLevel? budgetLevel,
    int? manualAqi,
    bool clearManualAqi = false,
  }) {
    return UserProfile(
      cityName: cityName ?? this.cityName,
      adults: adults ?? this.adults,
      childrenUnder12: childrenUnder12 ?? this.childrenUnder12,
      eldersOver60: eldersOver60 ?? this.eldersOver60,
      sensitivities: sensitivities ?? this.sensitivities,
      commuteMode: commuteMode ?? this.commuteMode,
      cookingFuel: cookingFuel ?? this.cookingFuel,
      homeType: homeType ?? this.homeType,
      ownsPurifier: ownsPurifier ?? this.ownsPurifier,
      budgetLevel: budgetLevel ?? this.budgetLevel,
      manualAqi: clearManualAqi ? null : (manualAqi ?? this.manualAqi),
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is UserProfile &&
            cityName == other.cityName &&
            adults == other.adults &&
            childrenUnder12 == other.childrenUnder12 &&
            eldersOver60 == other.eldersOver60 &&
            sensitivities.length == other.sensitivities.length &&
            sensitivities.containsAll(other.sensitivities) &&
            commuteMode == other.commuteMode &&
            cookingFuel == other.cookingFuel &&
            homeType == other.homeType &&
            ownsPurifier == other.ownsPurifier &&
            budgetLevel == other.budgetLevel &&
            manualAqi == other.manualAqi;
  }

  @override
  int get hashCode => Object.hash(
        cityName,
        adults,
        childrenUnder12,
        eldersOver60,
        Object.hashAllUnordered(sensitivities),
        commuteMode,
        cookingFuel,
        homeType,
        ownsPurifier,
        budgetLevel,
        manualAqi,
      );
}
