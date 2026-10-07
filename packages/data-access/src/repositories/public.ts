import { collections, toObjectId, type ObjectId } from '@repo/database'
import {
  toProfessionalCard,
  type ProfessionalCard,
  type PublicProfile,
  type TestimonialDTO,
} from '@repo/domain'

/**
 * Read-only queries used by the PUBLIC web app. They only touch the
 * `publishedProfiles` snapshots (never drafts) and project the minimum.
 */
export async function getPublishedProfile(
  slug: string,
): Promise<{ profile: PublicProfile; hiddenReviewIds: string[] } | null> {
  const c = await collections()
  const row = await c.publishedProfiles.findOne(
    { slug: slug.toLowerCase() },
    { projection: { profile: 1, hiddenReviewIds: 1 } },
  )
  return row ? { profile: row.profile, hiddenReviewIds: row.hiddenReviewIds ?? [] } : null
}

export async function listPublishedCards(): Promise<ProfessionalCard[]> {
  const c = await collections()
  const rows = await c.publishedProfiles
    .find(
      {},
      {
        projection: {
          'profile.id': 1,
          'profile.slug': 1,
          'profile.name': 1,
          'profile.professionalTitle': 1,
          'profile.scriptTitle': 1,
          'profile.shortDescription': 1,
          'profile.images.avatar': 1,
          'profile.images.profile': 1,
          'profile.images.hero': 1,
        },
      },
    )
    .sort({ displayOrder: 1, publishedAt: 1 })
    .limit(200)
    .toArray()
  return rows.map((row) => toProfessionalCard(row.profile))
}

export async function listPublishedSlugs(): Promise<{ slug: string; publishedAt: Date }[]> {
  const c = await collections()
  const rows = await c.publishedProfiles
    .find({}, { projection: { slug: 1, publishedAt: 1 } })
    .sort({ displayOrder: 1 })
    .limit(1000)
    .toArray()
  return rows.map((r) => ({ slug: r.slug, publishedAt: r.publishedAt }))
}

/** Enabled manual testimonials for a professional (plus organisation-wide ones). */
export async function listPublicManualTestimonials(professionalId: string): Promise<TestimonialDTO[]> {
  const _id = toObjectId(professionalId)
  const c = await collections()
  const rows = await c.testimonials
    .find(
      { enabled: true, professionalId: _id ? { $in: [_id, null] } : null },
      {
        projection: {
          authorName: 1,
          authorDetail: 1,
          authorAvatar: 1,
          rating: 1,
          content: 1,
          date: 1,
          sourceLabel: 1,
          sourceUrl: 1,
          featured: 1,
          displayOrder: 1,
          isDemo: 1,
        },
      },
    )
    .sort({ featured: -1, displayOrder: 1, date: -1 })
    .limit(50)
    .toArray()
  return rows.map((t) => ({
    id: t._id.toHexString(),
    origin: 'manual',
    authorName: t.authorName,
    authorDetail: t.authorDetail || undefined,
    authorPhotoUrl: t.authorAvatar?.url,
    rating: t.rating,
    content: t.content,
    date: t.date ?? undefined,
    sourceLabel: t.sourceLabel || undefined,
    sourceUrl: t.sourceUrl || undefined,
    featured: t.featured,
    isDemo: t.isDemo,
  }))
}

/** GBP reviews synced for a location (owner-managed content). */
export async function listSyncedBusinessReviews(locationName: string, limit = 50): Promise<TestimonialDTO[]> {
  const c = await collections()
  const rows = await c.externalReviews
    .find({ provider: 'google_business_profile', locationName })
    .sort({ updateTime: -1 })
    .limit(limit)
    .toArray()
  return rows.map((r) => ({
    id: r.reviewId,
    origin: 'google_business_profile',
    authorName: r.authorName,
    authorPhotoUrl: r.authorPhotoUrl ?? undefined,
    rating: r.rating,
    content: r.comment,
    date: r.createTime.toISOString().slice(0, 10),
    featured: false,
  }))
}

/** Cheap existence check used by the public proxy (index-only lookup). */
export async function publishedSlugExists(slug: string): Promise<boolean> {
  const c = await collections()
  const row = await c.publishedProfiles.findOne({ slug }, { projection: { _id: 1 } })
  return row !== null
}

/**
 * Organisation-wide manual testimonials for the landing: every enabled
 * testimonial, featured first. Includes the professional's name as context.
 */
export async function listLandingTestimonials(limit = 12): Promise<TestimonialDTO[]> {
  const c = await collections()
  const rows = await c.testimonials
    .aggregate<{
      _id: ObjectId
      authorName: string
      authorDetail: string
      authorAvatar?: { url: string }
      rating: number | null
      content: string
      date: string | null
      sourceLabel: string
      featured: boolean
      isDemo: boolean
      professional?: { name: string }[]
    }>([
      { $match: { enabled: true } },
      { $sort: { featured: -1, displayOrder: 1, date: -1 } },
      { $limit: Math.min(limit, 50) },
      { $lookup: { from: 'publishedProfiles', localField: 'professionalId', foreignField: 'professionalId', as: 'professional', pipeline: [{ $project: { _id: 0, name: '$profile.name' } }] } },
      { $project: { authorName: 1, authorDetail: 1, authorAvatar: 1, rating: 1, content: 1, date: 1, sourceLabel: 1, featured: 1, isDemo: 1, professional: 1 } },
    ])
    .toArray()
  return rows.map((t) => ({
    id: t._id.toHexString(),
    origin: 'manual',
    authorName: t.authorName,
    authorDetail: [t.authorDetail, t.professional?.[0]?.name ? `sobre ${t.professional[0].name}` : ''].filter(Boolean).join(' · ') || undefined,
    authorPhotoUrl: t.authorAvatar?.url,
    rating: t.rating,
    content: t.content,
    date: t.date ?? undefined,
    sourceLabel: t.sourceLabel || undefined,
    featured: t.featured,
    isDemo: t.isDemo,
  }))
}
