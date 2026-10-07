'use server'

import { revalidatePath } from 'next/cache'
import { updateAppointmentStatus } from '@repo/data-access'
import { appointmentStatusUpdateSchema, objectIdSchema } from '@repo/domain'
import { runAction } from '@/lib/action'
import { toActor } from '@/lib/auth'

export async function updateAppointmentAction(id: string, input: unknown) {
  return runAction('appointments:write', async (user) => {
    const data = appointmentStatusUpdateSchema.parse(input)
    await updateAppointmentStatus(objectIdSchema.parse(id), data, toActor(user))
    revalidatePath('/appointments')
    revalidatePath('/')
    return null
  })
}
