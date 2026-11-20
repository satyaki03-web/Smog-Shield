import type { AirReading, UserProfile } from './smogEngine';

export const ASK_TIMEOUT_MS = 15_000;
export const ASK_CACHE_TTL_MS = 10 * 60 * 1000;
export const ASK_MAX_HISTORY_TURNS = 4;
export const ASK_MAX_PROMPT_CHARS = 2000;

export const SUGGESTED_ASK_QUESTIONS: readonly string[] = [
  'When should we open windows today?',
  'Do cloth masks block winter smog?',
  'Is it safe for children to play outside?',
  'What can our RWA do tonight?',
];

export interface AskTurn {
  sender: 'user' | 'assistant';
  text: string;
}

export interface CompactAskPayload {
  question: string;
  city: string;
  region: string;
  aqi: number;
  band: string;
  pm25: number;
  pm10: number;
  profileSummary: string;
  history: AskTurn[];
}

export interface CachedAskAnswer {
  text: string;
  model: string;
}

export interface StructuredAdvice {
  tailoredAdvice?: string;
  directImpact?: string;
  quickNextStep?: string;
  plainFallback?: string;
}

export function sanitizeAskText(input: string, maxLen: number): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function buildCompactProfileSummary(profile: UserProfile): string {
  const members: string[] = [];
  if (profile.adults > 0) members.push(`${profile.adults} adults`);
  if (profile.children > 0) members.push(`${profile.children} children`);
  if (profile.elders > 0) members.push(`${profile.elders} elders`);
  const sens = profile.sensitivities.length > 0 ? profile.sensitivities.join(', ') : 'none';
  const purifier = profile.hasPurifier ? 'has HEPA purifier' : 'no purifier';
  return `ages:${members.join(', ') || '1 adult'}; sensitivities:${sens}; commute:${profile.commute}; fuel:${profile.cookingFuel}; home:${profile.homeType}; purifier:${purifier}`;
}

export function buildCompactAskPayload(
  question: string,
  reading: Pick<AirReading, 'city' | 'aqi' | 'pm25' | 'pm10'>,
  bandLabel: string,
  profile: UserProfile,
  history: AskTurn[]
): CompactAskPayload {
  const cleanQuestion = sanitizeAskText(question, 500);
  const recentHistory = history
    .slice(-ASK_MAX_HISTORY_TURNS)
    .map((turn) => ({
      sender: turn.sender,
      text: sanitizeAskText(turn.text, 220),
    }))
    .filter((turn) => turn.text.length > 0);

  return {
    question: cleanQuestion,
    city: sanitizeAskText(reading.city.name, 60),
    region: sanitizeAskText(reading.city.region, 60),
    aqi: Math.max(0, Math.round(reading.aqi)),
    band: sanitizeAskText(bandLabel, 30),
    pm25: Math.max(0, Math.round(reading.pm25)),
    pm10: Math.max(0, Math.round(reading.pm10)),
    profileSummary: sanitizeAskText(buildCompactProfileSummary(profile), 260),
    history: recentHistory,
  };
}

export function parseStructuredAdvice(rawText: string): StructuredAdvice {
  const clean = rawText.replace(/\*\*/g, '').trim();
  const extract = (label: string, nextLabels: string[]): string | undefined => {
    const boundary = nextLabels.length > 0 ? `(?=(?:\\n|^)\\s*(?:${nextLabels.join('|')})\\s*:|$)` : '$';
    const rx = new RegExp(`(?:^|\\n)\\s*${label}\\s*:\\s*([\\s\\S]*?)${boundary}`, 'i');
    const match = clean.match(rx);
    return match?.[1]?.trim() || undefined;
  };

  const tailoredAdvice = extract('Tailored Advice', ['Direct Impact', 'Quick Next Step']);
  const directImpact = extract('Direct Impact', ['Quick Next Step']);
  const quickNextStep = extract('Quick Next Step', []);

  if (tailoredAdvice || directImpact || quickNextStep) {
    return { tailoredAdvice, directImpact, quickNextStep };
  }
  return { plainFallback: clean };
}

interface CacheRecord {
  value: CachedAskAnswer;
  expiresAt: number;
}

export class AskCache {
  private readonly store = new Map<string, CacheRecord>();
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options?: { ttlMs?: number; now?: () => number }) {
    this.ttlMs = options?.ttlMs ?? ASK_CACHE_TTL_MS;
    this.now = options?.now ?? (() => Date.now());
  }

  static makeKey(question: string, bandLabel: string, profileSummary: string): string {
    const q = sanitizeAskText(question, 500).toLowerCase();
    return `${bandLabel.trim().toLowerCase()}|${profileSummary.trim().toLowerCase()}|${q}`;
  }

  get(key: string): CachedAskAnswer | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: CachedAskAnswer): void {
    const clean = value.text.trim();
    if (!clean) return;
    this.store.set(key, {
      value: { text: clean, model: value.model || 'gemini-3.5-flash-lite' },
      expiresAt: this.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.store.clear();
  }
}

export interface AskRunResult {
  status: 'ok' | 'cached' | 'timeout' | 'cancelled' | 'fallback';
  text?: string;
  model?: string;
  notice?: string;
}

export interface RunAskOptions {
  payload: CompactAskPayload;
  cache: AskCache;
  signal: AbortSignal;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  endpointUrl?: string;
}

export async function runAskRequest({
  payload,
  cache,
  signal,
  timeoutMs = ASK_TIMEOUT_MS,
  fetchImpl = fetch,
  endpointUrl = '/api/gemini/ask',
}: RunAskOptions): Promise<AskRunResult> {
  const cacheKey = AskCache.makeKey(payload.question, payload.band, payload.profileSummary);
  const cached = cache.get(cacheKey);
  if (cached) {
    return { status: 'cached', text: cached.text, model: cached.model };
  }

  if (signal.aborted) {
    return { status: 'cancelled', notice: 'Request cancelled. Showing quick guidance.' };
  }

  const requestController = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => requestController.abort();
  signal.addEventListener('abort', onExternalAbort, { once: true });
  const timerId = setTimeout(() => {
    timedOut = true;
    requestController.abort();
  }, timeoutMs);

  try {
    const res = await fetchImpl(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: requestController.signal,
    });

    if (!res.ok) {
      let serverMsg = '';
      try {
        const errData = (await res.json()) as { error?: unknown };
        if (typeof errData?.error === 'string' && errData.error.trim()) {
          serverMsg = errData.error.trim();
        }
      } catch {
        // Ignore non-JSON error body
      }
      return {
        status: 'fallback',
        notice: serverMsg
          ? `${serverMsg} Showing quick guidance.`
          : 'Personalised answer unavailable right now. Showing quick guidance.',
      };
    }

    const data = (await res.json()) as { text?: unknown; model?: unknown };
    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    const model = typeof data?.model === 'string' && data.model.trim() ? data.model.trim() : 'gemini-3.5-flash-lite';
    if (!text) {
      return {
        status: 'fallback',
        notice: 'Personalised answer unavailable right now. Showing quick guidance.',
      };
    }

    cache.set(cacheKey, { text, model });
    return { status: 'ok', text, model };
  } catch {
    if (signal.aborted) {
      return { status: 'cancelled', notice: 'Request cancelled. Showing quick guidance.' };
    }
    if (timedOut) {
      return { status: 'timeout', notice: 'Personalised answer timed out after 15s. Showing quick guidance.' };
    }
    return {
      status: 'fallback',
      notice: 'Unable to reach Gemini right now. Showing quick guidance.',
    };
  } finally {
    clearTimeout(timerId);
    signal.removeEventListener('abort', onExternalAbort);
  }
}
