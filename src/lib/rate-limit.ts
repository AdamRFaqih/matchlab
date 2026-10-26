/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Suitable for a single-instance deployment (the default Docker setup). For multi-instance
 * deployments, replace the store with Redis or a DB-backed counter.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const globalStore = globalThis as unknown as { __matchlabRateLimit?: Map<string, Bucket> };
const store = (globalStore.__matchlabRateLimit ??= new Map<string, Bucket>());

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    if (store.size > 10_000) {
      for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
    }
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  const ok = bucket.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: ok ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}
