import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../models/recommendation.dart';
import 'recommendation_tile.dart';

/// Ranked indoor air quality actions rendered with `ListView.builder`.
class IndoorTab extends StatelessWidget {
  /// Creates an [IndoorTab].
  const IndoorTab({required this.items, super.key});

  /// Deterministically ranked indoor air recommendations.
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
