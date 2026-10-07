import { collections, ObjectId, toObjectId, type MediaModel } from '@repo/database'
import type { AuditActor, MediaDocument } from '@repo/domain'
import { NotFoundError } from '../errors'
import { recordAudit } from './audit'

function toDocument(m: MediaModel): MediaDocument {
  const { _id, ...rest } = m
  return { ...rest, id: _id.toHexString() }
}

export async function insertMedia(data: Omit<MediaDocument, 'id' | 'createdAt'>, actor: AuditActor) {
  const c = await collections()
  const model: MediaModel = { _id: new ObjectId(), ...data, createdAt: new Date(), uploadedBy: actor.id }
  await c.media.insertOne(model)
  await recordAudit(actor, 'media.uploaded', 'media', model._id.toHexString(), {
    mimeType: data.mimeType,
    size: data.size,
  })
  return toDocument(model)
}

export async function upsertStaticMedia(data: Omit<MediaDocument, 'id' | 'createdAt'>) {
  const c = await collections()
  await c.media.updateOne(
    { key: data.key },
    { $set: data, $setOnInsert: { _id: new ObjectId(), createdAt: new Date() } },
    { upsert: true },
  )
}

export async function listMedia(query: { folder?: string; page?: number; pageSize?: number } = {}) {
  const c = await collections()
  const pageSize = Math.min(query.pageSize ?? 48, 100)
  const page = Math.max(query.page ?? 1, 1)
  const filter = query.folder ? { folder: query.folder } : {}
  const [rows, total] = await Promise.all([
    c.media.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    c.media.countDocuments(filter),
  ])
  return { items: rows.map(toDocument), total, page, pageSize }
}

export async function getMedia(id: string) {
  const _id = toObjectId(id)
  if (!_id) return null
  const c = await collections()
  const m = await c.media.findOne({ _id })
  return m ? toDocument(m) : null
}

export async function updateMediaMeta(
  id: string,
  meta: { alt: string; focalX: number; focalY: number },
  actor: AuditActor,
) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Archivo no encontrado')
  const c = await collections()
  await c.media.updateOne({ _id }, { $set: meta })
  await recordAudit(actor, 'media.uploaded', 'media', id, { updatedMeta: true })
}

export async function deleteMediaRecord(id: string, actor: AuditActor) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Archivo no encontrado')
  const c = await collections()
  const removed = await c.media.findOneAndDelete({ _id })
  if (!removed) throw new NotFoundError('Archivo no encontrado')
  await recordAudit(actor, 'media.deleted', 'media', id)
  return toDocument(removed)
}
