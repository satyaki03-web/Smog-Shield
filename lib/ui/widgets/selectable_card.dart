import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';

/// Reusable flat selectable card with pointer cursor, focus ring, and static selected state.
class SelectableCard extends StatelessWidget {
  /// Creates a [SelectableCard].
  const SelectableCard({
    required this.title,
    required this.selected,
    required this.onTap,
    this.subtitle,
    this.enabled = true,
    this.semanticLabel,
    super.key,
  });

  /// Primary text label displayed inside the card.
  final String title;

  /// Optional secondary helper text.
  final String? subtitle;

  /// Whether this card is currently selected.
  final bool selected;

  /// Callback invoked when activated via tap, Enter, or Space.
  final VoidCallback? onTap;

  /// Whether user interaction is permitted.
  final bool enabled;

  /// Optional explicit semantics label overriding [title].
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final bool isActive = enabled && onTap != null;
    final MouseCursor cursor =
        isActive ? SystemMouseCursors.click : SystemMouseCursors.forbidden;
    final BorderRadius radius = BorderRadius.circular(AppSpacing.radiusMd);
    return Semantics(
      button: true,
      selected: selected,
      enabled: isActive,
      label: semanticLabel ?? title,
      child: MouseRegion(
        cursor: cursor,
        child: Material(
          color: colors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: radius,
            side: BorderSide(
              color: selected ? colors.primary : colors.outline,
              width: selected ? AppSpacing.borderSelected : AppSpacing.borderThin,
            ),
          ),
          child: InkWell(
            onTap: isActive ? onTap : null,
            borderRadius: radius,
            mouseCursor: cursor,
            hoverColor: Colors.transparent,
            splashColor: Colors.transparent,
            highlightColor: Colors.transparent,
            focusColor: colors.primary.withAlpha(36),
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                minHeight: AppSpacing.minTapTarget,
                minWidth: AppSpacing.minTapTarget,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm + 4,
                ),
                child: _SelectableCardBody(
                  title: title,
                  subtitle: subtitle,
                  selected: selected,
                  isActive: isActive,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SelectableCardBody extends StatelessWidget {
  const _SelectableCardBody({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.isActive,
  });

  final String title;
  final String? subtitle;
  final bool selected;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final TextTheme text = Theme.of(context).textTheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(
                title,
                style: text.bodyMedium?.copyWith(
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: isActive ? colors.onSurface : colors.onSurfaceVariant,
                ),
              ),
              if (subtitle != null && subtitle!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.xs),
                  child: Text(subtitle!, style: text.bodySmall?.copyWith(color: colors.onSurfaceVariant)),
                ),
            ],
          ),
        ),
        if (selected) ...<Widget>[
          const SizedBox(width: AppSpacing.sm),
          Icon(Icons.check, size: 18, color: colors.primary),
          const SizedBox(width: AppSpacing.xs),
          Text(AppStrings.selectedLabel, style: text.labelMedium?.copyWith(color: colors.primary, fontWeight: FontWeight.w700)),
        ],
      ],
    );
  }
}
