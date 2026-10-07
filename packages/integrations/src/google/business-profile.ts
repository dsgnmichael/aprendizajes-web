import { fetchJson, ProviderError, type FetchLike } from './http'

/**
 * Google Business Profile (GBP) client for organisations that own/manage a
 * verified location. OAuth 2.0 (authorization code + offline refresh token).
 * Client id/secret live ONLY in environment variables; the refresh token is
 * stored encrypted (AES-256-GCM) by the caller.
 */
export const GBP_SCOPE = 'https://www.googleapis.com/auth/business.manage'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
const INFO_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const REVIEWS_URL = 'https://mybusiness.googleapis.com/v4'

export interface GbpCredentials {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface GbpReview {
  reviewId: string
  authorName: string
  authorPhotoUrl: string | null
  rating: number | null
  comment: string
  createTime: Date
  updateTime: Date
}

const STARS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }

export function buildGbpAuthUrl(credentials: GbpCredentials, state: string): string {
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    response_type: 'code',
    scope: GBP_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `${AUTH_URL}?${params.toString()}`
}

export function createGbpClient(credentials: GbpCredentials, fetcher: FetchLike = fetch) {
  async function token(params: Record<string, string>) {
    return fetchJson<{ access_token: string; refresh_token?: string; expires_in: number; scope?: string }>(
      fetcher,
      TOKEN_URL,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          ...params,
        }).toString(),
      },
    )
  }

  return {
    async exchangeCode(code: string) {
      const result = await token({ code, grant_type: 'authorization_code', redirect_uri: credentials.redirectUri })
      if (!result.refresh_token) {
        throw new ProviderError('Google did not return a refresh token; revoke access and try again')
      }
      return { accessToken: result.access_token, refreshToken: result.refresh_token, scopes: (result.scope ?? '').split(' ') }
    },

    async accessToken(refreshToken: string): Promise<string> {
      try {
        const result = await token({ refresh_token: refreshToken, grant_type: 'refresh_token' })
        return result.access_token
      } catch (error) {
        if (error instanceof ProviderError && (error.status === 400 || error.status === 401)) {
          throw new ProviderError('Authorization expired or revoked', error.status, true)
        }
        throw error
      }
    },

    async revoke(refreshToken: string) {
      await fetcher(`${REVOKE_URL}?token=${encodeURIComponent(refreshToken)}`, { method: 'POST' }).catch(() => undefined)
    },

    async listAccounts(accessToken: string) {
      const data = await fetchJson<{ accounts?: { name: string; accountName?: string; type?: string }[] }>(
        fetcher,
        ACCOUNTS_URL,
        { headers: { authorization: `Bearer ${accessToken}` } },
      )
      return (data.accounts ?? []).map((a) => ({ name: a.name, label: a.accountName ?? a.name, type: a.type ?? '' }))
    },

    async listLocations(accessToken: string, accountName: string) {
      const out: { name: string; title: string; address: string }[] = []
      let pageToken: string | undefined
      do {
        const params = new URLSearchParams({ readMask: 'name,title,storefrontAddress', pageSize: '100' })
        if (pageToken) params.set('pageToken', pageToken)
        const data = await fetchJson<{
          locations?: { name: string; title?: string; storefrontAddress?: { addressLines?: string[]; locality?: string } }[]
          nextPageToken?: string
        }>(fetcher, `${INFO_URL}/${accountName}/locations?${params}`, {
          headers: { authorization: `Bearer ${accessToken}` },
        })
        for (const l of data.locations ?? []) {
          out.push({
            // Reviews API (v4) addresses locations as accounts/{a}/locations/{l}.
            name: `${accountName}/${l.name}`,
            title: l.title ?? l.name,
            address: [...(l.storefrontAddress?.addressLines ?? []), l.storefrontAddress?.locality].filter(Boolean).join(', '),
          })
        }
        pageToken = data.nextPageToken
      } while (pageToken && out.length < 1000)
      return out
    },

    /** Fetches ALL reviews of a location following `nextPageToken` pagination. */
    async listReviews(accessToken: string, locationName: string, maxPages = 20) {
      const reviews: GbpReview[] = []
      let averageRating: number | null = null
      let totalReviewCount: number | null = null
      let pageToken: string | undefined
      let pages = 0
      do {
        const params = new URLSearchParams({ pageSize: '50', orderBy: 'updateTime desc' })
        if (pageToken) params.set('pageToken', pageToken)
        const data = await fetchJson<{
          reviews?: {
            reviewId: string
            reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean }
            starRating?: string
            comment?: string
            createTime: string
            updateTime: string
          }[]
          averageRating?: number
          totalReviewCount?: number
          nextPageToken?: string
        }>(fetcher, `${REVIEWS_URL}/${locationName}/reviews?${params}`, {
          headers: { authorization: `Bearer ${accessToken}` },
        })
        averageRating = data.averageRating ?? averageRating
        totalReviewCount = data.totalReviewCount ?? totalReviewCount
        for (const r of data.reviews ?? []) {
          reviews.push({
            reviewId: r.reviewId,
            authorName: r.reviewer?.isAnonymous ? 'Usuario de Google' : (r.reviewer?.displayName ?? 'Usuario de Google'),
            authorPhotoUrl: r.reviewer?.profilePhotoUrl ?? null,
            rating: r.starRating ? (STARS[r.starRating] ?? null) : null,
            comment: r.comment ?? '',
            createTime: new Date(r.createTime),
            updateTime: new Date(r.updateTime),
          })
        }
        pageToken = data.nextPageToken
        pages++
      } while (pageToken && pages < maxPages)
      return { reviews, averageRating, totalReviewCount }
    },
  }
}

export type GbpClient = ReturnType<typeof createGbpClient>
