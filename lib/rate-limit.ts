/**
 * In-memory rate limiter
 * Single-instance safe. Switch to Upstash Redis when going multi-instance.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check and increment rate limit for a key.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

/** Rate limit presets */
export const LIMITS = {
  chat:        { limit: 20,  windowMs: 60_000 },   // 20 msgs/min per user
  api:         { limit: 60,  windowMs: 60_000 },   // 60 req/min general
  auth:        { limit: 5,   windowMs: 60_000 },   // 5 login attempts/min
  webSearch:   { limit: 30,  windowMs: 60_000 },   // 30 searches/min
} as const;
