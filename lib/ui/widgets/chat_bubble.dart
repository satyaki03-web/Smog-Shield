import 'package:flutter/material.dart';

import '../../core/spacing.dart';
import '../../models/chat_message.dart';

/// Plain-text bordered chat message tile for the Ask tab.
class ChatBubble extends StatelessWidget {
  /// Creates a [ChatBubble] rendering [message] strictly as plain `Text`.
  const ChatBubble({required this.message, super.key});

  /// Chat message data to display.
  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final TextTheme textTheme = Theme.of(context).textTheme;
    final String author = message.isUser
        ? 'You'
        : message.isFallback
            ? 'Smog Shield (Offline guidance)'
            : 'Smog Shield';

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: colors.surface,
          border: Border.all(
            color: message.isUser ? colors.primary : colors.outline,
            width: message.isUser
                ? AppSpacing.borderSelected
                : AppSpacing.borderThin,
          ),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              author,
              style: textTheme.labelMedium?.copyWith(
                color: message.isUser ? colors.primary : colors.secondary,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(message.text, style: textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}
