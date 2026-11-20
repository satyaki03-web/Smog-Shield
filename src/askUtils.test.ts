import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ASK_CACHE_TTL_MS,
  ASK_MAX_HISTORY_TURNS,
  ASK_TIMEOUT_MS,
  AskCache,
  buildCompactAskPayload,
  buildCompactProfileSummary,
  parseStructuredAdvice,
  runAskRequest,
  SUGGESTED_ASK_QUESTIONS,
} from './askUtils';
import { CITIES, DEFAULT_PROFILE } from './smogEngine';

describe('Ask payload and structured 3-part advice parser', () => {
  it('includes live city, AQI, category, household ages/sensitivities/commute/purifier, and last 4 turns', () => {
    const history = Array.from({ length: 8 }, (_, idx) => ({
      sender: (idx % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      text: `Turn ${idx + 1} question.`,
    }));
    const payload = buildCompactAskPayload(
      'which mask is best??',
      { city: CITIES[0], aqi: 342, pm25: 178, pm10: 295 },
      'Very Poor',
      DEFAULT_PROFILE,
      history
    );

    assert.equal(payload.city, 'Delhi');
    assert.equal(payload.aqi, 342);
    assert.equal(payload.band, 'Very Poor');
    assert.equal(payload.history.length, ASK_MAX_HISTORY_TURNS);
    assert.match(payload.profileSummary, /2 adults/);
    assert.match(payload.profileSummary, /1 children/);
    assert.match(payload.profileSummary, /asthma/);
    assert.match(payload.profileSummary, /twoWheeler/);
    assert.match(payload.profileSummary, /no purifier/);
    assert.equal(SUGGESTED_ASK_QUESTIONS.length, 4);
  });

  it('parses Tailored Advice, Direct Impact, and Quick Next Step sections cleanly', () => {
    const parsed = parseStructuredAdvice(
      'Tailored Advice: Wear a snug N95 mask on two-wheeler rides.\nDirect Impact: Cuts inhaled PM2.5 by 85% and keeps reusable mask waste low.\nQuick Next Step: Fit-check your mask nose clip before leaving.'
    );
    assert.equal(parsed.tailoredAdvice, 'Wear a snug N95 mask on two-wheeler rides.');
    assert.equal(parsed.directImpact, 'Cuts inhaled PM2.5 by 85% and keeps reusable mask waste low.');
    assert.equal(parsed.quickNextStep, 'Fit-check your mask nose clip before leaving.');
  });
});

describe('Ask 10-minute cache with model metadata', () => {
  it('caches identical questions for same AQI band and profile and expires after 10 minutes', () => {
    let now = 2_000_000;
    const cache = new AskCache({ ttlMs: ASK_CACHE_TTL_MS, now: () => now });
    const summary = buildCompactProfileSummary(DEFAULT_PROFILE);
    const key1 = AskCache.makeKey('Which mask is best??', 'Very Poor', summary);
    const keySame = AskCache.makeKey('  which mask is best?? ', 'Very Poor', summary);
    const keyOtherBand = AskCache.makeKey('Which mask is best??', 'Moderate', summary);

    cache.set(key1, { text: 'Use a fitted N95.', model: 'gemini-3.5-flash-lite' });
    assert.deepEqual(cache.get(keySame), { text: 'Use a fitted N95.', model: 'gemini-3.5-flash-lite' });
    assert.equal(cache.get(keyOtherBand), null);

    now += ASK_CACHE_TTL_MS;
    assert.equal(cache.get(keySame), null);
  });
});

describe('Ask POST JSON orchestration, 15s timeout, cancel, and fallback', () => {
  const samplePayload = buildCompactAskPayload(
    'which mask is best??',
    { city: CITIES[0], aqi: 342, pm25: 178, pm10: 295 },
    'Very Poor',
    DEFAULT_PROFILE,
    []
  );

  it('returns model badge on POST JSON success and serves second request from cache', async () => {
    const cache = new AskCache();
    let calls = 0;

    const fakeFetch: typeof fetch = async () => {
      calls++;
      return new Response(
        JSON.stringify({
          text: 'Tailored Advice: Use an N95.\nDirect Impact: Blocks 85% PM2.5.\nQuick Next Step: Seal the nose bridge.',
          model: 'gemini-3.5-flash-lite',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const res1 = await runAskRequest({
      payload: samplePayload,
      cache,
      signal: new AbortController().signal,
      fetchImpl: fakeFetch,
    });
    assert.equal(res1.status, 'ok');
    assert.equal(res1.model, 'gemini-3.5-flash-lite');
    assert.equal(calls, 1);

    const res2 = await runAskRequest({
      payload: samplePayload,
      cache,
      signal: new AbortController().signal,
      fetchImpl: fakeFetch,
    });
    assert.equal(res2.status, 'cached');
    assert.equal(res2.model, 'gemini-3.5-flash-lite');
    assert.equal(calls, 1);
  });

  it('gracefully degrades to Quick guidance when server returns error', async () => {
    const fakeFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ error: 'Gemini is temporarily busy.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });

    const result = await runAskRequest({
      payload: samplePayload,
      cache: new AskCache(),
      signal: new AbortController().signal,
      fetchImpl: fakeFetch,
    });
    assert.equal(result.status, 'fallback');
    assert.match(result.notice ?? '', /quick guidance/i);
  });

  it('enforces the 15-second client timeout and returns timeout fallback notice', async () => {
    assert.equal(ASK_TIMEOUT_MS, 15_000);

    const hangingFetch: typeof fetch = async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')));
      });

    const result = await runAskRequest({
      payload: samplePayload,
      cache: new AskCache(),
      signal: new AbortController().signal,
      timeoutMs: 25,
      fetchImpl: hangingFetch,
    });
    assert.equal(result.status, 'timeout');
    assert.match(result.notice ?? '', /15s|quick guidance/i);
  });

  it('immediately cancels via AbortController and returns cancel notice', async () => {
    const controller = new AbortController();
    const hangingFetch: typeof fetch = async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')));
      });

    const promise = runAskRequest({
      payload: samplePayload,
      cache: new AskCache(),
      signal: controller.signal,
      timeoutMs: ASK_TIMEOUT_MS,
      fetchImpl: hangingFetch,
    });
    controller.abort();
    const result = await promise;
    assert.equal(result.status, 'cancelled');
    assert.match(result.notice ?? '', /cancelled/i);
  });
});
