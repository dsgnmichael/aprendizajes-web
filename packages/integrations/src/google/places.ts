import type { TestimonialDTO, TestimonialSummary } from '@repo/domain'
import { fetchJson, type FetchLike } from './http'

/**
 * Google Places API (New) client. SERVER-ONLY: the API key is sent in a
 * header from the server and never reaches the browser bundle.
 *
 * Policy notes (Google Maps Platform):
 * - Place Details returns at most 5 reviews; never assume the full history.
 * - Only the Place ID may be stored indefinitely. Review content is fetched
 *   on demand and NOT persisted in our database.
 * - Author attribution (name, photo, profile link) and the Google Maps
 *   attribution must be displayed alongside the content.
 */
const BASE = 'https://places.googleapis.com/v1'

interface PlacesReview {
  name: string
  relativePublishTimeDescription?: string
  rating?: number
  text?: { text: string; languageCode?: string }
  originalText?: { text: string; languageCode?: string }
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string }
  publishTime?: string
  googleMapsUri?: string
}

interface PlaceDetails {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: PlacesReview[]
}

export interface PlaceSearchResult {
  placeId: string
  name: string
  address: string
}

export interface PlacesClientOptions {
  apiKey: string
  fetcher?: FetchLike
  languageCode?: string
}

export function createPlacesClient({ apiKey, fetcher = fetch, languageCode = 'es' }: PlacesClientOptions) {
  const headers = (fieldMask: string) => ({
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': fieldMask,
    'content-type': 'application/json',
  })

  return {
    async searchText(query: string): Promise<PlaceSearchResult[]> {
      const data = await fetchJson<{ places?: { id: string; displayName?: { text: string }; formattedAddress?: string }[] }>(
        fetcher,
        `${BASE}/places:searchText`,
        {
          method: 'POST',
          headers: headers('places.id,places.displayName,places.formattedAddress'),
          body: JSON.stringify({ textQuery: query.slice(0, 200), languageCode, pageSize: 8 }),
        },
      )
      return (data.places ?? []).map((p) => ({
        placeId: p.id,
        name: p.displayName?.text ?? p.id,
        address: p.formattedAddress ?? '',
      }))
    },

    async getPlaceSummary(placeId: string) {
      const data = await fetchJson<PlaceDetails>(
        fetcher,
        `${BASE}/places/${encodeURIComponent(placeId)}?languageCode=${languageCode}`,
        { headers: headers('id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri') },
      )
      return {
        placeId: data.id,
        name: data.displayName?.text ?? '',
        address: data.formattedAddress ?? '',
        rating: data.rating ?? null,
        userRatingCount: data.userRatingCount ?? null,
        googleMapsUri: data.googleMapsUri ?? null,
      }
    },

    async getReviews(placeId: string): Promise<{ items: TestimonialDTO[]; summary: Partial<TestimonialSummary> }> {
      const data = await fetchJson<PlaceDetails>(
        fetcher,
        `${BASE}/places/${encodeURIComponent(placeId)}?languageCode=${languageCode}`,
        { headers: headers('id,rating,userRatingCount,googleMapsUri,reviews') },
      )
      return {
        items: (data.reviews ?? []).map(normalizePlacesReview),
        summary: {
          averageRating: data.rating ?? null,
          totalReviews: data.userRatingCount ?? null,
          placeUrl: data.googleMapsUri,
        },
      }
    },
  }
}

export function normalizePlacesReview(review: PlacesReview): TestimonialDTO {
  return {
    // `name` is the stable review resource identifier – safe to store for hiding.
    id: review.name,
    origin: 'google_places',
    authorName: review.authorAttribution?.displayName ?? 'Usuario de Google',
    authorPhotoUrl: review.authorAttribution?.photoUri,
    authorUrl: review.authorAttribution?.uri,
    rating: review.rating ?? null,
    // Original wording is kept intact; we show the original text when available.
    content: review.originalText?.text ?? review.text?.text ?? '',
    date: review.publishTime?.slice(0, 10),
    relativeTime: review.relativePublishTimeDescription,
    sourceUrl: review.googleMapsUri,
    sourceLabel: 'Google',
    featured: false,
    // When Google only returns a translated `text`, flag it so the UI can say so.
    translated: !review.originalText && !!review.text,
  }
}

export type PlacesClient = ReturnType<typeof createPlacesClient>
