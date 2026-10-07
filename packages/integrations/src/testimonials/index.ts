import { getIntegration, listPublicManualTestimonials, listSyncedBusinessReviews } from '@repo/data-access'
import {
  buildTestimonialFeed,
  type ProviderResult,
  type PublicProfile,
  type TestimonialFeed,
  type TestimonialOrigin,
} from '@repo/domain'
import { getPlacesClient } from '../google/service'

/**
 * Provider abstraction: every source returns normalized TestimonialDTOs.
 * New providers (Trustpilot, Doctoralia…) implement this interface.
 */
export interface TestimonialProvider {
  origin: TestimonialOrigin
  /** Whether the provider is usable for this profile (config + credentials). */
  isAvailable(profile: PublicProfile): boolean
  fetch(profile: PublicProfile): Promise<Omit<ProviderResult, 'origin'>>
}

export const manualProvider: TestimonialProvider = {
  origin: 'manual',
  isAvailable: () => true,
  async fetch(profile) {
    return { items: await listPublicManualTestimonials(profile.id) }
  },
}

export const googlePlacesProvider: TestimonialProvider = {
  origin: 'google_places',
  isAvailable: (profile) => Boolean(profile.testimonials.googlePlaceId && getPlacesClient()),
  async fetch(profile) {
    const client = getPlacesClient()
    if (!client) return { items: [], failed: true }
    // Global kill-switch from the backoffice (Integraciones → Google Places).
    if (!(await getIntegration('google_places')).enabled) return { items: [] }
    // Not persisted: fetched on demand per Google Maps Platform policies.
    return client.getReviews(profile.testimonials.googlePlaceId)
  },
}

export const googleBusinessProfileProvider: TestimonialProvider = {
  origin: 'google_business_profile',
  isAvailable: (profile) => Boolean(profile.testimonials.gbpLocationName),
  async fetch(profile) {
    const items = await listSyncedBusinessReviews(profile.testimonials.gbpLocationName)
    const rated = items.filter((i) => i.rating != null)
    return {
      items,
      summary: rated.length
        ? {
            averageRating: Math.round((rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length) * 10) / 10,
            totalReviews: items.length,
          }
        : undefined,
    }
  },
}

export function providersFor(profile: PublicProfile): TestimonialProvider[] {
  const { source } = profile.testimonials
  const list: TestimonialProvider[] = [manualProvider]
  if (source === 'GOOGLE_PLACES' || source === 'MIXED') list.push(googlePlacesProvider)
  if (source === 'GOOGLE_BUSINESS_PROFILE' || source === 'MIXED') list.push(googleBusinessProfileProvider)
  return list.filter((p) => p.isAvailable(profile))
}

/** Profile config says Google content must be fetched live (not cacheable). */
export function needsLiveProvider(profile: PublicProfile): boolean {
  return providersFor(profile).some((p) => p.origin === 'google_places')
}

/**
 * Resolves the testimonial feed. Each provider fails independently: if
 * Google is down the page still renders (manual fallback, `degraded: true`).
 */
export async function getTestimonialFeed(
  profile: PublicProfile,
  hiddenReviewIds: string[],
  providers: TestimonialProvider[] = providersFor(profile),
): Promise<TestimonialFeed> {
  const results = await Promise.all(
    providers.map(async (provider): Promise<ProviderResult> => {
      try {
        return { origin: provider.origin, ...(await provider.fetch(profile)) }
      } catch (error) {
        console.warn(`[testimonials] ${provider.origin} failed:`, error instanceof Error ? error.message : 'unknown')
        return { origin: provider.origin, items: [], failed: true }
      }
    }),
  )
  return buildTestimonialFeed(results, { ...profile.testimonials, hiddenReviewIds })
}
