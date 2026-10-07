import { collections, type EncryptedValue, type ExternalReviewModel, type IntegrationModel } from '@repo/database'
import { ObjectId } from 'mongodb'
import type { IntegrationId } from '@repo/domain'

const EMPTY = (id: IntegrationId): IntegrationModel => ({
  _id: id,
  enabled: false,
  accountLabel: null,
  refreshToken: null,
  scopes: [],
  lastTestedAt: null,
  lastTestOk: null,
  lastSyncAt: null,
  lastSyncStatus: null,
  lastError: null,
  connectedBy: null,
  connectedAt: null,
  updatedAt: new Date(0),
  pendingState: null,
})

export async function getIntegration(id: IntegrationId): Promise<IntegrationModel> {
  const c = await collections()
  return (await c.integrations.findOne({ _id: id })) ?? EMPTY(id)
}

export async function updateIntegration(
  id: IntegrationId,
  patch: Partial<Omit<IntegrationModel, '_id'>>,
): Promise<void> {
  const c = await collections()
  const { updatedAt: _u, ...rest } = patch
  const defaults = EMPTY(id)
  const setOnInsert = Object.fromEntries(
    Object.entries(defaults).filter(([k]) => k !== '_id' && k !== 'updatedAt' && !(k in rest)),
  )
  await c.integrations.updateOne(
    { _id: id },
    { $set: { ...rest, updatedAt: new Date() }, $setOnInsert: setOnInsert },
    { upsert: true },
  )
}

export async function storeRefreshToken(id: IntegrationId, token: EncryptedValue, meta: { accountLabel: string | null; scopes: string[]; userId: string }) {
  await updateIntegration(id, {
    refreshToken: token,
    accountLabel: meta.accountLabel,
    scopes: meta.scopes,
    connectedBy: meta.userId,
    connectedAt: new Date(),
    enabled: true,
    lastError: null,
    lastSyncStatus: null,
    pendingState: null,
  })
}

export async function clearIntegrationCredentials(id: IntegrationId) {
  await updateIntegration(id, {
    refreshToken: null,
    accountLabel: null,
    scopes: [],
    enabled: false,
    connectedBy: null,
    connectedAt: null,
    pendingState: null,
  })
}

export interface SyncedReview {
  reviewId: string
  locationName: string
  authorName: string
  authorPhotoUrl: string | null
  rating: number | null
  comment: string
  createTime: Date
  updateTime: Date
}

/** Replaces the synced reviews of a location (removes ones deleted upstream). */
export async function replaceLocationReviews(locationName: string, reviews: SyncedReview[]) {
  const c = await collections()
  const now = new Date()
  if (reviews.length) {
    await c.externalReviews.bulkWrite(
      reviews.map((r) => ({
        updateOne: {
          filter: { provider: 'google_business_profile' as const, reviewId: r.reviewId },
          update: {
            $set: { ...r, provider: 'google_business_profile' as const, syncedAt: now },
            $setOnInsert: { _id: new ObjectId() },
          },
          upsert: true,
        },
      })),
    )
  }
  await c.externalReviews.deleteMany({
    provider: 'google_business_profile',
    locationName,
    reviewId: { $nin: reviews.map((r) => r.reviewId) },
  })
}

export async function listGbpLocationsInUse(): Promise<{ professionalId: string; slug: string; locationName: string }[]> {
  const c = await collections()
  const rows = await c.professionals
    .find(
      { 'testimonials.gbpLocationName': { $nin: ['', null] }, status: { $ne: 'archived' } },
      { projection: { slug: 1, 'testimonials.gbpLocationName': 1 } },
    )
    .toArray()
  return rows.map((r) => ({
    professionalId: r._id.toHexString(),
    slug: r.slug,
    locationName: r.testimonials.gbpLocationName,
  }))
}

export type { ExternalReviewModel }
