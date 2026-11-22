import type { GeminiExecutionDeps, ServiceResult } from './geminiService.ts';

/** Maximum allowed JSON payload size for AI proxy endpoints (16 KB). */
export const MAX_API_BODY_BYTES = 16 * 1024;

/** Sliding window duration in milliseconds for per-IP rate limiting. */
export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Maximum allowed AI requests per IP within one rate-limit window. */
export const RATE_LIMIT_MAX_REQUESTS = 20;

const MAX_TRACKED_CLIENTS = 500;

/** Options controlling environment-specific HTTP security header generation. */
export interface SecurityHeaderOptions {
  /** Enables Vite dev inline script allowance when true. */
  isDev: boolean;
  /** Permits iframe embedding (preview environments) when true. */
  allowIframe: boolean;
}

/**
 * Builds strict HTTP security headers shared between Express and Netlify Functions.
 * Relaxes frame-ancestors and inline dev scripts only when running Vite in dev preview mode.
 */
export function buildSecurityHeaders(options: SecurityHeaderOptions): Record<string, string> {
  const scriptSrc = options.isDev ? "'self' 'unsafe-inline'" : "'self'";
  const frameDirective = options.allowIframe ? '' : "; frame-ancestors 'none'";
  const csp =
    [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self' https://air-quality-api.open-meteo.com",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ') + frameDirective;

  const headers: Record<string, string> = {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-DNS-Prefetch-Control': 'off',
    'Cross-Origin-Opener-Policy': options.allowIframe ? 'same-origin-allow-popups' : 'same-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  if (!options.allowIframe) {
    headers['X-Frame-Options'] = 'DENY';
  }

  return headers;
}

/** Result returned by `SlidingWindowRateLimiter.check`. */
export interface RateLimitResult {
  /** Whether the request is permitted under the active window quota. */
  allowed: boolean;
  /** Whole seconds to wait before retrying when `allowed` is false. */
  retryAfterSec: number;
}

/**
 * Lightweight bounded-memory sliding-window rate limiter keyed by client IP.
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(options?: { maxRequests?: number; windowMs?: number; now?: () => number }) {
    this.maxRequests = options?.maxRequests ?? RATE_LIMIT_MAX_REQUESTS;
    this.windowMs = options?.windowMs ?? RATE_LIMIT_WINDOW_MS;
    this.now = options?.now ?? (() => Date.now());
  }

  /** Evaluates and records a request from the provided client key. */
  check(clientKey: string): RateLimitResult {
    const key = clientKey.trim() || 'local';
    const current = this.now();
    const recent = (this.hits.get(key) ?? []).filter((ts) => current - ts < this.windowMs);

    if (recent.length >= this.maxRequests) {
      const oldest = recent[0] ?? current;
      const retryAfterSec = Math.max(1, Math.ceil((this.windowMs - (current - oldest)) / 1000));
      return { allowed: false, retryAfterSec };
    }

    recent.push(current);
    this.hits.set(key, recent);
    this.evictExpiredBuckets(current);

    return { allowed: true, retryAfterSec: 0 };
  }

  /** Resets all tracked rate-limit buckets. */
  clear(): void {
    this.hits.clear();
  }

  private evictExpiredBuckets(current: number): void {
    if (this.hits.size <= MAX_TRACKED_CLIENTS) return;
    for (const [storedKey, timestamps] of this.hits) {
      if (timestamps.every((ts) => current - ts >= this.windowMs)) {
        this.hits.delete(storedKey);
      }
    }
  }
}

/** Extracts a sanitized client IP string from forwarded or socket headers. */
export function extractClientIp(forwardedFor: string | string[] | undefined, fallbackIp?: string): string {
  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0].trim().slice(0, 64);
  }
  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].split(',')[0].trim().slice(0, 64);
  }
  return (fallbackIp ?? 'local').slice(0, 64);
}

/** Dependency injection options for shared Netlify JSON POST handlers. */
export interface NetlifyHandlerOptions {
  /** Optional Gemini service overrides for testing or custom timeouts. */
  deps?: GeminiExecutionDeps;
  /** Optional rate limiter override for isolated testing. */
  rateLimiter?: SlidingWindowRateLimiter;
}

/** Service function signature invoked by `handleNetlifyJsonPost`. */
export type JsonServiceExecutor<T> = (
  rawBody: unknown,
  deps?: GeminiExecutionDeps
) => Promise<ServiceResult<T>>;

const defaultNetlifyRateLimiter = new SlidingWindowRateLimiter();
const textEncoder = new TextEncoder();

function buildJsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

/** Checks whether an incoming HTTP Content-Type header declares JSON media type. */
export function isJsonContentType(contentType: string | null | undefined): boolean {
  if (typeof contentType !== 'string') return false;
  const mediaType = contentType.split(';')[0].trim().toLowerCase();
  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

/**
 * Single shared Netlify Function POST handler enforcing HTTP method checks,
 * Content-Type validation, per-IP sliding-window rate limiting, 16 KB body size caps,
 * JSON parsing, strict security headers, and delegation to a `server/geminiService` executor.
 */
export async function handleNetlifyJsonPost<T>(
  request: Request,
  executor: JsonServiceExecutor<T>,
  options?: NetlifyHandlerOptions
): Promise<Response> {
  const securityHeaders = buildSecurityHeaders({ isDev: false, allowIframe: false });
  const jsonHeaders = { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8' };

  if (request.method !== 'POST') {
    return buildJsonResponse({ error: 'Method not allowed.' }, 405, { ...jsonHeaders, Allow: 'POST' });
  }

  if (!isJsonContentType(request.headers.get('content-type'))) {
    return buildJsonResponse({ error: 'Content-Type must be application/json.' }, 415, jsonHeaders);
  }

  const clientIp = extractClientIp(
    request.headers.get('x-nf-client-connection-ip') ?? request.headers.get('x-forwarded-for') ?? undefined
  );
  const limiter = options?.rateLimiter ?? defaultNetlifyRateLimiter;
  const decision = limiter.check(clientIp);
  if (!decision.allowed) {
    return buildJsonResponse(
      { error: 'Too many AI requests. Please wait a moment and try again.' },
      429,
      { ...jsonHeaders, 'Retry-After': String(decision.retryAfterSec) }
    );
  }

  const rawText = await request.text();
  if (textEncoder.encode(rawText).byteLength > MAX_API_BODY_BYTES) {
    return buildJsonResponse({ error: 'Request payload exceeds the 16 KB limit.' }, 413, jsonHeaders);
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawText);
  } catch {
    return buildJsonResponse({ error: 'Invalid JSON request payload.' }, 400, jsonHeaders);
  }

  const result = await executor(parsedBody, options?.deps);
  return buildJsonResponse(result.body, result.status, jsonHeaders);
}
