import { collections, ObjectId, toObjectId, type ProfessionalModel } from '@repo/database'
import {
  createSection,
  DEFAULT_SECTION_TYPES,
  professionalInputSchema,
  shortId,
  slugify,
  toPublicProfile,
  type AuditActor,
  type ProfessionalCreate,
  type ProfessionalDocument,
  type ProfessionalInput,
  type ProfessionalStatus,
  type ProfessionalSummary,
  type PublicProfile,
} from '@repo/domain'
import type { Filter } from 'mongodb'
import { ConflictError, DomainRuleError, isDuplicateKeyError, NotFoundError } from '../errors'
import { recordAudit } from './audit'

function toDocument(model: ProfessionalModel): ProfessionalDocument {
  const { _id, ...rest } = model
  return { ...rest, id: _id.toHexString() }
}

const SUMMARY_PROJECTION = {
  name: 1,
  slug: 1,
  professionalTitle: 1,
  status: 1,
  revision: 1,
  publishedRevision: 1,
  updatedAt: 1,
  publishedAt: 1,
  displayOrder: 1,
  isDemo: 1,
  'images.avatar': 1,
  'images.profile': 1,
} as const

export interface ListProfessionalsQuery {
  status?: ProfessionalStatus | 'all'
  search?: string
}

export async function listProfessionals(query: ListProfessionalsQuery = {}): Promise<ProfessionalSummary[]> {
  const c = await collections()
  const filter: Filter<ProfessionalModel> = {}
  if (query.status === undefined) filter.status = { $ne: 'archived' }
  else if (query.status !== 'all') filter.status = query.status
  if (query.search?.trim()) {
    const rx = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: rx }, { slug: rx }, { professionalTitle: rx }]
  }
  const rows = await c.professionals
    .find(filter, { projection: SUMMARY_PROJECTION })
    .sort({ displayOrder: 1, name: 1 })
    .limit(500)
    .toArray()
  return rows.map((row) => ({
    id: row._id.toHexString(),
    name: row.name,
    slug: row.slug,
    professionalTitle: row.professionalTitle,
    status: row.status,
    revision: row.revision,
    publishedRevision: row.publishedRevision,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    displayOrder: row.displayOrder,
    isDemo: row.isDemo,
    avatar: row.images?.avatar ?? row.images?.profile,
  }))
}

export async function getProfessionalById(id: string): Promise<ProfessionalDocument | null> {
  const _id = toObjectId(id)
  if (!_id) return null
  const c = await collections()
  const model = await c.professionals.findOne({ _id })
  return model ? toDocument(model) : null
}

export async function isSlugAvailable(slug: string, exceptId?: string): Promise<boolean> {
  const c = await collections()
  const existing = await c.professionals.findOne({ slug }, { projection: { _id: 1 } })
  return !existing || existing._id.toHexString() === exceptId
}

function defaultInput(create: ProfessionalCreate): ProfessionalInput {
  return professionalInputSchema.parse({
    ...create,
    sections: DEFAULT_SECTION_TYPES.map((type, index) => createSection(type, shortId('s'), index)),
  })
}

export async function createProfessional(
  input: ProfessionalCreate | ProfessionalInput,
  actor: AuditActor,
  options: { status?: ProfessionalStatus } = {},
): Promise<ProfessionalDocument> {
  const c = await collections()
  const data = 'sections' in input ? professionalInputSchema.parse(input) : defaultInput(input)
  const now = new Date()
  const maxOrder = await c.professionals.find({}, { projection: { displayOrder: 1 } }).sort({ displayOrder: -1 }).limit(1).next()
  const model: ProfessionalModel = {
    _id: new ObjectId(),
    ...data,
    displayOrder: 'sections' in input ? data.displayOrder : (maxOrder?.displayOrder ?? -1) + 1,
    status: options.status ?? 'draft',
    revision: 1,
    publishedRevision: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    createdBy: actor.id,
    updatedBy: actor.id,
  }
  try {
    await c.professionals.insertOne(model)
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new ConflictError('El slug ya está en uso', 'slug')
    throw error
  }
  await recordAudit(actor, 'professional.created', 'professional', model._id.toHexString(), {
    slug: model.slug,
  })
  return toDocument(model)
}

/**
 * Saves the draft. Uses optimistic concurrency on `revision` so two editors
 * can't silently overwrite each other. The public site is NOT affected.
 */
export async function saveProfessionalDraft(
  id: string,
  input: ProfessionalInput,
  expectedRevision: number,
  actor: AuditActor,
): Promise<ProfessionalDocument> {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Profesional no encontrado')
  const data = professionalInputSchema.parse(input)
  const c = await collections()
  try {
    const updated = await c.professionals.findOneAndUpdate(
      { _id, revision: expectedRevision },
      {
        $set: { ...data, updatedAt: new Date(), updatedBy: actor.id },
        $inc: { revision: 1 },
      },
      { returnDocument: 'after' },
    )
    if (!updated) {
      const exists = await c.professionals.countDocuments({ _id }, { limit: 1 })
      if (!exists) throw new NotFoundError('Profesional no encontrado')
      throw new ConflictError(
        'Otra persona guardó cambios en este perfil. Recarga para ver la última versión.',
        'revision',
      )
    }
    await recordAudit(actor, 'professional.updated', 'professional', id, { revision: updated.revision })
    return toDocument(updated)
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new ConflictError('El slug ya está en uso', 'slug')
    throw error
  }
}

export interface PublishResult {
  slug: string
  previousSlug: string | null
  revision: number
}

/**
 * Publishes the current draft as an immutable snapshot. The web app reads
 * only `publishedProfiles`, so it never sees half-edited data.
 */
export async function publishProfessional(id: string, actor: AuditActor): Promise<PublishResult> {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Profesional no encontrado')
  const c = await collections()
  const model = await c.professionals.findOne({ _id })
  if (!model) throw new NotFoundError('Profesional no encontrado')
  if (model.status === 'archived') throw new DomainRuleError('Restaura el profesional antes de publicarlo')

  const doc = toDocument(model)
  // Re-validate the draft at the publish boundary.
  const parsed = professionalInputSchema.safeParse(doc)
  if (!parsed.success) throw new DomainRuleError('El borrador tiene errores de validación; revísalo antes de publicar')

  const now = new Date()
  const profile = toPublicProfile({ ...doc, ...parsed.data }, now)
  const previous = await c.publishedProfiles.findOne({ professionalId: _id }, { projection: { slug: 1 } })

  try {
    await c.publishedProfiles.updateOne(
      { professionalId: _id },
      {
        $set: {
          slug: doc.slug,
          revision: doc.revision,
          displayOrder: doc.displayOrder,
          publishedAt: now,
          profile,
          hiddenReviewIds: doc.testimonials.hiddenReviewIds,
        },
        $setOnInsert: { _id: new ObjectId(), professionalId: _id },
      },
      { upsert: true },
    )
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new ConflictError('Ya existe una página publicada con ese slug', 'slug')
    throw error
  }

  await c.profileRevisions.updateOne(
    { professionalId: _id, revision: doc.revision },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        professionalId: _id,
        revision: doc.revision,
        publishedAt: now,
        publishedBy: actor.email,
        profile,
      },
    },
    { upsert: true },
  )
  await c.professionals.updateOne(
    { _id },
    { $set: { status: 'published', publishedRevision: doc.revision, publishedAt: now } },
  )
  await recordAudit(actor, 'professional.published', 'professional', id, {
    slug: doc.slug,
    revision: doc.revision,
  })
  return {
    slug: doc.slug,
    previousSlug: previous && previous.slug !== doc.slug ? previous.slug : null,
    revision: doc.revision,
  }
}

async function removeSnapshot(_id: ObjectId) {
  const c = await collections()
  const removed = await c.publishedProfiles.findOneAndDelete({ professionalId: _id }, { projection: { slug: 1 } })
  return removed?.slug ?? null
}

export async function unpublishProfessional(id: string, actor: AuditActor): Promise<string | null> {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Profesional no encontrado')
  const c = await collections()
  const slug = await removeSnapshot(_id)
  await c.professionals.updateOne({ _id }, { $set: { status: 'draft', publishedRevision: null } })
  await recordAudit(actor, 'professional.unpublished', 'professional', id, { slug })
  return slug
}

export async function archiveProfessional(id: string, actor: AuditActor): Promise<string | null> {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Profesional no encontrado')
  const c = await collections()
  const slug = await removeSnapshot(_id)
  await c.professionals.updateOne(
    { _id },
    { $set: { status: 'archived', publishedRevision: null, updatedAt: new Date() } },
  )
  await recordAudit(actor, 'professional.archived', 'professional', id, { slug })
  return slug
}

export async function restoreProfessional(id: string, actor: AuditActor): Promise<void> {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Profesional no encontrado')
  const c = await collections()
  await c.professionals.updateOne({ _id, status: 'archived' }, { $set: { status: 'draft', updatedAt: new Date() } })
  await recordAudit(actor, 'professional.updated', 'professional', id, { restored: true })
}

export async function deleteProfessional(id: string, actor: AuditActor): Promise<void> {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Profesional no encontrado')
  const c = await collections()
  const model = await c.professionals.findOne({ _id }, { projection: { status: 1, slug: 1 } })
  if (!model) throw new NotFoundError('Profesional no encontrado')
  if (model.status !== 'archived') throw new DomainRuleError('Solo se pueden eliminar profesionales archivados')
  await Promise.all([
    c.professionals.deleteOne({ _id }),
    c.publishedProfiles.deleteOne({ professionalId: _id }),
    c.profileRevisions.deleteMany({ professionalId: _id }),
    c.testimonials.deleteMany({ professionalId: _id }),
  ])
  await recordAudit(actor, 'professional.deleted', 'professional', id, { slug: model.slug })
}

export async function duplicateProfessional(id: string, actor: AuditActor): Promise<ProfessionalDocument> {
  const source = await getProfessionalById(id)
  if (!source) throw new NotFoundError('Profesional no encontrado')
  let slug = slugify(`${source.slug}-copia`)
  for (let i = 2; !(await isSlugAvailable(slug)); i++) slug = slugify(`${source.slug}-copia-${i}`)
  const { id: _omit, status: _s, revision: _r, publishedRevision: _p, createdAt: _c, updatedAt: _u, publishedAt: _pa, createdBy: _cb, updatedBy: _ub, ...input } = source
  const copy = await createProfessional(
    {
      ...input,
      name: `${source.name} (copia)`,
      slug,
      sections: source.sections.map((s) => ({ ...s, id: shortId('s') })),
    },
    actor,
  )
  await recordAudit(actor, 'professional.duplicated', 'professional', copy.id, { from: id })
  return copy
}

export async function reorderProfessionals(ids: string[], actor: AuditActor): Promise<void> {
  const c = await collections()
  const ops = ids
    .map((id, index) => ({ _id: toObjectId(id), index }))
    .filter((x): x is { _id: ObjectId; index: number } => x._id !== null)
  if (ops.length === 0) return
  await c.professionals.bulkWrite(
    ops.map(({ _id, index }) => ({ updateOne: { filter: { _id }, update: { $set: { displayOrder: index } } } })),
  )
  // Ordering is public metadata: apply it to the snapshots right away.
  await c.publishedProfiles.bulkWrite(
    ops.map(({ _id, index }) => ({
      updateOne: { filter: { professionalId: _id }, update: { $set: { displayOrder: index } } },
    })),
  )
  await recordAudit(actor, 'professional.updated', 'professional', null, { reordered: ids.length })
}

export async function listRevisions(id: string) {
  const _id = toObjectId(id)
  if (!_id) return []
  const c = await collections()
  const rows = await c.profileRevisions
    .find({ professionalId: _id }, { projection: { revision: 1, publishedAt: 1, publishedBy: 1 } })
    .sort({ revision: -1 })
    .limit(20)
    .toArray()
  return rows.map((r) => ({ revision: r.revision, publishedAt: r.publishedAt, publishedBy: r.publishedBy }))
}

/** Builds the public representation of the current DRAFT (preview only). */
export async function getDraftPreview(id: string): Promise<PublicProfile | null> {
  const doc = await getProfessionalById(id)
  if (!doc) return null
  return toPublicProfile(doc, doc.updatedAt)
}

/**
 * Copies a previously published snapshot back into the DRAFT (as a new draft
 * revision). The public site is unaffected until the draft is published again.
 * Draft-only settings that are not part of snapshots (hidden review ids,
 * display order, demo flag) are kept from the current draft.
 */
export async function restoreRevisionToDraft(
  id: string,
  revision: number,
  expectedRevision: number,
  actor: AuditActor,
): Promise<ProfessionalDocument> {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Profesional no encontrado')
  const c = await collections()
  const [snapshot, current] = await Promise.all([
    c.profileRevisions.findOne({ professionalId: _id, revision }),
    getProfessionalById(id),
  ])
  if (!snapshot || !current) throw new NotFoundError('Revisión no encontrada')
  const { id: _pid, revision: _rev, publishedAt: _at, testimonials, ...content } = snapshot.profile
  const input = professionalInputSchema.parse({
    ...content,
    testimonials: { ...testimonials, hiddenReviewIds: current.testimonials.hiddenReviewIds },
    displayOrder: current.displayOrder,
    isDemo: current.isDemo,
  })
  const saved = await saveProfessionalDraft(id, input, expectedRevision, actor)
  await recordAudit(actor, 'professional.updated', 'professional', id, { restoredRevision: revision })
  return saved
}
