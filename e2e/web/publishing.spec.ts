import { expect, test } from '@playwright/test'
import { createProfessional, listProfessionals, publishProfessional, SYSTEM_ACTOR, unpublishProfessional } from '@repo/data-access'
import { closeMongo } from '@repo/database'
import { CACHE_TAGS } from '@repo/domain'
import { requestRevalidation } from '@repo/integrations/revalidation'
import { signPreviewToken } from '@repo/integrations/signing'
import { expectFresh } from '../support/fresh'

test.describe.configure({ mode: 'serial' })
test.afterAll(async () => closeMongo())

test('drafts are private (404) but visible through a signed preview', async ({ page, request }) => {
  const slug = `borrador-${Date.now().toString(36)}`
  const draft = await createProfessional({ name: 'Perfil Borrador', slug, professionalTitle: 'Psicóloga' }, SYSTEM_ACTOR)
  expect((await request.get(`/${slug}`)).status()).toBe(404)

  await page.goto(`/preview/${signPreviewToken(process.env.PREVIEW_SECRET!, draft.id)}`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/perfil borrador/i)
  await page.goto('/preview/token-invalido')
  await expect(page.getByRole('heading', { name: /vista previa expirada/i })).toBeVisible()
})

test('publishing + signed revalidation makes the profile public', async ({ request }) => {
  const slug = `publicado-${Date.now().toString(36)}`
  const p = await createProfessional({ name: 'Perfil Publicado', slug, professionalTitle: 'Fonoaudióloga' }, SYSTEM_ACTOR)
  await publishProfessional(p.id, SYSTEM_ACTOR)
  const reval = await requestRevalidation([CACHE_TAGS.profile(slug), CACHE_TAGS.directory])
  expect(reval.ok).toBe(true)
  const res = await request.get(`/${slug}`)
  expect(res.status()).toBe(200)
  expect(await res.text()).toContain('Perfil Publicado')
  await unpublishProfessional(p.id, SYSTEM_ACTOR)
  await requestRevalidation([CACHE_TAGS.profile(slug), CACHE_TAGS.directory])
  expect((await request.get(`/${slug}`)).status()).toBe(404)
})

test('with a single published professional the switcher is not rendered', async ({ page, request }) => {
  const published = (await listProfessionals({ status: 'published' })).filter((p) => p.slug !== 'jessica-de-sousa')
  try {
    for (const p of published) await unpublishProfessional(p.id, SYSTEM_ACTOR)
    await requestRevalidation([CACHE_TAGS.directory, CACHE_TAGS.landing, ...published.map((p) => CACHE_TAGS.profile(p.slug)), CACHE_TAGS.profile('jessica-de-sousa')])
    await page.goto('/jessica-de-sousa')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/jessica/i)
    await expect(page.getByRole('navigation', { name: /conoce al equipo/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /ver más profesionales/i })).toHaveCount(0)
  } finally {
    for (const p of published) await publishProfessional(p.id, SYSTEM_ACTOR)
    await requestRevalidation([CACHE_TAGS.directory, CACHE_TAGS.landing, ...published.map((p) => CACHE_TAGS.profile(p.slug)), CACHE_TAGS.profile('jessica-de-sousa')])
    // Leave every public page fresh for the following tests.
    await expectFresh(request, ['/', '/equipo', '/jessica-de-sousa'], published.map((p) => `href="/${p.slug}"`))
  }
})

test('rejects unsigned revalidation requests', async ({ request }) => {
  const res = await request.post('/api/revalidate', { data: { tags: ['site'] } })
  expect(res.status()).toBe(401)
})
