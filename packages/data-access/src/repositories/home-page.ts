import { collections, ObjectId } from '@repo/database'
import {
  createLandingSection,
  DEFAULT_LANDING_SECTION_TYPES,
  homePageInputSchema,
  shortId,
  type AuditActor,
  type HomePageDocument,
  type HomePageInput,
  type PublicHomePage,
} from '@repo/domain'
import { ConflictError, DomainRuleError, NotFoundError } from '../errors'
import { recordAudit } from './audit'

const ID = 'home' as const

function defaultDraft(): HomePageInput {
  return homePageInputSchema.parse({
    sections: DEFAULT_LANDING_SECTION_TYPES.map((type, i) => createLandingSection(type, shortId('l'), i)),
  })
}

/** Draft of the landing (created with a default composition on first access). */
export async function getHomePageDraft(): Promise<HomePageDocument> {
  const c = await collections()
  const doc = await c.homePage.findOne({ _id: ID })
  if (!doc) {
    return { ...defaultDraft(), revision: 0, publishedRevision: null, updatedAt: new Date(0), publishedAt: null }
  }
  const parsed = homePageInputSchema.safeParse(doc.draft)
  return {
    ...(parsed.success ? parsed.data : defaultDraft()),
    revision: doc.revision,
    publishedRevision: doc.publishedRevision,
    updatedAt: doc.updatedAt,
    publishedAt: doc.publishedAt,
    updatedBy: doc.updatedBy,
  }
}

/** Saves the draft with optimistic concurrency. The public site is unaffected. */
export async function saveHomePageDraft(input: HomePageInput, expectedRevision: number, actor: AuditActor): Promise<HomePageDocument> {
  const draft = homePageInputSchema.parse(input)
  const c = await collections()
  const now = new Date()
  if (expectedRevision === 0) {
    const inserted = await c.homePage
      .insertOne({ _id: ID, draft, revision: 1, published: null, publishedRevision: null, updatedAt: now, publishedAt: null, updatedBy: actor.id })
      .then(() => true)
      .catch(() => false)
    if (!inserted) throw new ConflictError('La página fue modificada por otra persona. Recarga para ver la última versión.', 'revision')
  } else {
    const updated = await c.homePage.findOneAndUpdate(
      { _id: ID, revision: expectedRevision },
      { $set: { draft, updatedAt: now, updatedBy: actor.id }, $inc: { revision: 1 } },
    )
    if (!updated) throw new ConflictError('La página fue modificada por otra persona. Recarga para ver la última versión.', 'revision')
  }
  await recordAudit(actor, 'landing.updated', 'homePage', ID)
  return getHomePageDraft()
}

/** Publishes the current draft as an immutable snapshot (+ revision history). */
export async function publishHomePage(actor: AuditActor): Promise<{ revision: number }> {
  const c = await collections()
  const doc = await c.homePage.findOne({ _id: ID })
  if (!doc) throw new NotFoundError('Guarda la página antes de publicarla')
  const parsed = homePageInputSchema.safeParse(doc.draft)
  if (!parsed.success) throw new DomainRuleError('El borrador tiene errores de validación; revísalo antes de publicar')
  const now = new Date()
  const page: PublicHomePage = { ...parsed.data, revision: doc.revision, publishedAt: now.toISOString() }
  await c.homePage.updateOne({ _id: ID }, { $set: { published: page, publishedRevision: doc.revision, publishedAt: now } })
  await c.homePageRevisions.updateOne(
    { revision: doc.revision },
    { $setOnInsert: { _id: new ObjectId(), revision: doc.revision, publishedAt: now, publishedBy: actor.email, page } },
    { upsert: true },
  )
  await recordAudit(actor, 'landing.published', 'homePage', ID, { revision: doc.revision })
  return { revision: doc.revision }
}

/** Published landing for the public site (null when never published). */
export async function getPublishedHomePage(): Promise<PublicHomePage | null> {
  const c = await collections()
  const doc = await c.homePage.findOne({ _id: ID }, { projection: { published: 1 } })
  return doc?.published ?? null
}

export async function listHomePageRevisions() {
  const c = await collections()
  const rows = await c.homePageRevisions
    .find({}, { projection: { revision: 1, publishedAt: 1, publishedBy: 1 } })
    .sort({ revision: -1 })
    .limit(20)
    .toArray()
  return rows.map((r) => ({ revision: r.revision, publishedAt: r.publishedAt, publishedBy: r.publishedBy }))
}

/** Copies a published revision back into the draft (as a new draft revision). */
export async function restoreHomePageRevision(revision: number, expectedRevision: number, actor: AuditActor) {
  const c = await collections()
  const row = await c.homePageRevisions.findOne({ revision })
  if (!row) throw new NotFoundError('Revisión no encontrada')
  const { revision: _r, publishedAt: _p, ...input } = row.page
  return saveHomePageDraft(input, expectedRevision, actor)
}
