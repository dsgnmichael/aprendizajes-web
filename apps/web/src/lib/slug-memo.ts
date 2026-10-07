/**
 * Short-lived memo of slugs known to be published, used by `proxy.ts` to skip
 * a DB lookup on hot paths. Stored on `globalThis` so the signed revalidation
 * endpoint (same Node process, different module graph) can evict entries the
 * moment a profile is unpublished. Other instances expire within TTL_MS.
 */
const TTL_MS = 10_000

const store = globalThis as typeof globalThis & { __publishedSlugMemo?: Map<string, number> }
const memo = (store.__publishedSlugMemo ??= new Map<string, number>())

export function isMemoised(slug: string) {
  const until = memo.get(slug)
  return until !== undefined && until > Date.now()
}

export function memoise(slug: string) {
  if (memo.size > 2000) memo.clear()
  memo.set(slug, Date.now() + TTL_MS)
}

export function forget(slug?: string) {
  if (slug) memo.delete(slug)
  else memo.clear()
}
