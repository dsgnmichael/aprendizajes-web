import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, type SessionUser } from '@repo/auth'
import { can, type AuditActor, type Permission } from '@repo/domain'

/** Session for the current request (deduplicated per render). */
export const getSession = cache(async () => {
  const session = await getServerSession(authOptions())
  return session?.user?.id ? session : null
})

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session.user
}

/** Page guard: redirects to /forbidden when the role lacks the permission. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser()
  if (!can(user.role, permission)) redirect('/forbidden')
  return user
}

export function toActor(user: SessionUser): AuditActor {
  return { id: user.id, email: user.email, role: user.role }
}
