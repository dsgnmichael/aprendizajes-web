'use server'

import { revalidatePath } from 'next/cache'
import { saveSiteSettings } from '@repo/data-access'
import { CACHE_TAGS, siteSettingsSchema } from '@repo/domain'
import { runAction, WithWarning } from '@/lib/action'
import { toActor } from '@/lib/auth'
import { allPublishedProfileTags, revalidatePublic } from '@/lib/revalidate'

export async function saveSettingsAction(input: unknown) {
  return runAction('settings:write', async (user) => {
    const data = siteSettingsSchema.parse(input)
    await saveSiteSettings(data, toActor(user))
    revalidatePath('/settings')
    // Settings (theme, nav, footer, root mode, contact) affect every public page.
    const tags = [CACHE_TAGS.site, CACHE_TAGS.directory, CACHE_TAGS.landing, ...(await allPublishedProfileTags())]
    return new WithWarning(null, await revalidatePublic(tags))
  })
}
