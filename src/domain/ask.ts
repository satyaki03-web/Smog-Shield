import {
  ASK_CACHE_TTL_MS,
  ASK_MAX_HISTORY_TURNS,
  ASK_MAX_QUESTION_CHARS,
} from '../constants';
import type {
  AirReading,
  AskTurn,
  CachedAskAnswer,
  CompactAskPayload,
  StructuredAdvice,
  UserProfile,
} from '../types';

/** Strips control characters, collapses whitespace, and caps length for client Ask fields. */
export function sanitizeAskText(input: string, maxLen: number): string {
  let cleaned = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    cleaned += code <= 0x1f || code === 0x7f ? ' ' : input[i];
  }
  return cleaned.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

/** Builds a compact, prompt-friendly household summary string without sending full UI plans. */
export function buildCompactProfileSummary(profile: UserProfile): string {
  const members: string[] = [];
  if (profile.adults > 0) members.push(`${profile.adults} adults`);
  if (profile.children > 0) members.push(`${profile.children} children`);
  if (profile.elders > 0) members.push(`${profile.elders} elders`);
  const sens = profile.sensitivities.length > 0 ? profile.sensitivities.join(', ') : 'none';
  const purifier = profile.hasPurifier ? 'has HEPA purifier' : 'no purifier';
  return `ages:${members.join(', ') || '1 adult'}; sensitivities:${sens}; commute:${profile.commute}; fuel:${profile.cookingFuel}; home:${profile.homeType}; purifier:${purifier}`;
}

/** Constructs the bounded JSON payload sent to `POST /api/gemini/ask`. */
export function buildCompactAskPayload(
  question: string,
  reading: Pick<AirReading, 'city' | 'aqi' | 'pm25' | 'pm10'>,
  bandLabel: string,
  profile: UserProfile,
  history: readonly AskTurn[]
): CompactAskPayload {
  const cleanQuestion = sanitizeAskText(question, ASK_MAX_QUESTION_CHARS);
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

/** Parses Gemini's 3-part Smog Shield response into scannable sections with a plain-text fallback. */
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

/** In-memory 10-minute TTL cache keyed by normalized question, AQI band, and profile summary. */
export class AskCache {
  private readonly store = new Map<string, CacheRecord>();
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options?: { ttlMs?: number; now?: () => number }) {
    this.ttlMs = options?.ttlMs ?? ASK_CACHE_TTL_MS;
    this.now = options?.now ?? (() => Date.now());
  }

  /** Builds a deterministic cache key for identical questions under the same band and profile. */
  static makeKey(question: string, bandLabel: string, profileSummary: string): string {
    const q = sanitizeAskText(question, ASK_MAX_QUESTION_CHARS).toLowerCase();
    return `${bandLabel.trim().toLowerCase()}|${profileSummary.trim().toLowerCase()}|${q}`;
  }

  /** Retrieves a fresh cached answer or null if missing/expired. */
  get(key: string): CachedAskAnswer | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  /** Stores a non-empty answer along with the active model identifier. */
  set(key: string, value: CachedAskAnswer): void {
    const clean = value.text.trim();
    if (!clean) return;
    this.store.set(key, {
      value: { text: clean, model: value.model || 'gemini-3.5-flash-lite' },
      expiresAt: this.now() + this.ttlMs,
    });
  }

  /** Clears all cached answers. */
  clear(): void {
    this.store.clear();
  }
}
