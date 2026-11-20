import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/enums.dart';
import '../../services/plan_exporter.dart';
import '../../state/checklist_controller.dart';
import 'selectable_card.dart';

/// Modal sheet displaying RWA and school actions tailored to the active [band].
class CommunityChecklistSheet extends StatelessWidget {
  /// Creates a [CommunityChecklistSheet].
  const CommunityChecklistSheet({required this.band, super.key});

  /// Active CPCB AQI band determining which community checks appear.
  final AqiBand band;

  @override
  Widget build(BuildContext context) {
    final ChecklistController controller = context.watch<ChecklistController>();
    final List<ChecklistItem> items = controller.itemsForBand(band);
    final TextTheme textTheme = Theme.of(context).textTheme;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    DashboardStrings.checklistHeading,
                    style: textTheme.headlineMedium,
                  ),
                ),
                OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(AppStrings.closeButton),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Band: ${band.label}. Select completed steps to save progress on this device.',
              style: textTheme.bodySmall,
            ),
            const SizedBox(height: AppSpacing.md),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: items.length,
                itemBuilder: (BuildContext ctx, int index) {
                  final ChecklistItem item = items[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: SelectableCard(
                      title: item.title,
                      subtitle: 'For: ${item.audience}',
                      selected: controller.isCompleted(item.id),
                      onTap: () => controller.toggle(item.id),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
