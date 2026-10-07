import { collections, ObjectId, toObjectId, type TestimonialModel } from '@repo/database'
import {
  testimonialInputSchema,
  type AuditActor,
  type TestimonialDocument,
  type TestimonialInput,
} from '@repo/domain'
import type { Filter } from 'mongodb'
import { NotFoundError } from '../errors'
import { recordAudit } from './audit'

function toDocument(m: TestimonialModel): TestimonialDocument {
  const { _id, professionalId, ...rest } = m
  return { ...rest, id: _id.toHexString(), professionalId: professionalId?.toHexString() ?? null }
}

export interface TestimonialQuery {
  professionalId?: string | 'global'
  enabled?: boolean
  search?: string
}

export async function listTestimonials(query: TestimonialQuery = {}): Promise<TestimonialDocument[]> {
  const c = await collections()
  const filter: Filter<TestimonialModel> = {}
  if (query.professionalId === 'global') filter.professionalId = null
  else if (query.professionalId) filter.professionalId = toObjectId(query.professionalId)
  if (query.enabled !== undefined) filter.enabled = query.enabled
  if (query.search?.trim()) {
    const rx = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ authorName: rx }, { content: rx }]
  }
  const rows = await c.testimonials.find(filter).sort({ featured: -1, displayOrder: 1, createdAt: -1 }).limit(500).toArray()
  return rows.map(toDocument)
}

export async function getTestimonial(id: string): Promise<TestimonialDocument | null> {
  const _id = toObjectId(id)
  if (!_id) return null
  const c = await collections()
  const m = await c.testimonials.findOne({ _id })
  return m ? toDocument(m) : null
}

export async function createTestimonial(input: TestimonialInput, actor: AuditActor): Promise<TestimonialDocument> {
  const data = testimonialInputSchema.parse(input)
  const c = await collections()
  const now = new Date()
  const model: TestimonialModel = {
    _id: new ObjectId(),
    ...data,
    professionalId: toObjectId(data.professionalId),
    createdAt: now,
    updatedAt: now,
  }
  await c.testimonials.insertOne(model)
  await recordAudit(actor, 'testimonial.created', 'testimonial', model._id.toHexString(), {
    professionalId: data.professionalId,
  })
  return toDocument(model)
}

export async function updateTestimonial(id: string, input: TestimonialInput, actor: AuditActor) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Testimonio no encontrado')
  const data = testimonialInputSchema.parse(input)
  const c = await collections()
  const before = await c.testimonials.findOneAndUpdate(
    { _id },
    { $set: { ...data, professionalId: toObjectId(data.professionalId), updatedAt: new Date() } },
    { returnDocument: 'before', projection: { professionalId: 1, enabled: 1 } },
  )
  if (!before) throw new NotFoundError('Testimonio no encontrado')
  await recordAudit(actor, before.enabled && !data.enabled ? 'testimonial.hidden' : 'testimonial.updated', 'testimonial', id)
  return { previousProfessionalId: before.professionalId?.toHexString() ?? null }
}

export async function patchTestimonial(
  id: string,
  patch: Partial<Pick<TestimonialInput, 'enabled' | 'featured' | 'displayOrder'>>,
  actor: AuditActor,
) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Testimonio no encontrado')
  const c = await collections()
  const updated = await c.testimonials.findOneAndUpdate(
    { _id },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: 'after', projection: { professionalId: 1 } },
  )
  if (!updated) throw new NotFoundError('Testimonio no encontrado')
  await recordAudit(actor, patch.enabled === false ? 'testimonial.hidden' : 'testimonial.updated', 'testimonial', id, patch)
  return { professionalId: updated.professionalId?.toHexString() ?? null }
}

export async function reorderTestimonials(ids: string[], actor: AuditActor) {
  const c = await collections()
  const ops = ids.flatMap((id, index) => {
    const _id = toObjectId(id)
    return _id ? [{ updateOne: { filter: { _id }, update: { $set: { displayOrder: index } } } }] : []
  })
  if (ops.length) await c.testimonials.bulkWrite(ops)
  await recordAudit(actor, 'testimonial.updated', 'testimonial', null, { reordered: ops.length })
}

export async function deleteTestimonial(id: string, actor: AuditActor) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Testimonio no encontrado')
  const c = await collections()
  const removed = await c.testimonials.findOneAndDelete({ _id }, { projection: { professionalId: 1 } })
  if (!removed) throw new NotFoundError('Testimonio no encontrado')
  await recordAudit(actor, 'testimonial.deleted', 'testimonial', id)
  return { professionalId: removed.professionalId?.toHexString() ?? null }
}
