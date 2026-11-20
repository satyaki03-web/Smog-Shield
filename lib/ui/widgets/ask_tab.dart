import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/spacing.dart';
import '../../core/strings.dart';
import '../../models/chat_message.dart';
import 'chat_bubble.dart';
import 'error_notice.dart';
import 'selectable_card.dart';

/// Bounded Q&A tab grounded in the household air quality context.
class AskTab extends StatefulWidget {
  /// Creates an [AskTab].
  const AskTab({
    required this.messages,
    required this.isSending,
    required this.errorMessage,
    required this.onSend,
    super.key,
  });

  /// Bounded list of recent user and assistant messages.
  final List<ChatMessage> messages;

  /// True while awaiting an assistant reply.
  final bool isSending;

  /// Optional inline validation or rate-limit error.
  final String? errorMessage;

  /// Callback sending the sanitized question text.
  final ValueChanged<String> onSend;

  @override
  State<AskTab> createState() => _AskTabState();
}

class _AskTabState extends State<AskTab> {
  final TextEditingController _controller = TextEditingController();

  static const List<String> _prompts = <String>[
    'When is the safest time to open windows today?',
    'What mask should my family wear outdoors?',
    'How can we clean bedroom air on a low budget?',
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final String text = _controller.text;
    widget.onSend(text);
    if (text.trim().isNotEmpty &&
        text.trim().length <= AppConstants.maxChatQuestionLength) {
      _controller.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            DashboardStrings.askHeading,
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: AppSpacing.sm),
          if (widget.messages.isEmpty)
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: _prompts
                  .map(
                    (String p) => SelectableCard(
                      title: p,
                      selected: false,
                      enabled: !widget.isSending,
                      onTap: () => widget.onSend(p),
                    ),
                  )
                  .toList(growable: false),
            ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              itemCount: widget.messages.length,
              itemBuilder: (BuildContext ctx, int i) =>
                  ChatBubble(message: widget.messages[i]),
            ),
          ),
          if (widget.isSending)
            const Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.sm),
              child: Text(AppStrings.loadingAskReply),
            ),
          if (widget.errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: ErrorNotice(message: widget.errorMessage!, isWarning: true),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: TextField(
                  controller: _controller,
                  maxLength: AppConstants.maxChatQuestionLength,
                  maxLines: 2,
                  minLines: 1,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => widget.isSending ? null : _submit(),
                  decoration: const InputDecoration(
                    labelText: DashboardStrings.askInputLabel,
                    helperText: DashboardStrings.askInputHelper,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              FilledButton(
                onPressed: widget.isSending ? null : _submit,
                child: const Text(DashboardStrings.askSendButton),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
