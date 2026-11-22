import { ASK_TIMEOUT_MS } from '../constants';
import { AskCache } from '../domain/ask';
import type { AskRunResult, CompactAskPayload, PersonaliseRunResult } from '../types';

const DEFAULT_MODEL_NAME = 'gemini-3.5-flash-lite';

/** Parameters for executing a cached, timeout-bounded Ask Q&A request. */
export interface RunAskOptions {
  /** Compact validated payload containing question, live AQI, profile summary, and recent turns. */
  payload: CompactAskPayload;
  /** Client-side TTL cache instance for identical Ask queries. */
  cache: AskCache;
  /** External AbortSignal used when the user cancels a pending question. */
  signal: AbortSignal;
  /** Overall client timeout in milliseconds before keeping Quick Guidance. */
  timeoutMs?: number;
  /** Optional custom fetch implementation for tests. */
  fetchImpl?: typeof fetch;
  /** Endpoint path override (defaults to `/api/gemini/ask`). */
  endpointUrl?: string;
}

/** Parameters for executing a timeout-bounded Today briefing personalisation request. */
export interface RunPersonaliseOptions {
  /** Verified air quality and household JSON context sent to the server proxy. */
  context: Record<string, unknown>;
  /** Optional AbortSignal for request cancellation. */
  signal?: AbortSignal;
  /** Overall client timeout in milliseconds. */
  timeoutMs?: number;
  /** Optional custom fetch implementation for tests. */
  fetchImpl?: typeof fetch;
  /** Endpoint path override (defaults to `/api/gemini/personalise`). */
  endpointUrl?: string;
}

interface TimedSignalHandle {
  readonly signal: AbortSignal;
  readonly didTimeout: () => boolean;
  readonly cleanup: () => void;
}

function createTimedSignal(timeoutMs: number, externalSignal?: AbortSignal): TimedSignalHandle {
  const controller = new AbortController();
  let timedOut = false;
  const onExternalAbort = (): void => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
  const timerId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timerId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}

function normalizeModelName(rawModel: unknown): string {
  return typeof rawModel === 'string' && rawModel.trim() ? rawModel.trim() : DEFAULT_MODEL_NAME;
}

async function readServerErrorMessage(res: Response): Promise<string> {
  try {
    const errData = (await res.json()) as { error?: unknown };
    return typeof errData?.error === 'string' ? errData.error.trim() : '';
  } catch {
    return '';
  }
}

/**
 * Executes a non-streaming `POST /api/gemini/ask` request with 10-minute caching,
 * strict 15-second client AbortController timeout, and graceful Quick Guidance fallback.
 */
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

  const timed = createTimedSignal(timeoutMs, signal);

  try {
    const res = await fetchImpl(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: timed.signal,
    });

    if (!res.ok) {
      const serverMsg = await readServerErrorMessage(res);
      return {
        status: 'fallback',
        notice: serverMsg
          ? `${serverMsg} Showing quick guidance.`
          : 'Personalised answer unavailable right now. Showing quick guidance.',
      };
    }

    const data = (await res.json()) as { text?: unknown; model?: unknown };
    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    if (!text) {
      return {
        status: 'fallback',
        notice: 'Personalised answer unavailable right now. Showing quick guidance.',
      };
    }

    const model = normalizeModelName(data?.model);
    cache.set(cacheKey, { text, model });
    return { status: 'ok', text, model };
  } catch {
    if (signal.aborted) {
      return { status: 'cancelled', notice: 'Request cancelled. Showing quick guidance.' };
    }
    if (timed.didTimeout()) {
      return {
        status: 'timeout',
        notice: 'Personalised answer timed out after 15s. Showing quick guidance.',
      };
    }
    return {
      status: 'fallback',
      notice: 'Unable to reach Gemini right now. Showing quick guidance.',
    };
  } finally {
    timed.cleanup();
  }
}

/**
 * Calls `POST /api/gemini/personalise` to personalize Today's rule-engine briefing
 * with a strict timeout and safe fallback error message.
 */
export async function runPersonaliseRequest({
  context,
  signal,
  timeoutMs = ASK_TIMEOUT_MS,
  fetchImpl = fetch,
  endpointUrl = '/api/gemini/personalise',
}: RunPersonaliseOptions): Promise<PersonaliseRunResult> {
  const timed = createTimedSignal(timeoutMs, signal);

  try {
    const res = await fetchImpl(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
      signal: timed.signal,
    });
    const data = (await res.json()) as { text?: unknown; model?: unknown; error?: unknown };
    if (!res.ok) {
      const msg =
        typeof data?.error === 'string' && data.error.trim()
          ? data.error.trim()
          : 'Gemini briefing unavailable right now. Showing verified rule-engine summary.';
      return { status: 'error', error: msg };
    }

    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    if (!text) {
      return {
        status: 'error',
        error: 'Gemini returned an empty briefing. Showing verified rule-engine summary.',
      };
    }

    return { status: 'ok', text, model: normalizeModelName(data?.model) };
  } catch {
    return {
      status: 'error',
      error: 'Unable to reach Gemini right now. Showing verified rule-engine summary.',
    };
  } finally {
    timed.cleanup();
  }
}
