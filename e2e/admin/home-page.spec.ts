import { expect, test, type Page } from '@playwright/test'
import { expectPublic, login, unique } from './helpers'

test.describe.configure({ mode: 'serial' })

const FAQ_HEADING = 'Resolvemos tus dudas'

async function openSection(page: Page, type: string, label: string) {
  const card = page.getByTestId(`section-${type}`)
  const toggle = card.getByRole('button', { name: new RegExp(`^${label}`) })
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click()
  return card
}

async function publish(page: Page) {
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expect(page.getByText('Página de inicio publicada').last()).toBeVisible()
}

test('landing: draft stays private until published; sections can be hidden', async ({ page }) => {
  test.setTimeout(120_000)
  const token = unique('E2E')

  await login(page)
  await page.goto('/home-page')
  await expect(page.getByRole('heading', { name: 'Página de inicio', level: 1 })).toBeVisible()

  // Edit the hero title and save a draft: the public home page must not change.
  const hero = await openSection(page, 'landingHero', 'Hero de la landing')
  const title = hero.getByLabel('Titular', { exact: true })
  const original = await title.inputValue()
  await title.fill(`Titular ${token}`)
  await page.getByRole('button', { name: 'Guardar borrador' }).click()
  await expect(page.getByText('Borrador guardado')).toBeVisible()
  await expectPublic(page, '', { status: 200, notText: token })

  // Publish: the public home page shows the new title.
  await publish(page)
  await expectPublic(page, '', { status: 200, text: token })

  // Disable the FAQ section and publish: its heading disappears from "/".
  await expectPublic(page, '', { status: 200, text: FAQ_HEADING })
  await page.getByRole('switch', { name: 'Mostrar sección Preguntas frecuentes' }).click()
  await publish(page)
  await expectPublic(page, '', { status: 200, notText: FAQ_HEADING })

  // Restore the original content for the rest of the suite.
  const heroAgain = await openSection(page, 'landingHero', 'Hero de la landing')
  await heroAgain.getByLabel('Titular', { exact: true }).fill(original)
  await page.getByRole('switch', { name: 'Mostrar sección Preguntas frecuentes' }).click()
  await publish(page)
  await expectPublic(page, '', { status: 200, text: FAQ_HEADING, notText: token })
})
