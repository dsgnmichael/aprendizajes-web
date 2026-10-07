import { collections, ObjectId, type AuditLogModel } from '@repo/database'
import type { AuditAction, AuditActor, AuditLogDocument } from '@repo/domain'
import type { Filter } from 'mongodb'

type SafeMetadata = Record<string, string | number | boolean | null | undefined>

const FORBIDDEN_KEYS = /pass|secret|token|key|authorization|cookie/i

/** Drops anything that looks like a credential. Audit logs must never hold secrets. */
export function sanitizeMetadata(metadata: SafeMetadata = {}): AuditLogDocument['metadata'] {
  const out: AuditLogDocument['metadata'] = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || FORBIDDEN_KEYS.test(key)) continue
    out[key] = typeof value === 'string' ? value.slice(0, 300) : value
  }
  return out
}

export async function recordAudit(
  actor: AuditActor,
  action: AuditAction,
  entityType: string,
  entityId: string | null,
  metadata?: SafeMetadata,
): Promise<void> {
  try {
    const c = await collections()
    await c.auditLogs.insertOne({
      _id: new ObjectId(),
      actor: { id: actor.id, email: actor.email, role: actor.role },
      action,
      entityType,
      entityId,
      timestamp: new Date(),
      metadata: sanitizeMetadata(metadata),
    })
  } catch (error) {
    // Auditing must never break the operation being audited.
    console.error('[audit] failed to record', action, error instanceof Error ? error.name : 'unknown')
  }
}

export interface AuditQuery {
  action?: string
  entityType?: string
  page?: number
  pageSize?: number
}

export async function listAuditLogs(query: AuditQuery = {}) {
  const c = await collections()
  const filter: Filter<AuditLogModel> = {}
  if (query.action) filter.action = query.action as AuditAction
  if (query.entityType) filter.entityType = query.entityType
  const pageSize = Math.min(query.pageSize ?? 50, 100)
  const page = Math.max(query.page ?? 1, 1)
  const [rows, total] = await Promise.all([
    c.auditLogs.find(filter).sort({ timestamp: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    c.auditLogs.countDocuments(filter),
  ])
  return {
    total,
    page,
    pageSize,
    items: rows.map(({ _id, ...rest }): AuditLogDocument => ({ ...rest, id: _id.toHexString() })),
  }
}
