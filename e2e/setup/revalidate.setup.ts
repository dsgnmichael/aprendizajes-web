import { test as setup, expect } from '@playwright/test'
import { expectFresh } from '../support/fresh'
import { listProfessionals } from '@repo/data-access'
import { closeMongo } from '@repo/database'
import { CACHE_TAGS } from '@repo/domain'
import { requestRevalidation } from '@repo/integrations/revalidation'

/**
 * The built app keeps a persistent cache on disk across server restarts, so
 * after global setup reseeds the database we invalidate every public cache
 * tag. Runs once, after the web servers are up, before every other project.
 */
setup('invalidate public caches after reseeding', async ({ request }) => {
  const professionals = await listProfessionals({ status: 'all' })
  const result = await requestRevalidation([
    CACHE_TAGS.site,
    CACHE_TAGS.directory,
    CACHE_TAGS.landing,
    ...professionals.map((p) => CACHE_TAGS.profile(p.slug)),
  ])
  expect(result.ok).toBe(true)
  const published = professionals.filter((p) => p.status === 'published')
  const links = published.map((p) => `href="/${p.slug}"`)
  await expectFresh(request, ['/', '/equipo', ...published.map((p) => `/${p.slug}`)], links)
  await closeMongo()
})
