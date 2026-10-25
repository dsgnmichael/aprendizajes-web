import { ObjectId } from 'mongodb'
import { collections } from '@repo/database'
import {
  parentClubRegistrationSchema,
  type ParentClubRegistrationDocument,
  type ParentClubRegistrationInput,
  type ParentClubTag,
} from '@repo/domain'

export async function createParentClubRegistration(
  input: ParentClubRegistrationInput,
): Promise<ParentClubRegistrationDocument> {
  const data = parentClubRegistrationSchema.parse({ ...input, formType: input.formType || 'invitacion-especial' })
  const c = await collections()
  const now = new Date()
  const _id = new ObjectId()
  const doc = {
    _id,
    ...data,
    status: 'nuevo' as const,
    tags: [] as ParentClubTag[],
    readAt: null,
    createdAt: now,
    updatedAt: now,
  }
  await c.parentClubRegistrations.insertOne(doc)
  return { ...data, id: _id.toHexString(), status: 'nuevo', tags: [], readAt: null, createdAt: now, updatedAt: now }
}

export async function listParentClubRegistrations(): Promise<ParentClubRegistrationDocument[]> {
  const c = await collections()
  const rows = await c.parentClubRegistrations.find({}).sort({ createdAt: -1 }).limit(500).toArray()
  return rows.map((r) => ({
    id: r._id.toHexString(),
    fullName: r.fullName,
    birthDate: r.birthDate,
    whatsapp: r.whatsapp,
    email: r.email,
    supportAreas: r.supportAreas,
    otherSupport: r.otherSupport,
    formType: r.formType || 'invitacion-especial',
    status: r.status,
    tags: (r.tags || []) as ParentClubTag[],
    readAt: r.readAt || null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}


export async function getFormResponseCounts(): Promise<Record<string, number>> {
  const c = await collections()
  const result = await c.parentClubRegistrations
    .aggregate<{ _id: string; count: number }>([
      { $group: { _id: { $ifNull: ['$formType', 'invitacion-especial'] }, count: { $sum: 1 } } },
    ])
    .toArray()
  const counts: Record<string, number> = {}
  for (const r of result) counts[r._id] = r.count
  return counts
}

export async function listParentClubRegistrationsByType(formType: string): Promise<ParentClubRegistrationDocument[]> {
  const c = await collections()
  const filter: Record<string, unknown> = formType === 'invitacion-especial'
    ? { $or: [{ formType }, { formType: { $exists: false } }] }
    : { formType }
  const rows = await c.parentClubRegistrations.find(filter).sort({ createdAt: -1 }).limit(500).toArray()
  return rows.map((r) => ({
    id: r._id.toHexString(),
    fullName: r.fullName,
    birthDate: r.birthDate,
    whatsapp: r.whatsapp,
    email: r.email,
    supportAreas: r.supportAreas,
    otherSupport: r.otherSupport,
    formType: r.formType || 'invitacion-especial',
    status: r.status,
    tags: (r.tags || []) as ParentClubTag[],
    readAt: r.readAt || null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}


export async function deleteParentClubRegistration(id: string): Promise<boolean> {
  const c = await collections()
  const { ObjectId } = await import('mongodb')
  const _id = new ObjectId(id)
  const result = await c.parentClubRegistrations.deleteOne({ _id })
  return result.deletedCount === 1
}

export async function deleteManyParentClubRegistrations(ids: string[]): Promise<number> {
  const c = await collections()
  const { ObjectId } = await import('mongodb')
  const objectIds = ids.map((id) => new ObjectId(id))
  const result = await c.parentClubRegistrations.deleteMany({ _id: { $in: objectIds } })
  return result.deletedCount
}


export async function toggleParentClubTag(id: string, tag: ParentClubTag): Promise<ParentClubTag[]> {
  const { ObjectId } = await import('mongodb')
  const c = await collections()
  const _id = new ObjectId(id)
  const doc = await c.parentClubRegistrations.findOne({ _id })
  if (!doc) throw new Error('Registro no encontrado')

  const currentTags = (doc.tags || []) as ParentClubTag[]
  const newTags: ParentClubTag[] = currentTags.includes(tag)
    ? currentTags.filter((t) => t !== tag)
    : [...currentTags, tag]

  await c.parentClubRegistrations.updateOne(
    { _id },
    { $set: { tags: newTags, updatedAt: new Date() } }
  )
  return newTags
}


export async function countUnreadParentClubRegistrations(): Promise<number> {
  const c = await collections()
  return c.parentClubRegistrations.countDocuments({ readAt: null })
}

export async function markAllParentClubRegistrationsAsRead(): Promise<number> {
  const c = await collections()
  const result = await c.parentClubRegistrations.updateMany(
    { readAt: null },
    { $set: { readAt: new Date() } }
  )
  return result.modifiedCount
}
