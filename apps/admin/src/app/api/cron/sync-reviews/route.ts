import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@repo/config'
import { CACHE_TAGS } from '@repo/domain'
import { syncBusinessProfileReviews } from '@repo/integrations/google'
import { requestRevalidation } from '@repo/integrations/revalidation'
import { safeEqual } from '@repo/integrations/signing'

export const maxDuration = 300

/**
 * Scheduled Google Business Profile sync (Vercel Cron: see vercel.json).
 * Requires `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: NextRequest) {
  const secret = env().CRON_SECRET
  const header = request.headers.get('authorization') ?? ''
  if (!secret || !safeEqual(header, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const summary = await syncBusinessProfileReviews()
  if (summary.status === 'ok' && summary.slugs.length) {
    await requestRevalidation([
      ...summary.slugs.map((s) => CACHE_TAGS.profile(s)),
      CACHE_TAGS.directory,
    ])
  }
  return NextResponse.json(
    { status: summary.status, locations: summary.locations, reviews: summary.reviews },
    { status: summary.status === 'error' ? 502 : 200 },
  )
}
