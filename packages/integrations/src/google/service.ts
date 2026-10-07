import { env } from '@repo/config'
import {
  getIntegration,
  listGbpLocationsInUse,
  recordAudit,
  replaceLocationReviews,
  SYSTEM_ACTOR,
  updateIntegration,
} from '@repo/data-access'
import type { AuditActor } from '@repo/domain'
import { decryptSecret } from '../crypto'
import { createGbpClient, type GbpCredentials } from './business-profile'
import { ProviderError } from './http'
import { createPlacesClient } from './places'

export function getPlacesClient() {
  const apiKey = env().GOOGLE_MAPS_API_KEY
  return apiKey ? createPlacesClient({ apiKey }) : null
}

export function getGbpCredentials(): GbpCredentials | null {
  const e = env()
  if (!e.GOOGLE_CLIENT_ID || !e.GOOGLE_CLIENT_SECRET || !e.INTEGRATION_ENCRYPTION_KEY) return null
  return {
    clientId: e.GOOGLE_CLIENT_ID,
    clientSecret: e.GOOGLE_CLIENT_SECRET,
    redirectUri: e.GOOGLE_REDIRECT_URI ?? `${e.ADMIN_BASE_URL}/api/integrations/google/callback`,
  }
}

/** Returns an access token for the connected GBP account, or throws ProviderError. */
export async function getGbpAccess() {
  const credentials = getGbpCredentials()
  if (!credentials) throw new ProviderError('Google Business Profile is not configured')
  const integration = await getIntegration('google_business_profile')
  if (!integration.refreshToken) throw new ProviderError('Google Business Profile is not connected', 401, true)
  const client = createGbpClient(credentials)
  const accessToken = await client.accessToken(decryptSecret(integration.refreshToken))
  return { client, accessToken }
}

export interface SyncSummary {
  locations: number
  reviews: number
  status: 'ok' | 'error' | 'reauth_required' | 'skipped'
  error?: string
  slugs: string[]
}

/**
 * Syncs reviews of every GBP location linked to a professional. Used by the
 * manual "Sincronizar" button and by the daily cron endpoint.
 */
export async function syncBusinessProfileReviews(actor: AuditActor = SYSTEM_ACTOR): Promise<SyncSummary> {
  const integration = await getIntegration('google_business_profile')
  if (!getGbpCredentials() || !integration.enabled || !integration.refreshToken) {
    return { locations: 0, reviews: 0, status: 'skipped', slugs: [] }
  }
  const links = await listGbpLocationsInUse()
  const byLocation = new Map<string, string[]>()
  for (const l of links) byLocation.set(l.locationName, [...(byLocation.get(l.locationName) ?? []), l.slug])

  let total = 0
  try {
    const { client, accessToken } = await getGbpAccess()
    for (const locationName of byLocation.keys()) {
      const { reviews } = await client.listReviews(accessToken, locationName)
      await replaceLocationReviews(
        locationName,
        reviews.map((r) => ({ ...r, locationName })),
      )
      total += reviews.length
    }
    await updateIntegration('google_business_profile', { lastSyncAt: new Date(), lastSyncStatus: 'ok', lastError: null })
    await recordAudit(actor, 'integration.synced', 'integration', 'google_business_profile', {
      locations: byLocation.size,
      reviews: total,
    })
    return { locations: byLocation.size, reviews: total, status: 'ok', slugs: links.map((l) => l.slug) }
  } catch (error) {
    const reauth = error instanceof ProviderError && error.reauthRequired
    const message = error instanceof Error ? error.message.slice(0, 200) : 'Unknown error'
    await updateIntegration('google_business_profile', {
      lastSyncAt: new Date(),
      lastSyncStatus: reauth ? 'reauth_required' : 'error',
      lastError: message,
    })
    return { locations: byLocation.size, reviews: total, status: reauth ? 'reauth_required' : 'error', error: message, slugs: [] }
  }
}
