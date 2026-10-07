import { CACHE_TAGS } from '@repo/domain'
import { listPublishedSlugs, listProfessionals } from '@repo/data-access'
import { requestRevalidation } from '@repo/integrations/revalidation'

const WARNING =
  'Los cambios se guardaron, pero no se pudo refrescar la caché del sitio público. Se actualizará automáticamente en unos minutos.'

/** Invalidates public cache tags; returns a user-facing warning on failure. */
export async function revalidatePublic(tags: string[]): Promise<string | undefined> {
  const result = await requestRevalidation(tags)
  return result.ok || result.skipped ? undefined : WARNING
}

/** Profile changes also affect the directory and the landing's team showcase. */
export function profileTags(...slugs: (string | null | undefined)[]): string[] {
  return [
    ...slugs.filter((s): s is string => Boolean(s)).map((s) => CACHE_TAGS.profile(s)),
    CACHE_TAGS.directory,
    CACHE_TAGS.landing,
  ]
}

export async function allPublishedProfileTags(): Promise<string[]> {
  const slugs = await listPublishedSlugs()
  return profileTags(...slugs.map((s) => s.slug))
}

/**
 * Global testimonials affect every professional's feed; every testimonial
 * change also affects the landing's organisation-wide testimonials wall.
 */
export async function testimonialTags(professionalId: string | null): Promise<string[]> {
  if (professionalId) return [CACHE_TAGS.testimonials(professionalId), CACHE_TAGS.landing]
  const all = await listProfessionals({ status: 'all' })
  return [...all.map((p) => CACHE_TAGS.testimonials(p.id)), CACHE_TAGS.landing]
}
