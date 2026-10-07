'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { hashPassword } from '@repo/auth/password'
import { createUser, hitRateLimit, setUserActive, setUserRole } from '@repo/data-access'
import { objectIdSchema, ROLES, userCreateSchema } from '@repo/domain'
import { ActionError, runAction } from '@/lib/action'
import { toActor } from '@/lib/auth'

export async function createUserAction(input: unknown) {
  return runAction('users:manage', async (user) => {
    const limit = await hitRateLimit(`users:create:${user.id}`, 20, 3600)
    if (!limit.allowed) throw new ActionError('Demasiadas cuentas creadas en poco tiempo.')
    const data = userCreateSchema.parse(input)
    const created = await createUser(
      {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: await hashPassword(data.password),
      },
      toActor(user),
    )
    revalidatePath('/users')
    return { id: created.id }
  })
}

export async function setUserRoleAction(id: string, role: unknown) {
  return runAction('users:manage', async (user) => {
    await setUserRole(objectIdSchema.parse(id), z.enum(ROLES).parse(role), toActor(user))
    revalidatePath('/users')
    return null
  })
}

export async function setUserActiveAction(id: string, active: boolean) {
  return runAction('users:manage', async (user) => {
    await setUserActive(objectIdSchema.parse(id), z.boolean().parse(active), toActor(user))
    revalidatePath('/users')
    return null
  })
}
