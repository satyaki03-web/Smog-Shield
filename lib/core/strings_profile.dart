/// User-facing strings for the Profile screen and household setup form.
class ProfileStrings {
  const ProfileStrings._();

  /// Page title for the profile screen.
  static const String screenTitle = 'Household Profile';

  /// Introductory helper sentence.
  static const String introText =
      'Tell us about your city, home, and daily commute so routines and indoor '
      'steps fit your family.';

  /// City selector heading.
  static const String cityLabel = 'City';

  /// City helper text.
  static const String cityHelper =
      'Used to fetch local hourly PM2.5 and AQI from Open-Meteo.';

  /// Household counts section heading.
  static const String householdHeading = 'Who lives in your home';

  /// Adults counter label.
  static const String adultsLabel = 'Adults (12 to 60)';

  /// Children counter label.
  static const String childrenLabel = 'Children under 12';

  /// Elders counter label.
  static const String eldersLabel = 'Adults over 60';

  /// Health sensitivities section heading.
  static const String sensitivitiesHeading = 'Health sensitivities (optional)';

  /// Health sensitivities helper text.
  static const String sensitivitiesHelper =
      'Select any that apply to tailor mask and outdoor activity limits.';

  /// Commute mode section heading.
  static const String commuteHeading = 'Main daily commute';

  /// Cooking fuel section heading.
  static const String cookingHeading = 'Primary cooking fuel';

  /// Home type section heading.
  static const String homeTypeHeading = 'Home type';

  /// Air purifier ownership section heading.
  static const String purifierHeading = 'Air purifier at home';

  /// Budget level section heading.
  static const String budgetHeading = 'Budget for clean-air steps';

  /// Optional manual AQI heading.
  static const String manualAqiLabel = 'Manual AQI override (optional)';

  /// Manual AQI helper text.
  static const String manualAqiHelper =
      'Leave blank for live data, or enter 0 to 999 if sensors are offline.';

  /// Submit button label.
  static const String saveProfileButton = 'Save and view plan';

  /// Validation error for invalid city.
  static const String errInvalidCity = 'Please select a supported city.';

  /// Validation error for invalid adults count.
  static const String errAdultsRange = 'Enter between 1 and 20 adults.';

  /// Validation error for invalid dependent count.
  static const String errDependentsRange = 'Enter between 0 and 20 people.';

  /// Validation error for total household count.
  static const String errTotalHousehold =
      'Total household size cannot exceed 30.';

  /// Validation error for invalid manual AQI.
  static const String errManualAqi =
      'Enter a whole number between 0 and 999, or leave blank.';

  /// Purifier yes card title.
  static const String purifierYes = 'Yes, we have a HEPA purifier';

  /// Purifier no card title.
  static const String purifierNo = 'No purifier right now';
}
