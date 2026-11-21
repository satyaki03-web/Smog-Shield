import { ASK_TIMEOUT_MS } from '../constants';
import { AskCache } from '../domain/ask';
import type { AskRunResult, CompactAskPayload, PersonaliseRunResult } from '../types';

export interface RunAskOptions {
  payload: CompactAskPayload;
  cache: AskCache;
  signal: AbortSignal;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  endpointUrl?: string;
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
    const model =
      typeof data?.model === 'string' && data.model.trim()
        ? data.model.trim()
        : 'gemini-3.5-flash-lite';
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
    clearTimeout(timerId);
    signal.removeEventListener('abort', onExternalAbort);
  }
}

export interface RunPersonaliseOptions {
  context: Record<string, unknown>;
  signal?: AbortSignal;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  endpointUrl?: string;
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
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort, { once: true });
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
      signal: controller.signal,
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
    const model =
      typeof data?.model === 'string' && data.model.trim()
        ? data.model.trim()
        : 'gemini-3.5-flash-lite';
    return { status: 'ok', text, model };
  } catch {
    return {
      status: 'error',
      error: 'Unable to reach Gemini right now. Showing verified rule-engine summary.',
    };
  } finally {
    clearTimeout(timerId);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}
