import { afterEach, describe, expect, it } from 'vitest';
import { handleAskNetlifyRequest } from '../netlify/functions/ask.ts';
import { handlePersonaliseNetlifyRequest } from '../netlify/functions/personalise.ts';
import {
  buildSecurityHeaders,
  extractClientIp,
  isJsonContentType,
  MAX_API_BODY_BYTES,
  SlidingWindowRateLimiter,
} from './security.ts';

const VALID_ASK_BODY = {
  question: 'How should I seal bedroom windows during smog?',
  city: 'Delhi',
  region: 'Delhi NCR',
  aqi: 365,
  band: 'Very Poor',
  pm25: 192,
  pm10: 315,
  profileSummary: 'ages:2 adults, 1 children; sensitivities:asthma; commute:twoWheeler; fuel:lpg',
  history: [],
};

describe('server/security headers, IP extraction, Content-Type, and rate limiting', () => {
  it('builds strict production security headers including HSTS, CSP, and X-Frame-Options', () => {
    const prod = buildSecurityHeaders({ isDev: false, allowIframe: false });
    expect(prod['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
    expect(prod['X-Frame-Options']).toBe('DENY');
    expect(prod['X-Content-Type-Options']).toBe('nosniff');
    expect(prod['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(prod['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(prod['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(prod['Content-Security-Policy']).toContain("script-src 'self'");
    expect(prod['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(prod['Content-Security-Policy']).toContain('https://air-quality-api.open-meteo.com');

    const devPreview = buildSecurityHeaders({ isDev: true, allowIframe: true });
    expect(devPreview['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
    expect(devPreview['X-Frame-Options']).toBeUndefined();
    expect(devPreview['Content-Security-Policy']).toContain("'unsafe-inline'");
  });

  it('validates JSON Content-Type headers and sanitizes client IPs', () => {
    expect(isJsonContentType('application/json')).toBe(true);
    expect(isJsonContentType('application/json; charset=utf-8')).toBe(true);
    expect(isJsonContentType('application/problem+json')).toBe(true);
    expect(isJsonContentType('text/plain')).toBe(false);
    expect(isJsonContentType('multipart/form-data')).toBe(false);
    expect(isJsonContentType(null)).toBe(false);
    expect(isJsonContentType(undefined)).toBe(false);

    expect(extractClientIp('203.0.113.5, 198.51.100.1')).toBe('203.0.113.5');
    expect(extractClientIp(['198.51.100.9, 10.0.0.1'])).toBe('198.51.100.9');
    expect(extractClientIp(undefined, '127.0.0.1')).toBe('127.0.0.1');
    expect(extractClientIp(undefined)).toBe('local');
  });

  it('enforces sliding-window rate limits, Retry-After headers, clear(), and expired bucket eviction', () => {
    let now = 1_000_000;
    const limiter = new SlidingWindowRateLimiter({ maxRequests: 2, windowMs: 60_000, now: () => now });

    expect(limiter.check('198.51.100.1')).toEqual({ allowed: true, retryAfterSec: 0 });
    expect(limiter.check('198.51.100.1')).toEqual({ allowed: true, retryAfterSec: 0 });

    const blocked = limiter.check('198.51.100.1');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(60);

    // Advance past window and add > 500 clients to trigger expired-bucket eviction path
    now += 61_000;
    for (let i = 0; i < 505; i++) {
      expect(limiter.check(`10.0.${Math.floor(i / 255)}.${i % 255}`).allowed).toBe(true);
    }
    limiter.clear();
    expect(limiter.check('198.51.100.1').allowed).toBe(true);
  });
});

describe('netlify/functions/ask HTTP hardening and fallback responses', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it('rejects non-POST methods with HTTP 405, Allow: POST, and HSTS security headers', async () => {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const res = await handleAskNetlifyRequest(
        new Request('https://smogshield.example/api/gemini/ask', { method })
      );
      expect(res.status).toBe(405);
      expect(res.headers.get('Allow')).toBe('POST');
      expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    }
  });

  it('rejects invalid or missing Content-Type with HTTP 415', async () => {
    const textPlainRes = await handleAskNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(VALID_ASK_BODY),
      }),
      { rateLimiter: new SlidingWindowRateLimiter() }
    );
    expect(textPlainRes.status).toBe(415);
    expect(textPlainRes.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');

    const formRes = await handleAskNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'question=hello',
      }),
      { rateLimiter: new SlidingWindowRateLimiter() }
    );
    expect(formRes.status).toBe(415);
  });

  it('rejects oversized payloads (413), invalid JSON (400), and invalid schemas (400)', async () => {
    const tooLarge = await handleAskNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'x'.repeat(MAX_API_BODY_BYTES + 128) }),
      }),
      { rateLimiter: new SlidingWindowRateLimiter() }
    );
    expect(tooLarge.status).toBe(413);

    const malformedJson = await handleAskNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not-json',
      }),
      { rateLimiter: new SlidingWindowRateLimiter() }
    );
    expect(malformedJson.status).toBe(400);

    const invalidSchema = await handleAskNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...VALID_ASK_BODY, aqi: 9999 }),
      }),
      { rateLimiter: new SlidingWindowRateLimiter() }
    );
    expect(invalidSchema.status).toBe(400);
  });

  it('returns HTTP 503 fallback error when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await handleAskNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_ASK_BODY),
      }),
      { rateLimiter: new SlidingWindowRateLimiter() }
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('GEMINI_API_KEY');
  });

  it('returns HTTP 200 with HSTS header on valid POST and enforces 429 rate limiting', async () => {
    const limiter = new SlidingWindowRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    const okRes = await handleAskNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nf-client-connection-ip': '203.0.113.42',
        },
        body: JSON.stringify(VALID_ASK_BODY),
      }),
      {
        rateLimiter: limiter,
        deps: { generateFn: async () => 'Tailored Advice: Seal gaps with damp towels.' },
      }
    );
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    const json = (await okRes.json()) as { text: string; model: string };
    expect(json.text).toBe('Tailored Advice: Seal gaps with damp towels.');
    expect(json.model).toBe('gemini-3.5-flash-lite');

    const limitedRes = await handleAskNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nf-client-connection-ip': '203.0.113.42',
        },
        body: JSON.stringify(VALID_ASK_BODY),
      }),
      { rateLimiter: limiter }
    );
    expect(limitedRes.status).toBe(429);
    expect(Number(limitedRes.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
  });

  it('enforces 405 and 415 identically on netlify/functions/personalise', async () => {
    const getRes = await handlePersonaliseNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/personalise', { method: 'GET' })
    );
    expect(getRes.status).toBe(405);

    const badTypeRes = await handlePersonaliseNetlifyRequest(
      new Request('https://smogshield.example/api/gemini/personalise', {
        method: 'POST',
        headers: { 'Content-Type': 'text/html' },
        body: '<p>bad</p>',
      }),
      { rateLimiter: new SlidingWindowRateLimiter() }
    );
    expect(badTypeRes.status).toBe(415);
  });
});
