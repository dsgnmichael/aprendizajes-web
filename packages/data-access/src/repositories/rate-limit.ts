import { collections } from '@repo/database'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Fixed-window rate limiter backed by MongoDB, so it works across multiple
 * serverless instances. Expired windows are removed by a TTL index.
 */
export async function hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000))
  const id = `${key}:${windowStart}`
  const resetAt = new Date((windowStart + 1) * windowSeconds * 1000)
  const c = await collections()
  const doc = await c.rateLimits.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: resetAt } },
    { upsert: true, returnDocument: 'after' },
  )
  const count = doc?.count ?? 1
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt }
}

/** Reads the current window count without incrementing it. */
export async function peekRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000))
  const resetAt = new Date((windowStart + 1) * windowSeconds * 1000)
  const c = await collections()
  const doc = await c.rateLimits.findOne({ _id: `${key}:${windowStart}` })
  const count = doc?.count ?? 0
  return { allowed: count < limit, remaining: Math.max(0, limit - count), resetAt }
}
