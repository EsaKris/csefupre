/**
 * Best-effort in-memory rate limiter.
 *
 * Serverless instances do not share memory, so this only limits bursts that
 * reach the same warm instance. It is a first line of defence, not a guarantee.
 * For stronger limits, add a Vercel Firewall rate-limit rule on /api/* or a
 * shared store such as Upstash Redis (see docs/SECURITY.md in Phase 6).
 */

export type RateLimiter = { allow: (key: string) => boolean }

export function createRateLimiter({ limit, windowMs, now = () => Date.now() }: { limit: number; windowMs: number; now?: () => number }): RateLimiter {
  const hits = new Map<string, number[]>()
  return {
    allow(key) {
      const t = now()
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs)
      if (recent.length >= limit) {
        hits.set(key, recent)
        return false
      }
      recent.push(t)
      hits.set(key, recent)
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.every((ts) => t - ts >= windowMs)) hits.delete(k)
      }
      return true
    },
  }
}
