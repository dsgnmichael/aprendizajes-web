import { features } from '@repo/config'
import {
  getPublishedHomePage,
  getPublishedProfile,
  getSiteSettings,
  listLandingTestimonials,
  listPublishedCards,
  listPublishedSlugs,
} from '@repo/data-access'
import { CACHE_TAGS, defaultSiteSettings, type ProfessionalCard } from '@repo/domain'
import { getTestimonialFeed, providersFor } from '@repo/integrations/testimonials'
import { cacheLife, cacheTag } from 'next/cache'

/*
 * Cached, read-only data access for the public site (Cache Components).
 * Every function is tagged so the backoffice can invalidate it precisely via
 * the signed /api/revalidate endpoint. `cacheLife` is only a safety net in case
 * an invalidation is ever lost or raced: `hours` for profiles, `minutes` for
 * team lists and the landing (shared by many pages, so self-heal quickly).
 *
 * Errors (e.g. Mongo unavailable) are thrown, never cached, and handled by
 * the nearest error boundary.
 */

export async function getSite() {
  'use cache'
  cacheTag(CACHE_TAGS.site)
  cacheLife('hours')
  if (!features.database()) return defaultSiteSettings
  return getSiteSettings()
}

export async function getProfile(slug: string) {
  'use cache'
  cacheTag(CACHE_TAGS.profile(slug))
  cacheLife('hours')
  if (!features.database()) return null
  const result = await getPublishedProfile(slug)
  return result?.profile ?? null
}

export async function getProfessionalCards(): Promise<ProfessionalCard[]> {
  'use cache'
  cacheTag(CACHE_TAGS.directory)
  cacheLife('minutes')
  if (!features.database()) return []
  return listPublishedCards()
}

export async function getSitemapEntries() {
  'use cache'
  cacheTag(CACHE_TAGS.directory)
  cacheLife('minutes')
  if (!features.database()) return []
  return listPublishedSlugs()
}

/**
 * Testimonial feed from cacheable sources only: manual testimonials and
 * Google Business Profile reviews synced for an owned location. Google Places
 * content is never cached server-side; when configured, the client upgrades
 * this feed from /api/reviews/[slug] once the section becomes visible.
 */
export async function getCachedTestimonialFeed(slug: string) {
  'use cache'
  cacheTag(CACHE_TAGS.profile(slug))
  cacheLife('hours')
  if (!features.database()) return null
  const published = await getPublishedProfile(slug)
  if (!published) return null
  cacheTag(CACHE_TAGS.testimonials(published.profile.id))
  const cacheable = providersFor(published.profile).filter((p) => p.origin !== 'google_places')
  return getTestimonialFeed(published.profile, published.hiddenReviewIds, cacheable)
}

export function hasLiveReviews(profile: { testimonials: { source: string; googlePlaceId: string } }) {
  const { source, googlePlaceId } = profile.testimonials
  return (source === 'GOOGLE_PLACES' || source === 'MIXED') && Boolean(googlePlaceId) && features.googlePlaces()
}

/** Current year for the footer, cached so prerendering stays deterministic. */
export async function getCurrentYear() {
  'use cache'
  cacheLife('days')
  return new Date().getFullYear()
}

/** Published sales landing (home page); null when never published. */
export async function getLanding() {
  'use cache'
  cacheTag(CACHE_TAGS.landing)
  cacheLife('minutes')
  if (!features.database()) return null
  return getPublishedHomePage()
}

/** Organisation-wide manual testimonials for the landing wall. */
export async function getLandingTestimonials(limit: number) {
  'use cache'
  cacheTag(CACHE_TAGS.landing)
  cacheLife('minutes')
  if (!features.database()) return []
  return listLandingTestimonials(limit)
}
