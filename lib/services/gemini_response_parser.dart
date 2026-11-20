import 'dart:convert';

import '../core/constants.dart';
import '../models/plan_narrative.dart';
import '../validation/input_validator.dart';

/// Strict parser and validator for Gemini REST JSON responses.
class GeminiResponseParser {
  const GeminiResponseParser._();

  /// Structured JSON schema enforced for plan personalization responses.
  static const Map<String, Object?> planResponseSchema = <String, Object?>{
    'type': 'OBJECT',
    'required': <String>['headline', 'summary', 'items'],
    'properties': <String, Object?>{
      'headline': <String, Object?>{'type': 'STRING'},
      'summary': <String, Object?>{'type': 'STRING'},
      'items': <String, Object?>{
        'type': 'ARRAY',
        'items': <String, Object?>{
          'type': 'OBJECT',
          'required': <String>['id', 'personalizedNote'],
          'properties': <String, Object?>{
            'id': <String, Object?>{'type': 'STRING'},
            'personalizedNote': <String, Object?>{'type': 'STRING'},
          },
        },
      },
    },
  };

  /// Extracts candidate text from a raw Gemini REST response map.
  static String? extractCandidateText(Map<String, Object?> payload) {
    final Object? candidates = payload['candidates'];
    if (candidates is! List<Object?> || candidates.isEmpty) {
      return null;
    }
    final Object? first = candidates.first;
    if (first is! Map<String, Object?>) {
      return null;
    }
    final Object? content = first['content'];
    if (content is! Map<String, Object?>) {
      return null;
    }
    final Object? parts = content['parts'];
    if (parts is! List<Object?> || parts.isEmpty) {
      return null;
    }
    final Object? part = parts.first;
    if (part is! Map<String, Object?> || part['text'] is! String) {
      return null;
    }
    return (part['text']! as String).trim();
  }

  /// Validates and parses structured JSON text into an immutable [PlanNarrative].
  static PlanNarrative? parsePlanJson(String jsonText, DateTime now) {
    final Object? decoded = jsonDecode(jsonText);
    if (decoded is! Map<String, Object?>) {
      return null;
    }
    final Object? headline = decoded['headline'];
    final Object? summary = decoded['summary'];
    final Object? items = decoded['items'];
    if (headline is! String || summary is! String || items is! List<Object?>) {
      return null;
    }
    final String safeHeadline =
        InputValidator.sanitizeText(headline, maxLength: 160);
    final String safeSummary =
        InputValidator.sanitizeText(summary, maxLength: 500);
    if (safeHeadline.isEmpty ||
        safeSummary.isEmpty ||
        items.length > AppConstants.aiMaxPersonalizedItems) {
      return null;
    }
    final Map<String, String>? notes = _parseItemNotes(items);
    if (notes == null) {
      return null;
    }
    return PlanNarrative(
      headline: safeHeadline,
      summary: safeSummary,
      itemNotes: Map<String, String>.unmodifiable(notes),
      isFallback: false,
      generatedAt: now,
    );
  }

  static Map<String, String>? _parseItemNotes(List<Object?> items) {
    final Map<String, String> notes = <String, String>{};
    for (final Object? entry in items) {
      if (entry is! Map<String, Object?>) {
        return null;
      }
      final Object? id = entry['id'];
      final Object? note = entry['personalizedNote'];
      if (id is! String || note is! String) {
        return null;
      }
      final String cleanId = InputValidator.sanitizeText(id, maxLength: 60);
      final String cleanNote =
          InputValidator.sanitizeText(note, maxLength: 240);
      if (cleanId.isNotEmpty && cleanNote.isNotEmpty) {
        notes[cleanId] = cleanNote;
      }
    }
    return notes;
  }
}
