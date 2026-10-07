import { collections, ObjectId, toObjectId, type AppointmentRequestModel } from '@repo/database'
import {
  APPOINTMENT_STATUSES,
  type AppointmentRequestDocument,
  type AppointmentRequestInput,
  type AppointmentStatus,
  type AuditActor,
} from '@repo/domain'
import type { Filter } from 'mongodb'
import { NotFoundError } from '../errors'
import { recordAudit } from './audit'

function toDocument(m: AppointmentRequestModel): AppointmentRequestDocument {
  const { _id, professionalId, ipHash: _ip, ...rest } = m
  return { ...rest, id: _id.toHexString(), professionalId: professionalId.toHexString() }
}

export async function createAppointmentRequest(
  input: AppointmentRequestInput,
  professional: { id: string; slug: string; name: string },
  meta: { consentText: string; ipHash: string | null },
): Promise<{ id: string }> {
  const c = await collections()
  const now = new Date()
  const _id = new ObjectId()
  const professionalId = toObjectId(professional.id)
  if (!professionalId) throw new NotFoundError('Profesional no encontrado')
  await c.appointmentRequests.insertOne({
    _id,
    professionalId,
    professionalSlug: professional.slug,
    professionalName: professional.name,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    modality: input.modality,
    service: input.service,
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    message: input.message,
    consentText: meta.consentText,
    entry: input.entry,
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ipHash: meta.ipHash,
  })
  return { id: _id.toHexString() }
}

export interface AppointmentQuery {
  status?: AppointmentStatus
  professionalId?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function listAppointmentRequests(query: AppointmentQuery = {}) {
  const c = await collections()
  const filter: Filter<AppointmentRequestModel> = {}
  if (query.status && APPOINTMENT_STATUSES.includes(query.status)) filter.status = query.status
  const pid = toObjectId(query.professionalId)
  if (pid) filter.professionalId = pid
  if (query.search?.trim()) {
    const rx = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }]
  }
  const pageSize = Math.min(query.pageSize ?? 25, 100)
  const page = Math.max(query.page ?? 1, 1)
  const [rows, total] = await Promise.all([
    c.appointmentRequests
      .find(filter, { projection: { ipHash: 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    c.appointmentRequests.countDocuments(filter),
  ])
  return { items: rows.map(toDocument), total, page, pageSize }
}

export async function getAppointmentRequest(id: string) {
  const _id = toObjectId(id)
  if (!_id) return null
  const c = await collections()
  const m = await c.appointmentRequests.findOne({ _id }, { projection: { ipHash: 0 } })
  return m ? toDocument(m) : null
}

export async function updateAppointmentStatus(
  id: string,
  update: { status: AppointmentStatus; notes: string },
  actor: AuditActor,
) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Solicitud no encontrada')
  const c = await collections()
  const before = await c.appointmentRequests.findOneAndUpdate(
    { _id },
    { $set: { status: update.status, notes: update.notes, updatedAt: new Date() } },
    { returnDocument: 'before', projection: { status: 1 } },
  )
  if (!before) throw new NotFoundError('Solicitud no encontrada')
  await recordAudit(actor, 'appointment.statusChanged', 'appointmentRequest', id, {
    from: before.status,
    to: update.status,
  })
}

export async function countAppointmentsByStatus(): Promise<Record<AppointmentStatus, number>> {
  const c = await collections()
  const rows = await c.appointmentRequests
    .aggregate<{ _id: AppointmentStatus; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    .toArray()
  const out = Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0])) as Record<AppointmentStatus, number>
  for (const row of rows) out[row._id] = row.count
  return out
}
