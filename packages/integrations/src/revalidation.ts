import { env } from '@repo/config'
import { signRequest } from './signing'

export interface RevalidationResult {
  ok: boolean
  skipped?: boolean
  error?: string
}

const TAG_PATTERN = /^(site|directory|landing|profile:[a-z0-9-]{1,80}|testimonials:[a-f0-9]{24})$/

/**
 * Admin → public site cache invalidation. The admin and the web app can run
 * as separate deployments, so the admin calls a private, HMAC-signed endpoint
 * on the public site, which then calls `revalidateTag` for each tag.
 */
export async function requestRevalidation(tags: string[]): Promise<RevalidationResult> {
  const e = env()
  const unique = [...new Set(tags)].filter((t) => TAG_PATTERN.test(t))
  if (unique.length === 0) return { ok: true, skipped: true }
  if (!e.REVALIDATION_SECRET) {
    console.warn('[revalidate] REVALIDATION_SECRET not set; public cache will refresh on its own schedule')
    return { ok: false, skipped: true, error: 'REVALIDATION_SECRET missing' }
  }
  const body = JSON.stringify({ tags: unique })
  const { timestamp, signature } = signRequest(e.REVALIDATION_SECRET, body)
  try {
    const response = await fetch(`${e.PUBLIC_BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-timestamp': timestamp, 'x-signature': signature },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.name : 'unknown' }
  }
}

export function isValidRevalidationTag(tag: string): boolean {
  return TAG_PATTERN.test(tag)
}
