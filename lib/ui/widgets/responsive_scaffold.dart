import 'package:flutter/material.dart';

import '../../core/spacing.dart';

/// Responsive shell centering content at max 1100 px with SafeArea protection.
class ResponsiveScaffold extends StatelessWidget {
  /// Creates a [ResponsiveScaffold].
  const ResponsiveScaffold({
    required this.appBar,
    required this.body,
    this.bottomNavigationBar,
    this.navigationRail,
    super.key,
  });

  /// Top application bar.
  final PreferredSizeWidget appBar;

  /// Primary screen body constrained cleanly to [AppSpacing.contentMaxWidth].
  final Widget body;

  /// Optional compact-width bottom navigation widget.
  final Widget? bottomNavigationBar;

  /// Optional wide-screen side navigation rail.
  final Widget? navigationRail;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar,
      bottomNavigationBar: bottomNavigationBar,
      body: SafeArea(
        child: Row(
          children: <Widget>[
            if (navigationRail != null) ...<Widget>[
              navigationRail!,
              const VerticalDivider(width: 1),
            ],
            Expanded(
              child: Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxWidth: AppSpacing.contentMaxWidth,
                  ),
                  child: body,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
