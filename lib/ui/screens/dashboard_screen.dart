import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/air_context.dart';
import '../../models/enums.dart';
import '../../services/plan_exporter.dart';
import '../../state/air_controller.dart';
import '../../state/chat_controller.dart';
import '../../state/plan_controller.dart';
import '../../state/profile_controller.dart';
import '../widgets/ask_tab.dart';
import '../widgets/community_checklist_sheet.dart';
import '../widgets/indoor_tab.dart';
import '../widgets/responsive_scaffold.dart';
import '../widgets/routine_tab.dart';
import '../widgets/settings_sheet.dart';
import '../widgets/swaps_tab.dart';
import '../widgets/today_tab.dart';

/// Main responsive dashboard hosting Today, Routine, Indoor Air, Swaps, and Ask.
class DashboardScreen extends StatefulWidget {
  /// Creates a [DashboardScreen].
  const DashboardScreen({required this.onEditProfile, super.key});

  /// Navigates back to the profile setup screen.
  final VoidCallback onEditProfile;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const List<String> _tabs = <String>[
    DashboardStrings.tabToday,
    DashboardStrings.tabRoutine,
    DashboardStrings.tabIndoor,
    DashboardStrings.tabSwaps,
    DashboardStrings.tabAsk,
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && context.read<PlanController>().context == null) {
        _refreshAir(forceRefresh: false);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _refreshAir({bool forceRefresh = true}) async {
    final ProfileController profile = context.read<ProfileController>();
    final AirController air = context.read<AirController>();
    final PlanController plan = context.read<PlanController>();
    await air.loadForProfile(profile.profile, forceRefresh: forceRefresh);
    if (air.reading != null) {
      await plan.rebuildDeterministic(
        profile: profile.profile,
        reading: air.reading!,
        hourlyPoints: air.hourlyPoints,
      );
    }
  }

  Future<void> _export(AirContext ctx, {required bool share}) async {
    final String md = PlanExporter.toMarkdown(ctx, narrative: context.read<PlanController>().narrative);
    if (share) {
      await Share.share(md, subject: 'Smog Shield Plan: ${ctx.reading.cityName}');
      return;
    }
    await Clipboard.setData(ClipboardData(text: md));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text(DashboardStrings.copiedPlanMessage)));
    }
  }

  void _openSheet(Widget sheet) => showModalBottomSheet<void>(context: context, isScrollControlled: true, builder: (_) => sheet);

  @override
  Widget build(BuildContext context) {
    final AirController air = context.watch<AirController>();
    final PlanController plan = context.watch<PlanController>();
    final ChatController chat = context.watch<ChatController>();
    final AirContext? ctx = plan.context;
    final bool compact =
        MediaQuery.sizeOf(context).width < AppSpacing.compactBreakpoint;
    return ResponsiveScaffold(
      appBar: AppBar(
        title: const Text(AppStrings.appTitle),
        actions: <Widget>[
          IconButton(
            tooltip: DashboardStrings.settingsTitle,
            onPressed: () => _openSheet(SettingsSheet(onEditProfile: widget.onEditProfile)),
            icon: const Icon(Icons.tune),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: compact,
          tabAlignment: compact ? TabAlignment.start : TabAlignment.center,
          tabs: _tabs.map((String label) => Tab(text: label)).toList(),
        ),
      ),
      body: ctx == null
          ? const Center(child: Text(AppStrings.loadingAirData))
          : TabBarView(
              controller: _tabController,
              children: <Widget>[
                TodayTab(
                  airContext: ctx,
                  narrative: plan.narrative,
                  isLoadingAir: air.isLoading,
                  isPersonalizing: plan.isPersonalizing,
                  airErrorMessage: air.error?.userMessage,
                  aiErrorMessage: plan.aiError?.userMessage,
                  onRefreshAir: () => _refreshAir(forceRefresh: true),
                  onPersonalizeAi: plan.personalizeWithAi,
                  onCopyPlan: () => _export(ctx, share: false),
                  onSharePlan: () => _export(ctx, share: true),
                  onOpenChecklist: () => _openSheet(CommunityChecklistSheet(band: ctx.bandInfo.band)),
                ),
                RoutineTab(items: ctx.byCategory(RecommendationCategory.routine)),
                IndoorTab(items: ctx.byCategory(RecommendationCategory.indoor)),
                SwapsTab(items: ctx.byCategory(RecommendationCategory.swap)),
                AskTab(messages: chat.messages, isSending: chat.isSending, errorMessage: chat.error?.userMessage, onSend: (String q) => chat.ask(ctx, q)),
              ],
            ),
    );
  }
}
