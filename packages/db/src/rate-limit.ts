import "server-only";

/**
 * Minimal in-memory fixed-window rate limiter (no external dependencies).
 *
 * Placed in @monetura/db because it is the only shared server-side package —
 * both the platform and marketing apps consume it (see DECISIONS.md [Sprint 3]).
 *
 * Limitation (accepted): state is per server instance. On serverless, each
 * warm instance counts independently, so real-world limits are a multiple of
 * the configured ones. That still stops naive scripted abuse; move to a
 * shared store (e.g. Upstash) if per-user precision is ever required.
 */

interface WindowEntry {
  count: number;
  windowStartMs: number;
}

const windows = new Map<string, WindowEntry>();

// Prune stale entries occasionally so the map cannot grow unbounded.
const PRUNE_INTERVAL_MS = 10 * 60 * 1000;
let lastPruneMs = 0;

function pruneStale(now: number, windowMs: number): void {
  if (now - lastPruneMs < PRUNE_INTERVAL_MS) return;
  lastPruneMs = now;
  for (const [key, entry] of windows) {
    if (now - entry.windowStartMs > Math.max(windowMs, PRUNE_INTERVAL_MS)) {
      windows.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the current window resets (for the Retry-After header). */
  retryAfterSeconds: number;
}

/**
 * Fixed-window check: allows `limit` calls per `windowMs` for the given key.
 * Key convention: "<route>:<ip-or-member-id>".
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  pruneStale(now, windowMs);

  const entry = windows.get(key);
  if (!entry || now - entry.windowStartMs >= windowMs) {
    windows.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count <= limit) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((entry.windowStartMs + windowMs - now) / 1000)
    ),
  };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
