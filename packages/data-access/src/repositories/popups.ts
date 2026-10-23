import { collections, ObjectId, toObjectId, type PopupModel } from '@repo/database'
import {
  popupInputSchema,
  type AuditActor,
  type PopupDocument,
  type PopupInput,
} from '@repo/domain'
import { NotFoundError } from '../errors'
import { recordAudit } from './audit'

function toDocument(m: PopupModel): PopupDocument {
  const { _id, ...rest } = m
  return { ...rest, id: _id.toHexString() }
}

export async function listPopups(): Promise<PopupDocument[]> {
  const c = await collections()
  const rows = await c.popups.find({}).sort({ createdAt: -1 }).toArray()
  return rows.map(toDocument)
}

export async function getActivePopupForPath(path: string): Promise<PopupDocument | null> {
  const c = await collections()
  const row = await c.popups.findOne({
    active: true,
    $or: [{ targetPath: path }, { targetPath: '*' }],
  })
  return row ? toDocument(row) : null
}

export async function getPopup(id: string): Promise<PopupDocument | null> {
  const _id = toObjectId(id)
  if (!_id) return null
  const c = await collections()
  const m = await c.popups.findOne({ _id })
  return m ? toDocument(m) : null
}

export async function createPopup(input: PopupInput, actor: AuditActor): Promise<PopupDocument> {
  const data = popupInputSchema.parse(input)
  const c = await collections()
  const now = new Date()
  const model: PopupModel = {
    _id: new ObjectId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  await c.popups.insertOne(model)
  await recordAudit(actor, 'settings.updated', 'popup', model._id.toHexString(), { name: data.name })
  return toDocument(model)
}

export async function updatePopup(id: string, input: PopupInput, actor: AuditActor) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Popup no encontrado')
  const data = popupInputSchema.parse(input)
  const c = await collections()
  const updated = await c.popups.findOneAndUpdate(
    { _id },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (!updated) throw new NotFoundError('Popup no encontrado')
  await recordAudit(actor, 'settings.updated', 'popup', id, { name: data.name })
  return toDocument(updated)
}

export async function deletePopup(id: string, actor: AuditActor) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Popup no encontrado')
  const c = await collections()
  const removed = await c.popups.findOneAndDelete({ _id })
  if (!removed) throw new NotFoundError('Popup no encontrado')
  await recordAudit(actor, 'settings.updated', 'popup', id)
}
