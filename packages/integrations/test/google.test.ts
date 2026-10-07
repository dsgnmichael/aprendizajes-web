import { describe, expect, it, vi } from 'vitest'
import { buildGbpAuthUrl, createGbpClient } from '../src/google/business-profile'
import { ProviderError } from '../src/google/http'
import { createPlacesClient } from '../src/google/places'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

describe('Google Places (New) adapter', () => {
  it('sends the key only as a server header and normalizes reviews with attribution', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>
      expect(headers['X-Goog-Api-Key']).toBe('server-key')
      expect(headers['X-Goog-FieldMask']).toContain('reviews')
      return json({
        id: 'place1',
        rating: 4.9,
        userRatingCount: 87,
        googleMapsUri: 'https://maps.google.com/?cid=1',
        reviews: [
          {
            name: 'places/place1/reviews/r1',
            rating: 5,
            relativePublishTimeDescription: 'hace un mes',
            originalText: { text: 'Excelente atención', languageCode: 'es' },
            text: { text: 'Excelente atención', languageCode: 'es' },
            authorAttribution: { displayName: 'Ana', uri: 'https://maps.google.com/contrib/1', photoUri: 'https://lh3.googleusercontent.com/a' },
            publishTime: '2026-08-01T10:00:00Z',
          },
        ],
      })
    })
    const client = createPlacesClient({ apiKey: 'server-key', fetcher: fetcher as unknown as typeof fetch })
    const { items, summary } = await client.getReviews('place1')
    expect(String(fetcher.mock.calls[0]?.[0])).not.toContain('server-key')
    expect(items[0]).toMatchObject({
      id: 'places/place1/reviews/r1',
      origin: 'google_places',
      authorName: 'Ana',
      authorUrl: 'https://maps.google.com/contrib/1',
      content: 'Excelente atención',
      rating: 5,
    })
    expect(summary).toMatchObject({ averageRating: 4.9, totalReviews: 87 })
  })

  it('surfaces API failures as ProviderError without leaking the key', async () => {
    const client = createPlacesClient({ apiKey: 'server-key', fetcher: (async () => json({ error: { status: 'PERMISSION_DENIED' } }, 403)) as unknown as typeof fetch })
    await expect(client.getReviews('x')).rejects.toSatisfy((e: unknown) => e instanceof ProviderError && !String((e as Error).message).includes('server-key'))
  })
})

describe('Google Business Profile adapter', () => {
  const creds = { clientId: 'cid', clientSecret: 'csecret', redirectUri: 'https://admin.dominio.cl/api/integrations/google/callback' }

  it('builds an offline OAuth URL with state', () => {
    const url = new URL(buildGbpAuthUrl(creds, 'state123'))
    expect(url.searchParams.get('access_type')).toBe('offline')
    expect(url.searchParams.get('state')).toBe('state123')
    expect(url.searchParams.get('scope')).toContain('business.manage')
    expect(url.toString()).not.toContain('csecret')
  })

  it('follows nextPageToken pagination and maps star ratings', async () => {
    const pages = [
      json({ reviews: [{ reviewId: 'a', reviewer: { displayName: 'A' }, starRating: 'FIVE', comment: 'uno', createTime: '2026-01-01T00:00:00Z', updateTime: '2026-01-01T00:00:00Z' }], nextPageToken: 'p2', averageRating: 4.5, totalReviewCount: 2 }),
      json({ reviews: [{ reviewId: 'b', reviewer: { isAnonymous: true }, starRating: 'THREE', createTime: '2026-02-01T00:00:00Z', updateTime: '2026-02-01T00:00:00Z' }] }),
    ]
    const urls: string[] = []
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      urls.push(String(url))
      return pages.shift()!
    })
    const client = createGbpClient(creds, fetcher as unknown as typeof fetch)
    const result = await client.listReviews('token', 'accounts/1/locations/2')
    expect(result.reviews.map((r) => [r.reviewId, r.rating])).toEqual([
      ['a', 5],
      ['b', 3],
    ])
    expect(result.reviews[1]?.authorName).toBe('Usuario de Google')
    expect(urls[1]).toContain('pageToken=p2')
    expect(result.totalReviewCount).toBe(2)
  })

  it('flags revoked refresh tokens as re-auth required', async () => {
    const client = createGbpClient(creds, (async () => json({ error: 'invalid_grant' }, 400)) as unknown as typeof fetch)
    await expect(client.accessToken('rt')).rejects.toMatchObject({ reauthRequired: true })
  })
})
