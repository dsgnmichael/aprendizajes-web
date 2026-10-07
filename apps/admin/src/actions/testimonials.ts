'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  createTestimonial,
  deleteTestimonial,
  patchTestimonial,
  reorderTestimonials,
  updateTestimonial,
} from '@repo/data-access'
import { objectIdSchema, testimonialInputSchema } from '@repo/domain'
import { runAction, WithWarning } from '@/lib/action'
import { toActor } from '@/lib/auth'
import { revalidatePublic, testimonialTags } from '@/lib/revalidate'

async function refresh(...professionalIds: (string | null)[]) {
  revalidatePath('/testimonials')
  const tags = (
    await Promise.all([...new Set(professionalIds)].map((id) => testimonialTags(id)))
  ).flat()
  return revalidatePublic(tags)
}

export async function createTestimonialAction(input: unknown) {
  return runAction('testimonials:write', async (user) => {
    const data = testimonialInputSchema.parse(input)
    const created = await createTestimonial(data, toActor(user))
    return new WithWarning({ id: created.id }, await refresh(data.professionalId))
  })
}

export async function updateTestimonialAction(id: string, input: unknown) {
  return runAction('testimonials:write', async (user) => {
    const data = testimonialInputSchema.parse(input)
    const { previousProfessionalId } = await updateTestimonial(
      objectIdSchema.parse(id),
      data,
      toActor(user),
    )
    return new WithWarning(null, await refresh(previousProfessionalId, data.professionalId))
  })
}

const patchSchema = z
  .object({ enabled: z.boolean(), featured: z.boolean(), displayOrder: z.number().int().min(0) })
  .partial()

export async function patchTestimonialAction(id: string, patch: unknown) {
  return runAction('testimonials:write', async (user) => {
    const { professionalId } = await patchTestimonial(
      objectIdSchema.parse(id),
      patchSchema.parse(patch),
      toActor(user),
    )
    return new WithWarning(null, await refresh(professionalId))
  })
}

export async function reorderTestimonialsAction(ids: string[], professionalIds: (string | null)[]) {
  return runAction('testimonials:write', async (user) => {
    await reorderTestimonials(z.array(objectIdSchema).max(500).parse(ids), toActor(user))
    const affected = z.array(objectIdSchema.nullable()).max(500).parse(professionalIds)
    return new WithWarning(null, await refresh(...affected))
  })
}

export async function deleteTestimonialAction(id: string) {
  return runAction('testimonials:write', async (user) => {
    const { professionalId } = await deleteTestimonial(objectIdSchema.parse(id), toActor(user))
    return new WithWarning(null, await refresh(professionalId))
  })
}
