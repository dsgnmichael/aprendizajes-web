import type { MetadataRoute } from 'next'
import { getSitemapEntries } from '@/lib/data'
import { siteUrl } from '@/lib/site-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const entries = await getSitemapEntries()
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/equipo`, changeFrequency: 'weekly', priority: 0.9 },
    ...entries.map((e) => ({ url: `${base}/${e.slug}`, lastModified: e.publishedAt, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ]
}
