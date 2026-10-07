'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { features } from '@repo/config'
import {
  clearIntegrationCredentials,
  getIntegration,
  getProfessionalById,
  hitRateLimit,
  listSyncedBusinessReviews,
  recordAudit,
  updateIntegration,
} from '@repo/data-access'
import { CACHE_TAGS, objectIdSchema, type TestimonialDTO } from '@repo/domain'
import { decryptSecret } from '@repo/integrations/crypto'
import {
  getGbpAccess,
  getGbpCredentials,
  getPlacesClient,
  syncBusinessProfileReviews,
  createGbpClient,
} from '@repo/integrations/google'
import type { SessionUser } from '@repo/auth'
import { ActionError, runAction, WithWarning } from '@/lib/action'
import { toActor } from '@/lib/auth'
import { profileTags, revalidatePublic } from '@/lib/revalidate'

async function limit(user: SessionUser, key: string, max = 30) {
  const result = await hitRateLimit(`integrations:${key}:${user.id}`, max, 600)
  if (!result.allowed)
    throw new ActionError('Demasiadas solicitudes a Google. Espera unos minutos.')
}

function places() {
  const client = getPlacesClient()
  if (!client) throw new ActionError('GOOGLE_MAPS_API_KEY no está configurada en el servidor.')
  return client
}

const placeIdSchema = z.string().trim().min(3).max(300)

export async function placesSearchAction(query: string) {
  return runAction('professionals:write', async (user) => {
    await limit(user, 'places-search')
    return places().searchText(z.string().trim().min(2).max(200).parse(query))
  })
}

export async function placesTestAction(placeId: string) {
  return runAction('professionals:write', async (user) => {
    await limit(user, 'places-test')
    const summary = await places().getPlaceSummary(placeIdSchema.parse(placeId))
    await updateIntegration('google_places', {
      lastTestedAt: new Date(),
      lastTestOk: true,
      lastError: null,
    })
    return summary
  })
}

export async function setPlacesEnabledAction(enabled: boolean) {
  return runAction('integrations:configure', async (user) => {
    await updateIntegration('google_places', { enabled: z.boolean().parse(enabled) })
    await recordAudit(toActor(user), 'integration.updated', 'integration', 'google_places', {
      enabled,
    })
    revalidatePath('/integrations')
    return null
  })
}

export async function gbpAccountsAction() {
  return runAction('professionals:write', async (user) => {
    await limit(user, 'gbp-accounts')
    const { client, accessToken } = await getGbpAccess()
    return client.listAccounts(accessToken)
  })
}

export async function gbpLocationsAction(accountName: string) {
  return runAction('professionals:write', async (user) => {
    await limit(user, 'gbp-locations')
    const name = z
      .string()
      .regex(/^accounts\/[\w-]+$/)
      .parse(accountName)
    const { client, accessToken } = await getGbpAccess()
    return client.listLocations(accessToken, name)
  })
}

export async function gbpTestAction() {
  return runAction('integrations:configure', async (user) => {
    await limit(user, 'gbp-test')
    try {
      const { client, accessToken } = await getGbpAccess()
      const accounts = await client.listAccounts(accessToken)
      await updateIntegration('google_business_profile', {
        lastTestedAt: new Date(),
        lastTestOk: true,
        lastError: null,
      })
      revalidatePath('/integrations')
      return { accounts: accounts.length }
    } catch (error) {
      await updateIntegration('google_business_profile', {
        lastTestedAt: new Date(),
        lastTestOk: false,
        lastError: error instanceof Error ? error.message.slice(0, 200) : 'Error',
      })
      revalidatePath('/integrations')
      throw error
    }
  })
}

export async function gbpSyncAction() {
  return runAction('integrations:configure', async (user) => {
    await limit(user, 'gbp-sync', 10)
    const summary = await syncBusinessProfileReviews(toActor(user))
    revalidatePath('/integrations')
    if (summary.status === 'reauth_required')
      throw new ActionError('La autorización de Google expiró. Vuelve a conectar la cuenta.')
    if (summary.status === 'error')
      throw new ActionError(`La sincronización falló: ${summary.error ?? 'error desconocido'}`)
    if (summary.status === 'skipped')
      throw new ActionError('Google Business Profile no está conectado o está desactivado.')
    const warning = await revalidatePublic([...profileTags(...summary.slugs), CACHE_TAGS.directory])
    return new WithWarning({ locations: summary.locations, reviews: summary.reviews }, warning)
  })
}

export async function gbpDisconnectAction() {
  return runAction('integrations:connect', async (user) => {
    const integration = await getIntegration('google_business_profile')
    const credentials = getGbpCredentials()
    if (integration.refreshToken && credentials) {
      try {
        await createGbpClient(credentials).revoke(decryptSecret(integration.refreshToken))
      } catch {
        // Revocation is best effort: credentials are removed locally anyway.
      }
    }
    await clearIntegrationCredentials('google_business_profile')
    await recordAudit(
      toActor(user),
      'integration.disconnected',
      'integration',
      'google_business_profile',
    )
    revalidatePath('/integrations')
    return null
  })
}

export interface GoogleReviewsPanel {
  placesConfigured: boolean
  gbpConfigured: boolean
  places: { items: TestimonialDTO[]; error: string | null } | null
  gbp: { items: TestimonialDTO[] } | null
}

/**
 * Read-only Google reviews for the editor's "hide review" panel. Places
 * content is fetched live and NOT stored; only review identifiers are saved
 * (in the draft's hiddenReviewIds) when the admin hides one.
 */
export async function googleReviewsForProfessionalAction(id: string) {
  return runAction('professionals:read', async (user): Promise<GoogleReviewsPanel> => {
    await limit(user, 'reviews-panel')
    const professional = await getProfessionalById(objectIdSchema.parse(id))
    if (!professional) throw new ActionError('Profesional no encontrado')
    const { googlePlaceId, gbpLocationName } = professional.testimonials
    let placesResult: GoogleReviewsPanel['places'] = null
    if (googlePlaceId && features.googlePlaces()) {
      try {
        placesResult = { items: (await places().getReviews(googlePlaceId)).items, error: null }
      } catch (error) {
        placesResult = { items: [], error: error instanceof Error ? error.message : 'Error' }
      }
    }
    const gbpResult = gbpLocationName
      ? { items: await listSyncedBusinessReviews(gbpLocationName, 100) }
      : null
    return {
      placesConfigured: features.googlePlaces(),
      gbpConfigured: features.googleBusinessProfile(),
      places: placesResult,
      gbp: gbpResult,
    }
  })
}
