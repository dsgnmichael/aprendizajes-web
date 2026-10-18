import { createHash } from 'node:crypto'
import { hitRateLimit, searchPublished } from '@repo/data-access'
import { NextResponse, type NextRequest } from 'next/server'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/**
 * Public site search. Reads the published snapshots only (never drafts).
 * Rate-limited per IP to protect the database from abuse.
 */
export async function GET(request: NextRequest) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
  if (q.length < 2 || q.length > 80) {
    return NextResponse.json({ results: [] }, { headers: NO_STORE })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const key = createHash('sha256').update(ip).digest('base64url').slice(0, 24)

  try {
    const limit = await hitRateLimit(`search:${key}`, 60, 60)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: NO_STORE })
    }
    const results = await searchPublished(q, 12)
    return NextResponse.json({ results, query: q }, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503, headers: NO_STORE })
  }
}
