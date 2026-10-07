import { expect, test } from '@playwright/test'

test.describe('sales landing (home page)', () => {
  test('renders the landing with team, services and contact — never a Login', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/aprender también puede ser un juego/i)
    await expect(page.locator('#servicios')).toBeVisible()
    await expect(page.locator('#equipo')).toBeVisible()
    await expect(page.locator('#contacto')).toBeVisible()
    await expect(page.getByRole('link', { name: /login|iniciar sesión|ingresar/i })).toHaveCount(0)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('verifiable stats are computed from published professionals', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('especialistas en el equipo', { exact: true })).toBeVisible()
    await expect(page.locator('[data-section="stats"] dd').first()).toHaveText('5')
  })

  test('demo testimonials are clearly labelled', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-section="testimonialsWall"]').getByText('Testimonio demo').first()).toBeVisible()
  })

  test('team showcase links to profiles and to the /equipo section', async ({ page }) => {
    await page.goto('/')
    const team = page.locator('[data-section="teamShowcase"]')
    await expect(team.getByRole('link', { name: /jessica de sousa/i })).toHaveAttribute('href', '/jessica-de-sousa')
    await team.getByRole('link', { name: /conoce a todo el equipo/i }).click()
    await expect(page).toHaveURL(/\/equipo$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/nuestro equipo/i)
    await expect(page.locator('#equipo').getByRole('link')).toHaveCount(5)
  })

  test('FAQ accordion is keyboard accessible', async ({ page }) => {
    await page.goto('/')
    const question = page.getByText('¿Atienden online?')
    await question.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText(/varias de nuestras especialistas ofrecen sesiones online/i)).toBeVisible()
  })

  test('/equipo is a real route (not a profile 404)', async ({ request }) => {
    expect((await request.get('/equipo')).status()).toBe(200)
  })
})
