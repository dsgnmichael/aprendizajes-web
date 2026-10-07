'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { env } from '@repo/config'
import {
  archiveProfessional,
  createProfessional,
  deleteProfessional,
  duplicateProfessional,
  getProfessionalById,
  hitRateLimit,
  isSlugAvailable,
  listPublishedSlugs,
  publishProfessional,
  reorderProfessionals,
  restoreProfessional,
  restoreRevisionToDraft,
  saveProfessionalDraft,
  unpublishProfessional,
} from '@repo/data-access'
import {
  isValidSlug,
  objectIdSchema,
  professionalCreateSchema,
  professionalInputSchema,
  slugify,
  type ProfessionalInput,
} from '@repo/domain'
import { signPreviewToken } from '@repo/integrations/signing'
import { ActionError, runAction, WithWarning } from '@/lib/action'
import { toActor } from '@/lib/auth'
import { profileTags, revalidatePublic } from '@/lib/revalidate'

const idSchema = objectIdSchema

export async function createProfessionalAction(input: unknown) {
  return runAction('professionals:write', async (user) => {
    const data = professionalCreateSchema.parse(input)
    if (!(await isSlugAvailable(data.slug))) throw new ActionError('El slug ya está en uso')
    const created = await createProfessional(data, toActor(user))
    revalidatePath('/professionals')
    return { id: created.id }
  })
}

export async function checkSlugAction(slug: string, exceptId?: string) {
  return runAction('professionals:read', async () => {
    const normalized = slugify(slug)
    if (!isValidSlug(normalized))
      return { slug: normalized, available: false, reason: 'invalid' as const }
    const available = await isSlugAvailable(normalized, exceptId)
    return { slug: normalized, available, reason: available ? null : ('taken' as const) }
  })
}

export async function saveDraftAction(
  id: string,
  input: ProfessionalInput,
  expectedRevision: number,
) {
  return runAction('professionals:write', async (user) => {
    const pid = idSchema.parse(id)
    const data = professionalInputSchema.parse(input)
    const saved = await saveProfessionalDraft(
      pid,
      data,
      z.number().int().parse(expectedRevision),
      toActor(user),
    )
    revalidatePath('/professionals')
    revalidatePath(`/professionals/${pid}`)
    // Draft saves never touch the public cache: only publishing does.
    return {
      revision: saved.revision,
      updatedAt: saved.updatedAt.toISOString(),
      status: saved.status,
    }
  })
}

/** Optionally saves the given draft first, then publishes the snapshot. */
export async function publishAction(
  id: string,
  input?: ProfessionalInput,
  expectedRevision?: number,
) {
  return runAction('professionals:publish', async (user) => {
    const pid = idSchema.parse(id)
    const actor = toActor(user)
    let revision = expectedRevision
    if (input && expectedRevision !== undefined) {
      const saved = await saveProfessionalDraft(
        pid,
        professionalInputSchema.parse(input),
        expectedRevision,
        actor,
      )
      revision = saved.revision
    }
    const result = await publishProfessional(pid, actor)
    revalidatePath('/professionals')
    revalidatePath(`/professionals/${pid}`)
    const warning = await revalidatePublic(profileTags(result.slug, result.previousSlug))
    return new WithWarning({ slug: result.slug, revision: revision ?? result.revision }, warning)
  })
}

export async function unpublishAction(id: string) {
  return runAction('professionals:publish', async (user) => {
    const slug = await unpublishProfessional(idSchema.parse(id), toActor(user))
    revalidatePath('/professionals')
    revalidatePath(`/professionals/${id}`)
    return new WithWarning(null, await revalidatePublic(profileTags(slug)))
  })
}

export async function archiveAction(id: string) {
  return runAction('professionals:archive', async (user) => {
    const slug = await archiveProfessional(idSchema.parse(id), toActor(user))
    revalidatePath('/professionals')
    return new WithWarning(null, await revalidatePublic(profileTags(slug)))
  })
}

export async function restoreAction(id: string) {
  return runAction('professionals:archive', async (user) => {
    await restoreProfessional(idSchema.parse(id), toActor(user))
    revalidatePath('/professionals')
    return null
  })
}

export async function deleteAction(id: string) {
  return runAction('professionals:delete', async (user) => {
    await deleteProfessional(idSchema.parse(id), toActor(user))
    revalidatePath('/professionals')
    return null
  })
}

export async function duplicateAction(id: string) {
  return runAction('professionals:write', async (user) => {
    const copy = await duplicateProfessional(idSchema.parse(id), toActor(user))
    revalidatePath('/professionals')
    return { id: copy.id }
  })
}

export async function reorderAction(ids: string[]) {
  return runAction('professionals:write', async (user) => {
    const parsed = z.array(idSchema).max(500).parse(ids)
    await reorderProfessionals(parsed, toActor(user))
    revalidatePath('/professionals')
    const slugs = await listPublishedSlugs()
    return new WithWarning(null, await revalidatePublic(profileTags(...slugs.map((s) => s.slug))))
  })
}

/** Short-lived signed URL for the draft preview iframe (rendered by the web app). */
export async function previewUrlAction(id: string) {
  return runAction('professionals:read', async (user) => {
    const pid = idSchema.parse(id)
    const limit = await hitRateLimit(`preview:${user.id}`, 120, 60)
    if (!limit.allowed)
      throw new ActionError('Demasiadas solicitudes de vista previa. Espera un momento.')
    const e = env()
    if (!e.PREVIEW_SECRET)
      throw new ActionError(
        'PREVIEW_SECRET no está configurado: la vista previa no está disponible.',
      )
    if (!(await getProfessionalById(pid))) throw new ActionError('Profesional no encontrado')
    return { url: `${e.PUBLIC_BASE_URL}/preview/${signPreviewToken(e.PREVIEW_SECRET, pid)}` }
  })
}

export async function restoreRevisionAction(id: string, revision: number, expectedRevision: number) {
  return runAction('professionals:write', async (user) => {
    const pid = idSchema.parse(id)
    const rev = z.number().int().positive().parse(revision)
    const saved = await restoreRevisionToDraft(pid, rev, z.number().int().positive().parse(expectedRevision), toActor(user))
    revalidatePath(`/professionals/${pid}`)
    return { revision: saved.revision }
  })
}
