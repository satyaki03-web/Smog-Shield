import 'package:flutter/foundation.dart';

import '../core/app_error.dart';
import '../core/constants.dart';
import '../core/result.dart';
import '../models/air_context.dart';
import '../models/chat_message.dart';
import '../services/ai_service.dart';
import '../services/resilient_ai_service.dart';
import '../validation/input_validator.dart';

/// Manages bounded Q&A chat history on the Ask tab.
class ChatController extends ChangeNotifier {
  /// Creates a [ChatController] with an injected [AiService] and clock.
  ChatController({
    required AiService aiService,
    DateTime Function()? now,
  })  : _aiService = aiService,
        _now = now ?? DateTime.now;

  final AiService _aiService;
  final DateTime Function() _now;

  final List<ChatMessage> _messages = <ChatMessage>[];
  bool _isSending = false;
  AppError? _error;
  int _counter = 0;

  /// Unmodifiable list of recent chat turns (bounded to [AppConstants.maxChatHistory]).
  List<ChatMessage> get messages => List<ChatMessage>.unmodifiable(_messages);

  /// True while waiting for an assistant reply.
  bool get isSending => _isSending;

  /// Latest validation or rate-limit error, if any.
  AppError? get error => _error;

  /// Validates and sends [rawQuestion] grounded in [context].
  Future<void> ask(AirContext context, String rawQuestion) async {
    final Result<String> validated =
        InputValidator.validateChatQuestion(rawQuestion);
    if (validated.isFailure) {
      _error = validated.errorOrNull;
      notifyListeners();
      return;
    }

    final String question = validated.valueOrNull!;
    _error = null;
    _appendMessage(
      ChatMessage(
        id: 'u_${++_counter}',
        isUser: true,
        text: question,
        sentAt: _now(),
      ),
    );
    _isSending = true;
    notifyListeners();

    final Result<({String text, bool isFallback})> reply =
        await _dispatchQuestion(context, question);

    reply.fold(
      onSuccess: (({String text, bool isFallback}) data) {
        _appendMessage(
          ChatMessage(
            id: 'a_${++_counter}',
            isUser: false,
            text: data.text,
            sentAt: _now(),
            isFallback: data.isFallback,
          ),
        );
      },
      onFailure: (AppError err) => _error = err,
    );

    _isSending = false;
    notifyListeners();
  }

  /// Clears all messages and transient error state.
  void clearHistory() {
    _messages.clear();
    _error = null;
    notifyListeners();
  }

  Future<Result<({String text, bool isFallback})>> _dispatchQuestion(
    AirContext context,
    String question,
  ) async {
    final AiService service = _aiService;
    if (service is ResilientAiService) {
      return service.askWithSource(context, question);
    }
    final Result<String> result = await service.askAssistant(context, question);
    return result.fold(
      onFailure: Failure<({String text, bool isFallback})>.new,
      onSuccess: (String text) => Success<({String text, bool isFallback})>(
        (text: text, isFallback: false),
      ),
    );
  }

  void _appendMessage(ChatMessage message) {
    _messages.add(message);
    while (_messages.length > AppConstants.maxChatHistory) {
      _messages.removeAt(0);
    }
  }
}
