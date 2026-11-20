import '../core/formatters.dart';
import '../core/strings.dart';
import '../models/air_context.dart';
import '../models/enums.dart';
import '../models/plan_narrative.dart';
import '../models/recommendation.dart';

/// Immutable item inside the RWA and school community checklist.
class ChecklistItem {
  /// Creates an immutable [ChecklistItem].
  const ChecklistItem({
    required this.id,
    required this.title,
    required this.audience,
  });

  /// Stable identifier persisted in shared preferences.
  final String id;

  /// Actionable checklist line item.
  final String title;

  /// Target group such as `RWA` or `School`.
  final String audience;
}

/// Pure Dart Markdown plan exporter and band-specific community checklist.
class PlanExporter {
  const PlanExporter._();

  /// Exports the current [context] and optional [narrative] as clean Markdown.
  static String toMarkdown(AirContext context, {PlanNarrative? narrative}) {
    final StringBuffer buf = StringBuffer()
      ..writeln('# Smog Shield Daily Plan: ${context.reading.cityName}')
      ..writeln()
      ..writeln(
        '- **AQI:** ${context.reading.aqi} (${context.bandInfo.band.label})',
      )
      ..writeln(
        '- **PM2.5:** ${AppFormatters.formatOneDecimal(context.reading.pm25)} ug/m3',
      )
      ..writeln('- **Who is most at risk:** ${context.whoIsAtRisk}');
    if (context.forecast.cleanestWindow != null) {
      buf.writeln(
        '- **Cleanest 2-hour window:** '
        '${AppFormatters.formatWindow(context.forecast.cleanestWindow!.start, context.forecast.cleanestWindow!.end)}',
      );
    }
    if (narrative != null) {
      buf
        ..writeln()
        ..writeln('## ${narrative.headline}')
        ..writeln(narrative.summary);
    }
    for (final RecommendationCategory cat in RecommendationCategory.values) {
      buf
        ..writeln()
        ..writeln('## ${cat.label}');
      for (final Recommendation item in context.byCategory(cat)) {
        buf
          ..writeln('- **${item.title}** (${item.priority.label})')
          ..writeln('  - ${item.actionDetail}')
          ..writeln('  - Why this helps: ${item.impact.quantifiedEstimate}');
      }
    }
    buf
      ..writeln()
      ..writeln('> ${AppStrings.medicalDisclaimer}');
    return buf.toString().trim();
  }

  /// Returns the RWA and school checklist items tailored to [band].
  static List<ChecklistItem> communityChecklistForBand(AqiBand band) {
    final List<ChecklistItem> base = <ChecklistItem>[
      const ChecklistItem(
        id: 'comm_no_leaf_burning',
        title: 'Ban dry-leaf and garbage burning; divert leaves to compost pit',
        audience: 'RWA',
      ),
      const ChecklistItem(
        id: 'comm_guard_heaters',
        title: 'Provide warm jackets or electric heaters to security guards instead of bonfires',
        audience: 'RWA',
      ),
      const ChecklistItem(
        id: 'comm_dust_sprinkle',
        title: 'Wet-sweep colony lanes and cover loose construction sand piles',
        audience: 'RWA',
      ),
      const ChecklistItem(
        id: 'comm_school_idling',
        title: 'Enforce engine-off zones at school drop-off and pickup gates',
        audience: 'School',
      ),
    ];
    if (band == AqiBand.poor ||
        band == AqiBand.veryPoor ||
        band == AqiBand.severe) {
      base.addAll(const <ChecklistItem>[
        ChecklistItem(
          id: 'comm_school_indoor_pt',
          title: 'Move school assemblies, sports, and PT strictly indoors',
          audience: 'School',
        ),
        ChecklistItem(
          id: 'comm_rwa_carpool',
          title: 'Share colony carpool board and discourage solo short-hop drives',
          audience: 'RWA',
        ),
      ]);
    }
    if (band == AqiBand.veryPoor || band == AqiBand.severe) {
      base.add(
        const ChecklistItem(
          id: 'comm_school_mask_stock',
          title: 'Keep spare child-sized N95 masks and asthma action plans at reception',
          audience: 'School',
        ),
      );
    }
    return List<ChecklistItem>.unmodifiable(base);
  }
}
