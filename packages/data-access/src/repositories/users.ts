import { collections, ObjectId, toObjectId, type UserModel } from '@repo/database'
import type { AuditActor, Role, UserDocument } from '@repo/domain'
import { ConflictError, DomainRuleError, isDuplicateKeyError, NotFoundError } from '../errors'
import { recordAudit } from './audit'

function toDocument(m: UserModel): UserDocument {
  return {
    id: m._id.toHexString(),
    name: m.name,
    email: m.email,
    role: m.role,
    active: m.active,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    lastLoginAt: m.lastLoginAt,
  }
}

/** Auth only: includes the password hash. Never return this to a client. */
export async function findUserForLogin(email: string) {
  const c = await collections()
  return c.users.findOne({ email: email.toLowerCase() })
}

export async function getUserById(id: string): Promise<UserDocument | null> {
  const _id = toObjectId(id)
  if (!_id) return null
  const c = await collections()
  const m = await c.users.findOne({ _id }, { projection: { passwordHash: 0 } })
  return m ? toDocument(m as UserModel) : null
}

export async function listUsers(): Promise<UserDocument[]> {
  const c = await collections()
  const rows = await c.users.find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: 1 }).toArray()
  return rows.map((r) => toDocument(r as UserModel))
}

export async function createUser(
  data: { name: string; email: string; role: Role; passwordHash: string },
  actor: AuditActor,
): Promise<UserDocument> {
  const c = await collections()
  const now = new Date()
  const model: UserModel = {
    _id: new ObjectId(),
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    role: data.role,
    active: true,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
    failedLogins: 0,
    lockedUntil: null,
  }
  try {
    await c.users.insertOne(model)
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new ConflictError('Ya existe un usuario con ese email', 'email')
    throw error
  }
  await recordAudit(actor, 'user.created', 'user', model._id.toHexString(), { email: model.email, role: model.role })
  return toDocument(model)
}

async function assertNotLastSuperAdmin(_id: ObjectId) {
  const c = await collections()
  const target = await c.users.findOne({ _id }, { projection: { role: 1, active: 1 } })
  if (!target) throw new NotFoundError('Usuario no encontrado')
  if (target.role === 'SUPER_ADMIN' && target.active) {
    const others = await c.users.countDocuments({ role: 'SUPER_ADMIN', active: true, _id: { $ne: _id } })
    if (others === 0) throw new DomainRuleError('Debe existir al menos un super admin activo')
  }
  return target
}

export async function setUserRole(id: string, role: Role, actor: AuditActor) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Usuario no encontrado')
  const target = await assertNotLastSuperAdmin(_id)
  if (target.role === role) return
  const c = await collections()
  await c.users.updateOne({ _id }, { $set: { role, updatedAt: new Date() } })
  await recordAudit(actor, 'user.roleChanged', 'user', id, { from: target.role, to: role })
}

export async function setUserActive(id: string, active: boolean, actor: AuditActor) {
  const _id = toObjectId(id)
  if (!_id) throw new NotFoundError('Usuario no encontrado')
  if (actor.id === id && !active) throw new DomainRuleError('No puedes desactivar tu propia cuenta')
  if (!active) await assertNotLastSuperAdmin(_id)
  const c = await collections()
  await c.users.updateOne({ _id }, { $set: { active, updatedAt: new Date() } })
  await recordAudit(actor, active ? 'user.activated' : 'user.deactivated', 'user', id)
}

const MAX_FAILED = 8
const LOCK_MINUTES = 15

export async function recordLoginSuccess(id: ObjectId) {
  const c = await collections()
  await c.users.updateOne({ _id: id }, { $set: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null } })
}

/** Locks the account for a while after repeated failures (brute-force defence). */
export async function recordLoginFailure(id: ObjectId) {
  const c = await collections()
  const updated = await c.users.findOneAndUpdate(
    { _id: id },
    { $inc: { failedLogins: 1 } },
    { returnDocument: 'after', projection: { failedLogins: 1 } },
  )
  if (updated && updated.failedLogins >= MAX_FAILED) {
    await c.users.updateOne(
      { _id: id },
      { $set: { lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000), failedLogins: 0 } },
    )
  }
}

export async function upsertBootstrapAdmin(data: { email: string; name: string; passwordHash: string }) {
  const c = await collections()
  const now = new Date()
  const result = await c.users.updateOne(
    { email: data.email.toLowerCase() },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        role: 'SUPER_ADMIN',
        active: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
        failedLogins: 0,
        lockedUntil: null,
      },
    },
    { upsert: true },
  )
  return { created: result.upsertedCount > 0 }
}
