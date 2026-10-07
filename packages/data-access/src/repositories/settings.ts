import { collections } from '@repo/database'
import { siteSettingsSchema, type AuditActor, type SiteSettings } from '@repo/domain'
import { recordAudit } from './audit'

/**
 * Returns the site settings, filling any field added after the document was
 * written with its schema default (forward compatible, no migrations needed).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const c = await collections()
  const doc = await c.siteSettings.findOne({ _id: 'site' })
  if (!doc) return siteSettingsSchema.parse({})
  const { _id, updatedAt: _u, updatedBy: _b, ...settings } = doc
  const parsed = siteSettingsSchema.safeParse(settings)
  return parsed.success ? parsed.data : siteSettingsSchema.parse({})
}

export async function saveSiteSettings(input: SiteSettings, actor: AuditActor): Promise<SiteSettings> {
  const data = siteSettingsSchema.parse(input)
  const c = await collections()
  await c.siteSettings.updateOne(
    { _id: 'site' },
    { $set: { ...data, updatedAt: new Date(), updatedBy: actor.id } },
    { upsert: true },
  )
  await recordAudit(actor, 'settings.updated', 'siteSettings', 'site')
  return data
}
