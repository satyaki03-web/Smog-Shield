import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../models/recommendation.dart';
import 'recommendation_tile.dart';

/// Ranked sustainable swap recommendations rendered with `ListView.builder`.
class SwapsTab extends StatelessWidget {
  /// Creates a [SwapsTab].
  const SwapsTab({required this.items, super.key});

  /// Deterministically ranked sustainable swap recommendations.
  final List<Recommendation> items;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: items.length,
      itemBuilder: (BuildContext ctx, int index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: RecommendationTile(recommendation: items[index]),
        );
      },
    );
  }
}
