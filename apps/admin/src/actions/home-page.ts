'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { env } from '@repo/config'
import {
  hitRateLimit,
  publishHomePage,
  restoreHomePageRevision,
  saveHomePageDraft,
} from '@repo/data-access'
import { CACHE_TAGS, homePageInputSchema, type HomePageInput } from '@repo/domain'
import { signPreviewToken } from '@repo/integrations/signing'
import { ActionError, runAction, WithWarning } from '@/lib/action'
import { toActor } from '@/lib/auth'
import { revalidatePublic } from '@/lib/revalidate'

const revisionSchema = z.number().int().min(0)

/** Order is the visual order in the builder. */
function normalize(input: HomePageInput): HomePageInput {
  return { ...input, sections: input.sections.map((s, i) => ({ ...s, order: i })) }
}

export async function saveHomeDraftAction(input: HomePageInput, expectedRevision: number) {
  return runAction('landing:write', async (user) => {
    const saved = await saveHomePageDraft(
      normalize(homePageInputSchema.parse(input)),
      revisionSchema.parse(expectedRevision),
      toActor(user),
    )
    revalidatePath('/home-page')
    return { revision: saved.revision }
  })
}

/** Saves the draft (when given) and publishes it, then refreshes the public landing. */
export async function publishHomeAction(input: HomePageInput, expectedRevision: number) {
  return runAction('landing:publish', async (user) => {
    const actor = toActor(user)
    const saved = await saveHomePageDraft(
      normalize(homePageInputSchema.parse(input)),
      revisionSchema.parse(expectedRevision),
      actor,
    )
    const result = await publishHomePage(actor)
    revalidatePath('/home-page')
    revalidatePath('/')
    const warning = await revalidatePublic([CACHE_TAGS.landing])
    return new WithWarning({ revision: saved.revision, publishedRevision: result.revision }, warning)
  })
}

export async function restoreHomeRevisionAction(revision: number, expectedRevision: number) {
  return runAction('landing:write', async (user) => {
    const saved = await restoreHomePageRevision(
      z.number().int().positive().parse(revision),
      revisionSchema.parse(expectedRevision),
      toActor(user),
    )
    revalidatePath('/home-page')
    return { revision: saved.revision }
  })
}

/** Short-lived signed URL for the landing DRAFT preview (web /preview/<token>, pid 'home'). */
export async function homePreviewUrlAction() {
  return runAction('landing:write', async (user) => {
    const limit = await hitRateLimit(`preview:${user.id}`, 120, 60)
    if (!limit.allowed)
      throw new ActionError('Demasiadas solicitudes de vista previa. Espera un momento.')
    const e = env()
    if (!e.PREVIEW_SECRET)
      throw new ActionError(
        'PREVIEW_SECRET no está configurado: la vista previa no está disponible.',
      )
    return { url: `${e.PUBLIC_BASE_URL}/preview/${signPreviewToken(e.PREVIEW_SECRET, 'home')}` }
  })
}
