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

/* -------------------------------------------------------------------------- */
/*  Search: fuzzy match across professionals, services and testimonials.      */
/* -------------------------------------------------------------------------- */

export type SearchHitType = 'professional' | 'service' | 'testimonial'

export interface SearchHit {
  type: SearchHitType
  title: string
  subtitle?: string
  snippet?: string
  href: string
  score: number
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/** True if every character of `query` appears in `target` in the same order (fuzzy match). */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i]![0] = i
  for (let j = 0; j <= n; j++) dp[0]![j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!)
    }
  }
  return dp[m]![n]!
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function scoreMatch(query: string, target: string): number {
  const t = normalize(target)
  if (!t) return 0
  if (t === query) return 100
  if (t.startsWith(query)) return 80
  if (t.includes(query)) return 60
  // Fuzzy tolerante a typos: solo si query >= 4 chars y una palabra del
  // target esta a distancia Levenshtein <= 1 (query corta) o <= 2 (larga).
  if (query.length >= 4) {
    const words = t.split(/[\s,;.!?()-]+/).filter((w) => w.length >= 3)
    const maxDist = query.length <= 5 ? 1 : 2
    for (const w of words) {
      if (levenshtein(query, w) <= maxDist) return 30
    }
  }
  return 0
}

/**
 * Full-text-ish search over published content. Simple and cheap: reads the
 * published snapshots and applies fuzzy scoring in JS. Tolerant to typos
 * via subsequence matching for queries >= 3 chars.
 */
export async function searchPublished(query: string, limit = 12): Promise<SearchHit[]> {
  const q = normalize(query)
  if (q.length < 2) return []

  const c = await collections()
  const rows = await c.publishedProfiles
    .find(
      {},
      {
        projection: {
          'profile.slug': 1,
          'profile.name': 1,
          'profile.professionalTitle': 1,
          'profile.scriptTitle': 1,
          'profile.shortDescription': 1,
          'profile.biography': 1,
          'profile.services': 1,
          'profile.specialties': 1,
        },
      },
    )
    .limit(200)
    .toArray()

  const hits: SearchHit[] = []

  for (const row of rows) {
    const p = row.profile
    if (!p?.slug || !p?.name) continue

    const name = p.name
    const title = p.professionalTitle ?? ''
    const script = p.scriptTitle ?? ''
    const bio = p.biography ?? ''

    // Professional (name / title / script / specialties)
    let bestScore = 0
    let matchedOn = ''
    for (const field of [name, title, script]) {
      const s = scoreMatch(q, field)
      if (s > bestScore) {
        bestScore = s
        matchedOn = field
      }
    }
    if (!bestScore && Array.isArray(p.specialties)) {
      for (const sp of p.specialties) {
        const s = scoreMatch(q, sp.label ?? '')
        if (s > bestScore) {
          bestScore = s
          matchedOn = sp.label ?? ''
        }
      }
    }
    if (bestScore) {
      hits.push({
        type: 'professional',
        title: name,
        subtitle: matchedOn && matchedOn !== name ? matchedOn : title || script,
        href: `/${p.slug}`,
        score: bestScore + 5,
      })
    }

    // Services
    if (Array.isArray(p.services)) {
      for (const s of p.services) {
        const sName = s.name ?? ''
        const sDesc = s.description ?? ''
        const ss = Math.max(scoreMatch(q, sName), scoreMatch(q, sDesc) - 10)
        if (ss > 0) {
          hits.push({
            type: 'service',
            title: sName,
            subtitle: `Servicio de ${name}`,
            href: `/${p.slug}#servicios`,
            score: ss,
          })
        }
      }
    }

    // Biography fallback (lower priority)
    if (!bestScore && bio && scoreMatch(q, bio) > 0) {
      hits.push({
        type: 'professional',
        title: name,
        subtitle: title || script,
        snippet: bio.slice(0, 90) + '…',
        href: `/${p.slug}`,
        score: 15,
      })
    }
  }

  // Testimonials (manual)
  const tRegex = new RegExp(escapeRegex(query.trim()), 'i')
  const tRows = await c.testimonials
    .find(
      { enabled: true, $or: [{ authorName: tRegex }, { content: tRegex }] },
      { projection: { authorName: 1, content: 1, professionalId: 1 } },
    )
    .limit(8)
    .toArray()

  if (tRows.length > 0) {
    const ids = Array.from(
      new Set(tRows.map((t) => t.professionalId?.toHexString()).filter((x): x is string => Boolean(x))),
    )
    const objIds = ids.map((id) => toObjectId(id)).filter((x): x is ObjectId => x !== null)
    const profs = await c.professionals
      .find({ _id: { $in: objIds } }, { projection: { _id: 1, slug: 1, name: 1 } })
      .toArray()
    const byId = new Map(profs.map((p) => [p._id.toHexString(), p]))
    for (const t of tRows) {
      const owner = t.professionalId ? byId.get(t.professionalId.toHexString()) : null
      if (!owner) continue
      hits.push({
        type: 'testimonial',
        title: `Reseña de ${t.authorName}`,
        subtitle: `Sobre ${owner.name}`,
        snippet: t.content.slice(0, 90) + (t.content.length > 90 ? '…' : ''),
        href: `/${owner.slug}#testimonios`,
        score: 20,
      })
    }
  }

  // Dedupe and sort
  const seen = new Set<string>()
  const deduped = hits.filter((h) => {
    const key = `${h.type}|${h.href}|${h.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return deduped.sort((a, b) => b.score - a.score).slice(0, limit)
}
