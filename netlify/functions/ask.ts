import { executeAskRequest, type GeminiExecutionDeps } from '../../server/geminiService.ts';
import {
  buildSecurityHeaders,
  extractClientIp,
  MAX_API_BODY_BYTES,
  SlidingWindowRateLimiter,
} from '../../server/security.ts';

const defaultRateLimiter = new SlidingWindowRateLimiter();

export interface NetlifyHandlerOptions {
  deps?: GeminiExecutionDeps;
  rateLimiter?: SlidingWindowRateLimiter;
}

/**
 * Shared Netlify Function handler for `POST /api/gemini/ask`.
 * Enforces 16 KB body limit, sliding-window rate limiting, and strict security headers.
 */
export async function handleAskNetlifyRequest(
  request: Request,
  options?: NetlifyHandlerOptions
): Promise<Response> {
  const securityHeaders = buildSecurityHeaders({ isDev: false, allowIframe: false });
  const jsonHeaders = { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8' };

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { ...jsonHeaders, Allow: 'POST' },
    });
  }

  const clientIp = extractClientIp(
    request.headers.get('x-nf-client-connection-ip') ?? request.headers.get('x-forwarded-for') ?? undefined
  );
  const limiter = options?.rateLimiter ?? defaultRateLimiter;
  const decision = limiter.check(clientIp);
  if (!decision.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many AI requests. Please wait a moment and try again.' }),
      {
        status: 429,
        headers: { ...jsonHeaders, 'Retry-After': String(decision.retryAfterSec) },
      }
    );
  }

  const rawText = await request.text();
  if (new TextEncoder().encode(rawText).byteLength > MAX_API_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Request payload exceeds the 16 KB limit.' }), {
      status: 413,
      headers: jsonHeaders,
    });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawText);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request payload.' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const result = await executeAskRequest(parsedBody, options?.deps);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: jsonHeaders,
  });
}

export default async function handler(request: Request): Promise<Response> {
  return handleAskNetlifyRequest(request);
}
