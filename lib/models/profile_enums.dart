/// Household health sensitivities that increase smog vulnerability.
enum Sensitivity {
  /// Asthma or reactive airways.
  asthma('Asthma'),

  /// Heart or cardiovascular condition.
  heartCondition('Heart condition'),

  /// Pregnancy in the household.
  pregnancy('Pregnancy'),

  /// Seasonal or dust allergies.
  allergies('Allergies'),

  /// Chronic lung condition such as COPD.
  copd('Chronic lung condition');

  /// Creates a [Sensitivity] with its display [label].
  const Sensitivity(this.label);

  /// Display label for forms and summaries.
  final String label;
}

/// Primary daily commute mode for a household member.
enum CommuteMode {
  /// Walking or cycling outdoors.
  walkOrCycle('Walk or cycle'),

  /// Scooter or motorbike commute.
  twoWheeler('Two-wheeler'),

  /// Driving alone in a personal car.
  carSolo('Solo car'),

  /// Sharing a carpool or ride-share.
  carpool('Carpool'),

  /// Metro rail or public bus.
  metroOrBus('Metro or bus'),

  /// Working or studying from home.
  workFromHome('Work from home');

  /// Creates a [CommuteMode] with its display [label].
  const CommuteMode(this.label);

  /// Display label for forms and summaries.
  final String label;
}

/// Primary household cooking fuel.
enum CookingFuel {
  /// Bottled LPG cylinder stove.
  lpg('LPG cylinder'),

  /// Piped natural gas stove.
  png('Piped gas (PNG)'),

  /// Electric induction cooktop.
  induction('Induction'),

  /// Wood, dung cake, coal, or biomass stove.
  biomassOrWood('Wood or biomass');

  /// Creates a [CookingFuel] with its display [label].
  const CookingFuel(this.label);

  /// Display label for forms and summaries.
  final String label;
}

/// Type of residential dwelling affecting air infiltration.
enum HomeType {
  /// Multi-storey apartment flat.
  apartment('Apartment'),

  /// Independent house or bungalow.
  independentHouse('Independent house'),

  /// Ground-floor dwelling near a busy road.
  groundFloorRoadside('Roadside ground floor'),

  /// Shared hostel, PG, or single-room rental.
  sharedDorm('Shared room or hostel');

  /// Creates a [HomeType] with its display [label].
  const HomeType(this.label);

  /// Display label for forms and summaries.
  final String label;
}

/// Budget level for prioritizing low-cost versus equipment-based advice.
enum BudgetLevel {
  /// Focus on zero-cost and low-cost actions first.
  lowCost('Low cost'),

  /// Open to moderate purchases like N95 packs or DIY filters.
  moderate('Moderate'),

  /// Flexible budget for HEPA purifiers and fuel upgrades.
  flexible('Flexible');

  /// Creates a [BudgetLevel] with its display [label].
  const BudgetLevel(this.label);

  /// Display label for forms and summaries.
  final String label;
}
