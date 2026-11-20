import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AskCache,
  buildCompactAskPayload,
  buildCompactProfileSummary,
  parseStructuredAdvice,
  runAskRequest,
  SUGGESTED_ASK_QUESTIONS,
} from '../askUtils';
import {
  answerNeighbourQuestion,
  buildPlanSummary,
  buildRecommendations,
  exportPlanMarkdown,
  findTwoHourWindows,
  getAtRiskSummary,
  getBandInfo,
  getCommunityChecklist,
  getVulnerabilityMultiplier,
  type AirReading,
  type Recommendation,
  type ThemeMode,
  type UserProfile,
} from '../smogEngine';
import {
  BandShapeIcon,
  CheckIcon,
  ChecklistIcon,
  CloseIcon,
  CopyIcon,
  RefreshIcon,
  SettingsIcon,
  ShieldMark,
} from './Icons';
import { SelectableCard } from './SelectableCard';

type TabKey = 'today' | 'routine' | 'indoor' | 'swaps' | 'ask';

interface ChatItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  label?: string;
  model?: string;
  structured?: boolean;
  notice?: string;
}

interface DashboardViewProps {
  profile: UserProfile;
  reading: AirReading;
  loading: boolean;
  theme: ThemeMode;
  checkedIds: string[];
  onRefresh: () => void;
  onEditProfile: () => void;
  onThemeChange: (mode: ThemeMode) => void;
  onToggleChecklist: (id: string) => void;
  onClearAllData: () => void;
}

const QUICK_PROMPTS = SUGGESTED_ASK_QUESTIONS;
const ASK_STORAGE_KEY = 'smog_shield_ask_messages_v1';

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
    const raw = window.sessionStorage.getItem(ASK_STORAGE_KEY);
    if (!raw) return [welcome];
    const parsed = JSON.parse(raw) as unknown;
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
    return normalized.slice(-30);
  } catch {
    return [welcome];
  }
}

function RecommendationRow({ item, index }: { item: Recommendation; index: number }) {
  const [showBasis, setShowBasis] = useState(false);

  return (
    <article
      className="surface-card p-5 sm:p-6"
      aria-label={`${index + 1}. ${item.title}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-bold uppercase tracking-widest tabular-nums" style={{ color: 'var(--ink-muted)' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="text-xl font-editorial font-medium">{item.title}</h3>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
          {item.timingOrCost}
        </span>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--ink-primary)' }}>
        {item.action}
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
            Personal exposure impact
          </p>
          <p className="text-sm mt-1 leading-snug" style={{ color: 'var(--ink-secondary)' }}>
            {item.exposureImpact}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-clay)' }}>
            City emissions impact
          </p>
          <p className="text-sm mt-1 leading-snug" style={{ color: 'var(--ink-secondary)' }}>
            {item.emissionsImpact}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowBasis((v) => !v)}
          aria-expanded={showBasis}
          className="min-h-[48px] text-xs font-bold uppercase tracking-wider underline underline-offset-4 cursor-pointer py-2 px-1 inline-flex items-center"
          style={{ color: 'var(--ink-muted)' }}
        >
          {showBasis ? 'Hide basis' : 'How we estimated this'}
        </button>
        {showBasis ? (
          <p className="mt-2 text-xs leading-relaxed p-3 rounded-[4px]" style={{ backgroundColor: 'var(--bg-recessed)', color: 'var(--ink-secondary)' }}>
            {item.basis}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function DashboardView({
  profile,
  reading,
  loading,
  theme,
  checkedIds,
  onRefresh,
  onEditProfile,
  onThemeChange,
  onToggleChecklist,
  onClearAllData,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [geminiSummary, setGeminiSummary] = useState<string | null>(null);
  const [geminiModel, setGeminiModel] = useState<string | null>(null);
  const [personalizing, setPersonalizing] = useState(false);
  const [personalizeError, setPersonalizeError] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [asking, setAsking] = useState(false);
  const askAbortRef = useRef<AbortController | null>(null);
  const askCacheRef = useRef<AskCache>(new AskCache());
  const [messages, setMessages] = useState<ChatItem[]>(() =>
    loadStoredAskMessages(reading.city.name, reading.aqi)
  );

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === 'welcome' ? makeWelcomeMessage(reading.city.name, reading.aqi) : m))
    );
  }, [reading.city.name, reading.aqi]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(ASK_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Ignore storage quota or sandbox restrictions
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      askAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!showChecklistModal && !showSettingsModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowChecklistModal(false);
        setShowSettingsModal(false);
        setConfirmClear(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showChecklistModal, showSettingsModal]);

  const bandInfo = useMemo(() => getBandInfo(reading.aqi), [reading.aqi]);
  const windows = useMemo(() => findTwoHourWindows(reading.hourly), [reading.hourly]);
  const recs = useMemo(() => buildRecommendations(profile, reading), [profile, reading]);
  const atRisk = useMemo(() => getAtRiskSummary(profile, bandInfo.band), [profile, bandInfo.band]);
  const multiplier = useMemo(() => getVulnerabilityMultiplier(profile), [profile]);
  const checklist = useMemo(() => getCommunityChecklist(bandInfo.band), [bandInfo.band]);
  const ruleEngineSummary = useMemo(
    () => buildPlanSummary(profile, reading, false),
    [profile, reading]
  );

  const aiContext = useMemo(
    () => ({
      city: reading.city.name,
      region: reading.city.region,
      aqi: reading.aqi,
      band: bandInfo.label,
      pm25: reading.pm25,
      pm10: reading.pm10,
      source: reading.source,
      cleanestWindow: windows.cleanest,
      worstWindow: windows.worst,
      household: {
        adults: profile.adults,
        children: profile.children,
        elders: profile.elders,
        sensitivities: profile.sensitivities,
        commute: profile.commute,
        cookingFuel: profile.cookingFuel,
        homeType: profile.homeType,
        hasPurifier: profile.hasPurifier,
        budget: profile.budget,
      },
    }),
    [reading, bandInfo.label, windows, profile]
  );

  const showNotice = (msg: string) => {
    setCopiedNotice(msg);
    window.setTimeout(() => setCopiedNotice(null), 3000);
  };

  const handlePersonalize = async () => {
    if (geminiSummary) {
      setGeminiSummary(null);
      setPersonalizeError(null);
      return;
    }
    setPersonalizing(true);
    setPersonalizeError(null);
    try {
      const res = await fetch('/api/gemini/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: aiContext }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPersonalizeError(data?.error || 'Could not personalize wording right now.');
        return;
      }
      setGeminiSummary(data.text);
      setGeminiModel(data.model ?? 'gemini-4-hydrogen');
    } catch {
      setPersonalizeError('Network error reaching the Smog Shield server.');
    } finally {
      setPersonalizing(false);
    }
  };

  const handleCopyPlan = async () => {
    const md = exportPlanMarkdown(profile, reading);
    try {
      await navigator.clipboard.writeText(md);
      showNotice('Daily plan copied as Markdown.');
    } catch {
      showNotice('Could not access clipboard in this preview frame.');
    }
  };

  const handleCopyChecklist = async () => {
    const lines = [
      `# Smog Shield Community Checklist (${reading.city.name}, AQI ${reading.aqi})`,
      ...checklist.map((item) => `- [${checkedIds.includes(item.id) ? 'x' : ' '}] (${item.group}) ${item.text}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showNotice('Community checklist copied.');
    } catch {
      showNotice('Could not access clipboard in this preview frame.');
    }
  };

  const suggestedQuickAnswers = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of QUICK_PROMPTS) {
      map.set(q, answerNeighbourQuestion(q, profile, reading));
    }
    return map;
  }, [profile, reading]);

  const cancelAsk = () => {
    const activeController = askAbortRef.current;
    askAbortRef.current = null;
    setAsking(false);
    activeController?.abort();
  };

  const clearAskChat = () => {
    const activeController = askAbortRef.current;
    askAbortRef.current = null;
    setAsking(false);
    activeController?.abort();
    const fresh = [makeWelcomeMessage(reading.city.name, reading.aqi)];
    setMessages(fresh);
    try {
      window.sessionStorage.removeItem(ASK_STORAGE_KEY);
    } catch {
      // Ignore storage restrictions
    }
  };

  const submitQuestion = async (rawText: string) => {
    const trimmed = rawText.trim().slice(0, 500);
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
      return;
    }

    const quickAnswer = suggestedQuickAnswers.get(trimmed) ?? answerNeighbourQuestion(trimmed, profile, reading);
    // Build clean alternating Q&A history (keeps latest assistant reply per user turn for follow-ups).
    const priorHistory: Array<{ sender: 'user' | 'assistant'; text: string }> = [];
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

    const payload = buildCompactAskPayload(trimmed, reading, bandInfo.label, profile, priorHistory);
    const controller = new AbortController();
    askAbortRef.current = controller;
    setAsking(true);

    try {
      const result = await runAskRequest({
        payload,
        cache: askCacheRef.current,
        signal: controller.signal,
      });

      if ((result.status === 'ok' || result.status === 'cached') && result.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: geminiMsgId,
            sender: 'assistant',
            label: 'Smog Shield',
            model: result.model,
            structured: true,
            text: result.text!,
            notice: result.status === 'cached' ? 'Loaded from 10-minute cache.' : undefined,
          },
        ]);
      } else {
        const noticeText = result.notice ?? 'Personalised answer unavailable right now. Showing quick guidance.';
        setMessages((prev) =>
          prev.map((m) => (m.id === quickMsgId ? { ...m, notice: noticeText } : m))
        );
      }
    } catch {
      const fallbackNotice = controller.signal.aborted
        ? 'Request cancelled. Showing quick guidance.'
        : 'Unable to reach Gemini right now. Showing quick guidance.';
      setMessages((prev) =>
        prev.map((m) => (m.id === quickMsgId ? { ...m, notice: fallbackNotice } : m))
      );
    } finally {
      if (askAbortRef.current === controller) {
        askAbortRef.current = null;
      }
      setAsking(false);
    }
  };

  const maxHourlyAqi = Math.max(100, ...reading.hourly.map((h) => h.aqi));
  const fetchedTimeLabel = new Date(reading.fetchedAtIso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'routine', label: 'Routine' },
    { key: 'indoor', label: 'Indoor Air' },
    { key: 'swaps', label: 'Swaps' },
    { key: 'ask', label: 'Ask' },
  ];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <header
        className="sticky top-0 z-20 border-b"
        style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span style={{ color: 'var(--accent-primary)' }}>
                <ShieldMark className="w-7 h-7" />
              </span>
              <div className="min-w-0">
                <div className="font-editorial text-xl font-semibold leading-none">Smog Shield</div>
                <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--ink-muted)' }}>
                  {reading.city.name} | {reading.city.region}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onEditProfile}
                className="min-h-[48px] px-3.5 py-2 rounded-[6px] text-sm font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: 'var(--border-width-card) solid var(--border-subtle)',
                }}
              >
                Household
              </button>
              <button
                type="button"
                onClick={() => setShowChecklistModal(true)}
                className="min-h-[48px] px-3.5 py-2 rounded-[6px] text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: 'var(--border-width-card) solid var(--border-subtle)',
                }}
              >
                <ChecklistIcon className="w-4 h-4" />
                <span>Checklist</span>
              </button>
              <button
                type="button"
                aria-label="Open settings"
                onClick={() => {
                  setConfirmClear(false);
                  setShowSettingsModal(true);
                }}
                className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-[6px] text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: 'var(--border-width-card) solid var(--border-subtle)',
                }}
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>

          <nav aria-label="Primary sections" className="flex overflow-x-auto gap-1 -mb-px">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setActiveTab(tab.key)}
                  className="min-h-[48px] px-4 text-[15px] font-bold whitespace-nowrap cursor-pointer border-b-2"
                  style={{
                    borderBottomColor: active ? 'var(--accent-primary)' : 'transparent',
                    color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {copiedNotice ? (
        <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 pt-4">
          <div
            role="status"
            aria-live="polite"
            className="px-4 py-2.5 rounded-[6px] text-sm font-bold inline-flex items-center gap-2"
            style={{
              backgroundColor: 'var(--bg-selected)',
              border: '1px solid var(--border-strong)',
              color: 'var(--accent-primary)',
            }}
          >
            <CheckIcon className="w-4 h-4" />
            <span>{copiedNotice}</span>
          </div>
        </div>
      ) : null}

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'today' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
              <section className="surface-card p-6 sm:p-7" aria-label="Current Air Quality">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                    {reading.source === 'live'
                      ? `Live Open-Meteo | Updated ${fetchedTimeLabel}`
                      : reading.source === 'manual'
                      ? `Manual AQI Override | ${fetchedTimeLabel}`
                      : `Offline Seasonal Baseline | ${fetchedTimeLabel}`}
                  </p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onRefresh}
                    className={`min-h-[48px] px-3.5 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                      loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-recessed)',
                      border: 'var(--border-width-card) solid var(--border-subtle)',
                    }}
                  >
                    <RefreshIcon className="w-3.5 h-3.5" />
                    <span>{loading ? 'Updating...' : 'Refresh'}</span>
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <div
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
                      style={{ color: bandInfo.cssVar }}
                    >
                      <BandShapeIcon shape={bandInfo.shape} className="w-5 h-5" />
                      <span>
                        {bandInfo.label} ({bandInfo.rangeLabel})
                      </span>
                    </div>
                    <div
                      className="mt-2 flex items-baseline gap-3"
                      aria-label={`Air quality index ${reading.aqi}, ${bandInfo.label}`}
                    >
                      <span
                        className="font-editorial text-6xl sm:text-7xl font-medium leading-none tabular-nums"
                        style={{ color: bandInfo.cssVar }}
                      >
                        {reading.aqi}
                      </span>
                      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                        AQI
                      </span>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                        PM2.5
                      </dt>
                      <dd className="text-2xl font-bold tabular-nums mt-0.5">
                        {reading.pm25} <span className="text-xs font-normal">ug/m3</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                        PM10
                      </dt>
                      <dd className="text-2xl font-bold tabular-nums mt-0.5">
                        {reading.pm10} <span className="text-xs font-normal">ug/m3</span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <p className="mt-4 text-[15px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                  {bandInfo.summary}
                </p>

                <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-baseline justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                      Next 24 Hours (Hourly AQI Profile)
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--ink-muted)' }}>
                      Peak {maxHourlyAqi}
                    </span>
                  </div>
                  <div
                    className="flex items-end gap-1 h-24 pt-2"
                    role="img"
                    aria-label={`24-hour AQI forecast ranging from ${Math.min(...reading.hourly.map((h) => h.aqi))} to ${Math.max(...reading.hourly.map((h) => h.aqi))}`}
                  >
                    {reading.hourly.slice(0, 24).map((pt, idx) => {
                      const pct = Math.max(12, Math.round((pt.aqi / maxHourlyAqi) * 100));
                      const ptBand = getBandInfo(pt.aqi);
                      return (
                        <div
                          key={`${pt.timeIso}-${idx}`}
                          title={`${pt.hourLabel}: AQI ${pt.aqi} (${ptBand.label})`}
                          className="flex-1 flex flex-col justify-end h-full"
                        >
                          <div
                            className="w-full rounded-t-[2px]"
                            style={{
                              height: `${pct}%`,
                              backgroundColor: ptBand.cssVar,
                              opacity: 0.86,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[11px] mt-1.5 tabular-nums" style={{ color: 'var(--ink-muted)' }}>
                    <span>{reading.hourly[0]?.hourLabel ?? 'Now'}</span>
                    <span>{reading.hourly[8]?.hourLabel ?? '+8h'}</span>
                    <span>{reading.hourly[16]?.hourLabel ?? '+16h'}</span>
                    <span>{reading.hourly[reading.hourly.length - 1]?.hourLabel ?? '+24h'}</span>
                  </div>
                </div>
              </section>

              <section className="surface-card p-6" aria-label="Daily Briefing">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                    {geminiSummary
                      ? `Gemini Personalized Briefing (${geminiModel ?? 'gemini-4-hydrogen'})`
                      : 'Rule-Engine Summary'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={personalizing}
                      onClick={() => void handlePersonalize()}
                      className={`min-h-[48px] px-3.5 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider ${
                        personalizing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      }`}
                      style={{
                        backgroundColor: geminiSummary ? 'var(--bg-selected)' : 'var(--bg-recessed)',
                        border: geminiSummary
                          ? '2px solid var(--border-strong)'
                          : 'var(--border-width-card) solid var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    >
                      {personalizing
                        ? 'Personalizing...'
                        : geminiSummary
                        ? 'Standard summary'
                        : 'Personalize wording'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPlan}
                      className="min-h-[48px] px-3.5 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--accent-primary-ink)',
                      }}
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                      <span>Copy Plan</span>
                    </button>
                  </div>
                </div>
                {personalizeError ? (
                  <div
                    role="alert"
                    className="mt-3 p-3 rounded-[6px] text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--bg-recessed)',
                      border: '1px solid var(--accent-clay)',
                      color: 'var(--accent-clay)',
                    }}
                  >
                    {personalizeError}
                  </div>
                ) : null}
                <p className="font-editorial text-xl sm:text-[22px] leading-relaxed mt-4">
                  {geminiSummary ?? ruleEngineSummary}
                </p>
              </section>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <section className="surface-card p-5 sm:p-6" aria-label="Ventilation and Exposure Windows">
                <h2 className="text-xl font-editorial font-medium pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  Timing windows today
                </h2>
                <div className="mt-4 flex flex-col gap-4">
                  <div className="recessed-panel p-4">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                      Cleanest 2-hour window
                    </p>
                    <p className="text-lg font-bold mt-1 tabular-nums">
                      {windows.cleanest ? `${windows.cleanest.startLabel} to ${windows.cleanest.endLabel}` : '1:00 PM to 3:00 PM'}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
                      Avg AQI <strong className="tabular-nums">{windows.cleanest?.averageAqi ?? reading.aqi}</strong>. Best time for brief cross-ventilation and essential errands.
                    </p>
                  </div>

                  <div className="recessed-panel p-4">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-clay)' }}>
                      Peak smog window to avoid
                    </p>
                    <p className="text-lg font-bold mt-1 tabular-nums">
                      {windows.worst ? `${windows.worst.startLabel} to ${windows.worst.endLabel}` : '6:00 AM to 8:00 AM'}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
                      Avg AQI <strong className="tabular-nums">{windows.worst?.averageAqi ?? reading.aqi}</strong>. Keep windows sealed and move exercise indoors.
                    </p>
                  </div>
                </div>
              </section>

              <section className="surface-card p-5 sm:p-6" aria-label="Household Risk Profile">
                <div className="flex items-baseline justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h2 className="text-xl font-editorial font-medium">Who is most affected</h2>
                  <span className="text-xs font-bold uppercase tracking-wider tabular-nums" style={{ color: 'var(--accent-clay)' }}>
                    {multiplier}x sensitivity
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--ink-secondary)' }}>
                  {atRisk.map((line) => (
                    <li key={line} className="leading-snug">
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 pt-3 border-t text-sm font-bold" style={{ borderColor: 'var(--border-subtle)' }}>
                  Mask rule: <span className="font-normal" style={{ color: 'var(--ink-secondary)' }}>{bandInfo.maskGuidance}</span>
                </p>
              </section>

              <section className="surface-card p-5 sm:p-6" aria-label="Top Immediate Actions">
                <h2 className="text-xl font-editorial font-medium pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  Top 3 actions right now
                </h2>
                <ol className="mt-3 divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {[recs.routine[0], recs.indoor[0], recs.swaps[0]].map((rec, i) => (
                    <li key={rec.id} className="py-2 first:pt-1 last:pb-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab(rec.category === 'routine' ? 'routine' : rec.category === 'indoor' ? 'indoor' : 'swaps')}
                        className="w-full min-h-[48px] py-1.5 text-left cursor-pointer"
                      >
                        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                          0{i + 1} | {rec.category === 'indoor' ? 'Indoor Air' : rec.category === 'routine' ? 'Daily Routine' : 'Low-Emission Swap'}
                        </div>
                        <div className="font-bold text-[15px] mt-0.5">{rec.title}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--ink-secondary)' }}>
                          {rec.exposureImpact}
                        </div>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        ) : null}

        {activeTab === 'routine' ? (
          <section className="max-w-[820px]">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
              Ranked for {reading.city.name} at AQI {reading.aqi} ({bandInfo.label})
            </p>
            <h1 className="text-3xl font-editorial font-medium mt-1">Low-emission daily routine</h1>
            <div className="mt-5 flex flex-col gap-4">
              {recs.routine.map((item, i) => (
                <RecommendationRow key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'indoor' ? (
          <section className="max-w-[820px]">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
              Indoor Air Quality Actions
            </p>
            <h1 className="text-3xl font-editorial font-medium mt-1">Keep indoor PM2.5 low on a budget</h1>
            <div className="mt-5 flex flex-col gap-4">
              {recs.indoor.map((item, i) => (
                <RecommendationRow key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'swaps' ? (
          <section className="max-w-[820px]">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
              Sustainable Alternatives
            </p>
            <h1 className="text-3xl font-editorial font-medium mt-1">Cut both exposure and city emissions</h1>
            <div className="mt-5 flex flex-col gap-4">
              {recs.swaps.map((item, i) => (
                <RecommendationRow key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'ask' ? (
          <section className="max-w-[820px]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                  Calm Neighbour Q&amp;A | Grounded in {reading.city.name} AQI {reading.aqi}
                </p>
                <h1 className="text-3xl font-editorial font-medium mt-1">Ask Smog Shield</h1>
              </div>
              {messages.length > 1 ? (
                <button
                  type="button"
                  onClick={clearAskChat}
                  className="min-h-[48px] px-3.5 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer"
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

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={asking}
                  onClick={() => void submitQuestion(prompt)}
                  className={`min-h-[48px] px-3.5 py-2 rounded-[6px] text-sm font-bold text-left ${
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

            <div className="mt-5 surface-card p-5 flex flex-col gap-4 min-h-[260px]">
              {messages.map((msg) => {
                const parsed = msg.structured ? parseStructuredAdvice(msg.text) : null;
                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-[6px] max-w-full sm:max-w-[92%] break-words min-w-0 ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}
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
                          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
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
                          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
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
              className="mt-4 flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1">
                <label htmlFor="ask-input" className="sr-only">
                  Ask a question about today's air quality
                </label>
                <input
                  id="ask-input"
                  type="text"
                  maxLength={500}
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
                  {questionInput.length} / 500 characters
                </div>
              </div>
              <button
                type="submit"
                disabled={asking}
                className={`min-h-[48px] h-[48px] px-6 rounded-[6px] font-bold text-[15px] ${
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
        ) : null}
      </main>

      <footer className="border-t py-5" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
          <strong>Medical disclaimer:</strong> Smog Shield provides general environmental estimates and public-health guidance, not personal medical advice. Consult a qualified doctor for wheezing, chest pain, or worsening asthma symptoms. Air quality data from Open-Meteo (CC BY 4.0) mapped to CPCB AQI bands.
        </div>
      </footer>

      {showChecklistModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Community and RWA Checklist"
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 22, 19, 0.65)' }}
        >
          <div className="surface-card w-full max-w-[620px] max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                  Community Action | {reading.city.name} ({bandInfo.label})
                </p>
                <h2 className="text-2xl font-editorial font-medium mt-1">RWA, School, and Home Checklist</h2>
              </div>
              <button
                type="button"
                aria-label="Close checklist"
                onClick={() => setShowChecklistModal(false)}
                className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-[6px] cursor-pointer shrink-0"
                style={{ border: 'var(--border-width-card) solid var(--border-subtle)' }}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {checklist.map((item) => {
                const checked = checkedIds.includes(item.id);
                return (
                  <SelectableCard
                    key={item.id}
                    label={`${item.group}: ${item.text}`}
                    selected={checked}
                    onSelect={() => onToggleChecklist(item.id)}
                  />
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink-secondary)' }}>
                {checklist.filter((c) => checkedIds.includes(c.id)).length} of {checklist.length} completed
              </span>
              <button
                type="button"
                onClick={handleCopyChecklist}
                className="min-h-[48px] px-4 py-2 rounded-[6px] text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-ink)',
                }}
              >
                <CopyIcon className="w-4 h-4" />
                <span>Copy Checklist</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSettingsModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 22, 19, 0.65)' }}
        >
          <div className="surface-card w-full max-w-[560px] max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                  Preferences
                </p>
                <h2 className="text-2xl font-editorial font-medium mt-1">Smog Shield Settings</h2>
              </div>
              <button
                type="button"
                aria-label="Close settings"
                onClick={() => setShowSettingsModal(false)}
                className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-[6px] cursor-pointer shrink-0"
                style={{ border: 'var(--border-width-card) solid var(--border-subtle)' }}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-5">
              <h3 className="text-lg font-editorial font-medium mb-3">Display theme</h3>
              <div className="flex flex-col gap-2.5">
                <SelectableCard
                  label="Warm Paper (Light)"
                  description="Calm daylight palette designed for extended reading"
                  selected={theme === 'light'}
                  onSelect={() => onThemeChange('light')}
                />
                <SelectableCard
                  label="Night Slate (Dark)"
                  description="Low-glare dark surfaces for evening air checks"
                  selected={theme === 'dark'}
                  onSelect={() => onThemeChange('dark')}
                />
                <SelectableCard
                  label="High Contrast"
                  description="Maximum contrast ink and 2px borders for low-vision clarity"
                  selected={theme === 'high-contrast'}
                  onSelect={() => onThemeChange('high-contrast')}
                />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-lg font-editorial font-medium mb-2">Data sources and privacy</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                Live hourly AQI, PM2.5, and PM10 readings are fetched from the keyless Open-Meteo Air Quality API and mapped to CPCB India AQI bands. Your household profile and checklist stay locally on your device.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  onEditProfile();
                }}
                className="min-h-[48px] px-4 py-2 rounded-[6px] text-sm font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-recessed)',
                  border: 'var(--border-width-card) solid var(--border-subtle)',
                }}
              >
                Edit Household Profile
              </button>

              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="min-h-[48px] px-4 py-2 rounded-[6px] text-sm font-bold cursor-pointer"
                  style={{
                    border: 'var(--border-width-card) solid var(--accent-clay)',
                    color: 'var(--accent-clay)',
                  }}
                >
                  Clear My Data
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="min-h-[48px] px-3.5 py-2 rounded-[6px] text-sm font-bold cursor-pointer"
                    style={{ border: 'var(--border-width-card) solid var(--border-subtle)' }}
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      askAbortRef.current?.abort();
                      askAbortRef.current = null;
                      askCacheRef.current.clear();
                      setAsking(false);
                      setGeminiSummary(null);
                      setPersonalizeError(null);
                      setMessages([makeWelcomeMessage(reading.city.name, reading.aqi)]);
                      onClearAllData();
                      setConfirmClear(false);
                      setShowSettingsModal(false);
                    }}
                    className="min-h-[48px] px-4 py-2 rounded-[6px] text-sm font-bold cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent-clay)',
                      color: '#FFFFFF',
                    }}
                  >
                    Confirm Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
