/// Immutable chat turn displayed on the Ask tab.
class ChatMessage {
  /// Creates an immutable [ChatMessage].
  const ChatMessage({
    required this.id,
    required this.isUser,
    required this.text,
    required this.sentAt,
    this.isFallback = false,
  });

  /// Unique identifier for list keying.
  final String id;

  /// True when authored by the user; false for assistant replies.
  final bool isUser;

  /// Plain-text message content rendered strictly as `Text`.
  final String text;

  /// Timestamp when the message was created.
  final DateTime sentAt;

  /// True when an assistant reply came from the offline fallback service.
  final bool isFallback;

  /// Returns a copy with selectively updated fields.
  ChatMessage copyWith({
    String? id,
    bool? isUser,
    String? text,
    DateTime? sentAt,
    bool? isFallback,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      isUser: isUser ?? this.isUser,
      text: text ?? this.text,
      sentAt: sentAt ?? this.sentAt,
      isFallback: isFallback ?? this.isFallback,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is ChatMessage &&
            id == other.id &&
            isUser == other.isUser &&
            text == other.text &&
            sentAt == other.sentAt &&
            isFallback == other.isFallback;
  }

  @override
  int get hashCode => Object.hash(id, isUser, text, sentAt, isFallback);
}
