import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ASK_MAX_QUESTION_CHARS,
  ASK_MAX_STORED_MESSAGES,
  STORAGE_KEYS,
  SUGGESTED_ASK_QUESTIONS,
} from '../constants';
import {
  AskCache,
  buildCompactAskPayload,
  buildCompactProfileSummary,
  parseStructuredAdvice,
} from '../domain/ask';
import { answerNeighbourQuestion } from '../domain/recommendations';
import { runAskRequest } from '../services/aiService';
import type { AirReading, AskTurn, BandInfo, ChatItem, UserProfile } from '../types';

export interface AskTabProps {
  profile: UserProfile;
  reading: AirReading;
  bandInfo: BandInfo;
}

function makeWelcomeMessage(cityName: string, aqi: number): ChatItem {
  return {
    id: 'welcome',
    sender: 'assistant',
    label: 'Smog Shield',
    text: `Hello neighbour. I am using ${cityName} AQI ${aqi} and your household profile to answer practical questions about masks, ventilation timing, indoor air, or RWA steps.`,
  };
}

function loadStoredAskMessages(cityName: string, aqi: number): ChatItem[] {
  const welcome = makeWelcomeMessage(cityName, aqi);
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEYS.askMessages);
    if (!raw) return [welcome];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [welcome];
    const valid = parsed.filter(
      (item): item is ChatItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as ChatItem).id === 'string' &&
        ((item as ChatItem).sender === 'user' || (item as ChatItem).sender === 'assistant') &&
        typeof (item as ChatItem).text === 'string' &&
        (item as ChatItem).text.trim().length > 0
    );
    if (valid.length === 0) return [welcome];
    const hasWelcome = valid.some((m) => m.id === 'welcome');
    const normalized = hasWelcome
      ? valid.map((m) => (m.id === 'welcome' ? welcome : m))
      : [welcome, ...valid];
    return normalized.slice(-ASK_MAX_STORED_MESSAGES);
  } catch {
    return [welcome];
  }
}

/**
 * Ask Smog Shield tab featuring instant rule-engine Quick Guidance, 10-minute answer caching,
 * strict 15-second client AbortController timeout, live-region progress with Cancel, and
 * sessionStorage thread persistence.
 */
export function AskTab({ profile, reading, bandInfo }: AskTabProps) {
  const [questionInput, setQuestionInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [liveStatus, setLiveStatus] = useState('');
  const askAbortRef = useRef<AbortController | null>(null);
  const askCacheRef = useRef<AskCache>(new AskCache());
  const [messages, setMessages] = useState<ChatItem[]>(() =>
    loadStoredAskMessages(reading.city.name, reading.aqi).filter((m) => m.id !== 'welcome')
  );

  const displayMessages = useMemo(
    () => [makeWelcomeMessage(reading.city.name, reading.aqi), ...messages],
    [messages, reading.city.name, reading.aqi]
  );

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEYS.askMessages,
        JSON.stringify(displayMessages.slice(-ASK_MAX_STORED_MESSAGES))
      );
    } catch {
      // Ignore storage quota or sandbox restrictions
    }
  }, [displayMessages]);

  useEffect(() => {
    return () => {
      askAbortRef.current?.abort();
    };
  }, []);

  const suggestedQuickAnswers = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of SUGGESTED_ASK_QUESTIONS) {
      map.set(q, answerNeighbourQuestion(q, profile, reading));
    }
    return map;
  }, [profile, reading]);

  const cancelAsk = useCallback(() => {
    const activeController = askAbortRef.current;
    askAbortRef.current = null;
    setAsking(false);
    setLiveStatus('Request cancelled. Showing quick guidance.');
    activeController?.abort();
  }, []);

  const clearAskChat = useCallback(() => {
    const activeController = askAbortRef.current;
    askAbortRef.current = null;
    setAsking(false);
    activeController?.abort();
    setMessages([]);
    setLiveStatus('Conversation cleared.');
    try {
      window.sessionStorage.removeItem(STORAGE_KEYS.askMessages);
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  const submitQuestion = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim().slice(0, ASK_MAX_QUESTION_CHARS);
      if (!trimmed || asking) return;

      const nowMs = Date.now();
      const userMsgId = `u-${nowMs}`;
      const quickMsgId = `q-${nowMs + 1}`;
      const geminiMsgId = `a-${nowMs + 2}`;
      const profileSummary = buildCompactProfileSummary(profile);
      const cacheKey = AskCache.makeKey(trimmed, bandInfo.label, profileSummary);
      const cachedAnswer = askCacheRef.current.get(cacheKey);

      setQuestionInput('');

      if (cachedAnswer) {
        setMessages((prev) => [
          ...prev,
          { id: userMsgId, sender: 'user', text: trimmed },
          {
            id: geminiMsgId,
            sender: 'assistant',
            label: 'Smog Shield',
            model: cachedAnswer.model,
            structured: true,
            text: cachedAnswer.text,
            notice: 'Loaded from 10-minute cache.',
          },
        ]);
        setLiveStatus('Loaded personalised answer from 10-minute cache.');
        return;
      }

      const quickAnswer =
        suggestedQuickAnswers.get(trimmed) ?? answerNeighbourQuestion(trimmed, profile, reading);

      const priorHistory: AskTurn[] = [];
      for (const m of messages) {
        if (m.id === 'welcome') continue;
        if (m.sender === 'user') {
          priorHistory.push({ sender: 'user', text: m.text });
        } else if (priorHistory.length > 0) {
          const last = priorHistory[priorHistory.length - 1];
          if (last.sender === 'assistant') {
            priorHistory[priorHistory.length - 1] = { sender: 'assistant', text: m.text };
          } else {
            priorHistory.push({ sender: 'assistant', text: m.text });
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, sender: 'user', text: trimmed },
        { id: quickMsgId, sender: 'assistant', label: 'Quick guidance', text: quickAnswer },
      ]);

      const payload = buildCompactAskPayload(
        trimmed,
        reading,
        bandInfo.label,
        profile,
        priorHistory
      );
      const controller = new AbortController();
      askAbortRef.current = controller;
      setAsking(true);
      setLiveStatus('Getting a personalised answer.');

      try {
        const result = await runAskRequest({
          payload,
          cache: askCacheRef.current,
          signal: controller.signal,
        });

        if ((result.status === 'ok' || result.status === 'cached') && result.text) {
          const responseText = result.text;
          setMessages((prev) => [
            ...prev,
            {
              id: geminiMsgId,
              sender: 'assistant',
              label: 'Smog Shield',
              model: result.model,
              structured: true,
              text: responseText,
              notice: result.status === 'cached' ? 'Loaded from 10-minute cache.' : undefined,
            },
          ]);
          setLiveStatus('Personalised Smog Shield answer ready.');
        } else {
          const noticeText =
            result.notice ?? 'Personalised answer unavailable right now. Showing quick guidance.';
          setMessages((prev) =>
            prev.map((m) => (m.id === quickMsgId ? { ...m, notice: noticeText } : m))
          );
          setLiveStatus(noticeText);
        }
      } catch {
        const fallbackNotice = controller.signal.aborted
          ? 'Request cancelled. Showing quick guidance.'
          : 'Unable to reach Gemini right now. Showing quick guidance.';
        setMessages((prev) =>
          prev.map((m) => (m.id === quickMsgId ? { ...m, notice: fallbackNotice } : m))
        );
        setLiveStatus(fallbackNotice);
      } finally {
        if (askAbortRef.current === controller) {
          askAbortRef.current = null;
        }
        setAsking(false);
      }
    },
    [asking, bandInfo.label, messages, profile, reading, suggestedQuickAnswers]
  );

  return (
    <section className="max-w-3xl mx-auto w-full min-w-0" aria-labelledby="ask-heading">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveStatus}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--ink-muted)' }}
          >
            Calm Neighbour Q&amp;A | Grounded in {reading.city.name} AQI {reading.aqi}
          </p>
          <h1 id="ask-heading" className="text-2xl sm:text-3xl font-editorial font-medium mt-1">
            Ask Smog Shield
          </h1>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={clearAskChat}
            className="min-h-[44px] sm:min-h-[48px] px-3.5 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: 'var(--border-width-card) solid var(--border-subtle)',
              color: 'var(--ink-secondary)',
            }}
          >
            Clear chat
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SUGGESTED_ASK_QUESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={asking}
            onClick={() => void submitQuestion(prompt)}
            className={`min-h-[44px] sm:min-h-[48px] px-3.5 py-2 rounded-[6px] text-sm font-bold text-left break-words ${
              asking ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: 'var(--border-width-card) solid var(--border-subtle)',
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-5 surface-card p-4 sm:p-5 lg:p-6 flex flex-col gap-4 min-h-[260px] w-full min-w-0">
        {displayMessages.map((msg) => {
          const parsed = msg.structured ? parseStructuredAdvice(msg.text) : null;
          return (
            <div
              key={msg.id}
              className={`p-4 rounded-[6px] max-w-full sm:max-w-[92%] break-words min-w-0 ${
                msg.sender === 'user' ? 'self-end' : 'self-start'
              }`}
              style={{
                backgroundColor:
                  msg.sender === 'user'
                    ? 'var(--bg-selected)'
                    : msg.structured
                      ? 'var(--bg-surface)'
                      : 'var(--bg-recessed)',
                border: 'var(--border-width-card) solid var(--border-subtle)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  {msg.sender === 'user' ? 'You' : msg.label ?? 'Smog Shield'}
                </span>
                {msg.model ? (
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded-[4px]"
                    style={{
                      backgroundColor: 'var(--bg-recessed)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    {msg.model}
                  </span>
                ) : null}
              </div>
              {parsed && !parsed.plainFallback ? (
                <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
                  {parsed.tailoredAdvice ? (
                    <div>
                      <div
                        className="text-xs font-bold uppercase tracking-wider mb-0.5"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Tailored Advice
                      </div>
                      <p className="whitespace-pre-line">{parsed.tailoredAdvice}</p>
                    </div>
                  ) : null}
                  {parsed.directImpact ? (
                    <div
                      className="pt-2 border-t"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div
                        className="text-xs font-bold uppercase tracking-wider mb-0.5"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Direct Impact
                      </div>
                      <p className="whitespace-pre-line">{parsed.directImpact}</p>
                    </div>
                  ) : null}
                  {parsed.quickNextStep ? (
                    <div
                      className="pt-2 border-t"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div
                        className="text-xs font-bold uppercase tracking-wider mb-0.5"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Quick Next Step
                      </div>
                      <p className="whitespace-pre-line font-medium">{parsed.quickNextStep}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-[15px] leading-relaxed whitespace-pre-line">{msg.text}</p>
              )}
              {msg.notice ? (
                <p
                  className="text-xs mt-2.5 pt-2 border-t"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-muted)' }}
                >
                  {msg.notice}
                </p>
              ) : null}
            </div>
          );
        })}

        {asking ? (
          <div
            role="status"
            aria-live="polite"
            className="p-4 rounded-[6px] self-start w-full max-w-[440px]"
            style={{
              backgroundColor: 'var(--bg-recessed)',
              border: 'var(--border-width-card) solid var(--border-subtle)',
              color: 'var(--ink-secondary)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">Getting a personalised answer</span>
              <button
                type="button"
                onClick={cancelAsk}
                className="min-h-[48px] px-3.5 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: 'var(--border-width-card) solid var(--border-subtle)',
                  color: 'var(--ink-primary)',
                }}
              >
                Cancel
              </button>
            </div>
            <div
              className="ask-progress-track mt-3"
              role="progressbar"
              aria-label="Getting a personalised answer"
              aria-valuetext="In progress"
            >
              <div className="ask-progress-bar" />
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submitQuestion(questionInput);
        }}
        className="mt-4 flex flex-col sm:flex-row sm:items-start gap-3 w-full min-w-0"
      >
        <div className="flex-1 min-w-0">
          <label htmlFor="ask-input" className="sr-only">
            Ask a question about today&apos;s air quality
          </label>
          <input
            id="ask-input"
            type="text"
            maxLength={ASK_MAX_QUESTION_CHARS}
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="Ask about masks, windows, school play, purifiers, or RWA steps..."
            className="w-full min-h-[48px] px-4 py-2.5 rounded-[6px] text-[15px]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: 'var(--border-width-card) solid var(--border-subtle)',
              color: 'var(--ink-primary)',
            }}
          />
          <div className="text-xs mt-1 tabular-nums" style={{ color: 'var(--ink-muted)' }}>
            {questionInput.length} / {ASK_MAX_QUESTION_CHARS} characters
          </div>
        </div>
        <button
          type="submit"
          disabled={asking}
          className={`w-full sm:w-auto min-h-[48px] h-[48px] px-6 rounded-[6px] font-bold text-[15px] shrink-0 ${
            asking ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--accent-primary-ink)',
          }}
        >
          {asking ? 'Asking...' : 'Ask'}
        </button>
      </form>
    </section>
  );
}
