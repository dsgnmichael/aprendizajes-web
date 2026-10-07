import { createHash } from 'node:crypto'
import { getPublishedProfile, hitRateLimit } from '@repo/data-access'
import { isValidSlug } from '@repo/domain'
import { getTestimonialFeed } from '@repo/integrations/testimonials'
import { NextResponse, type NextRequest } from 'next/server'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/**
 * Live testimonial feed including Google Places reviews. Places content is
 * fetched on demand and never cached/persisted server-side (Google Maps
 * Platform policy); the API key never leaves the server.
 */
export async function GET(request: NextRequest, { params }: RouteContext<'/api/reviews/[slug]'>) {
  const { slug } = await params
  if (!isValidSlug(slug)) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE })
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const key = createHash('sha256').update(ip).digest('base64url').slice(0, 24)
  try {
    const limit = await hitRateLimit(`reviews:${key}`, 30, 60)
    if (!limit.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: NO_STORE })
    const published = await getPublishedProfile(slug)
    if (!published || !published.profile.testimonials.enabled) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE })
    }
    const feed = await getTestimonialFeed(published.profile, published.hiddenReviewIds)
    return NextResponse.json(feed, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503, headers: NO_STORE })
  }
}
