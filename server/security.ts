/** Maximum allowed JSON payload size for AI proxy endpoints (16 KB). */
export const MAX_API_BODY_BYTES = 16 * 1024;

/** Sliding window duration in milliseconds for per-IP rate limiting. */
export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Maximum allowed AI requests per IP within one rate-limit window. */
export const RATE_LIMIT_MAX_REQUESTS = 20;

const MAX_TRACKED_CLIENTS = 500;

export interface SecurityHeaderOptions {
  isDev: boolean;
  allowIframe: boolean;
}

/**
 * Builds strict HTTP security headers shared between Express and Netlify Functions.
 * Relaxes frame-ancestors/inline dev scripts only when running Vite in dev preview mode.
 */
export function buildSecurityHeaders(options: SecurityHeaderOptions): Record<string, string> {
  const scriptSrc = options.isDev ? "'self' 'unsafe-inline'" : "'self'";
  const frameDirective = options.allowIframe ? '' : "; frame-ancestors 'none'";
  const csp = [
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
  };

  if (!options.allowIframe) {
    headers['X-Frame-Options'] = 'DENY';
  }

  return headers;
}

export interface RateLimitResult {
  allowed: boolean;
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

    if (this.hits.size > MAX_TRACKED_CLIENTS) {
      for (const [storedKey, timestamps] of this.hits) {
        if (timestamps.every((ts) => current - ts >= this.windowMs)) {
          this.hits.delete(storedKey);
        }
      }
    }

    return { allowed: true, retryAfterSec: 0 };
  }

  /** Resets all tracked rate-limit buckets. */
  clear(): void {
    this.hits.clear();
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
