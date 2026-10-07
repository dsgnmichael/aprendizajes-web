import { expect, test } from '@playwright/test'
import { qrTargetUrl } from '@repo/domain'

const BASE = process.env.PUBLIC_BASE_URL!

test.describe('public profile', () => {
  test('renders the professional and never shows a Login entry point', async ({ page }) => {
    const res = await page.goto('/jessica-de-sousa')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: /jessica de sousa/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /login|iniciar sesión|ingresar/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /login/i })).toHaveCount(0)
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
  })

  test('unknown professionals and system paths return a real 404', async ({ request }) => {
    expect((await request.get('/no-existe-este-perfil')).status()).toBe(404)
    expect((await request.get('/admin')).status()).toBe(404)
    expect((await request.get('/login')).status()).toBe(404)
  })

  test('QR target URL lands on the published profile', async ({ page }) => {
    const target = qrTargetUrl(BASE, 'jessica-de-sousa')
    expect(target.startsWith(BASE)).toBe(true)
    const res = await page.goto(target)
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/jessica/i)
    // The QR marker is removed from the address bar after tracking.
    await expect(page).toHaveURL(/\/jessica-de-sousa$/)
  })

  test('has no horizontal scroll', async ({ page }) => {
    await page.goto('/jessica-de-sousa')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('has no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/jessica-de-sousa')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe('professional switcher', () => {
  test('lists every published professional and navigates with URL update', async ({ page }) => {
    await page.goto('/jessica-de-sousa')
    const nav = page.getByRole('navigation', { name: /conoce al equipo/i })
    await expect(nav.getByRole('link')).toHaveCount(5)
    await expect(nav.getByRole('link', { name: /jessica de sousa/i })).toHaveAttribute('aria-current', 'page')
    await nav.getByRole('link', { name: /stella sojo/i }).click()
    await expect(page).toHaveURL(/\/stella-sojo$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/stella sojo/i)
  })
})

test.describe('testimonials', () => {
  test('carousel supports buttons and keyboard', async ({ page }) => {
    await page.goto('/jessica-de-sousa')
    const carousel = page.locator('[aria-roledescription="carrusel"]')
    await expect(carousel).toBeVisible()
    // The live region holds the active testimonial (old/new overlap briefly while animating).
    const live = carousel.locator('[aria-live="polite"]')
    const first = (await live.locator('blockquote').first().innerText()).slice(0, 40)
    await carousel.getByRole('button', { name: /siguiente testimonio/i }).click()
    await expect(live).not.toContainText(first)
    await carousel.getByRole('button', { name: /testimonio anterior/i }).click()
    await expect(live).toContainText(first)
    await carousel.focus()
    await page.keyboard.press('ArrowRight')
    await expect(live).not.toContainText(first)
  })
})

test.describe('appointment CTA', () => {
  test('INTERNAL_FORM validates and submits a request', async ({ page }) => {
    await page.goto('/jessica-de-sousa')
    await page.getByRole('button', { name: /agendar cita/i }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /enviar solicitud/i }).click()
    await expect(dialog.getByText(/ingresa tu nombre/i)).toBeVisible()
    await dialog.getByLabel('Nombre').fill('Prueba')
    await dialog.getByLabel('Apellido').fill('E2E')
    await dialog.getByLabel('Email').fill(`e2e-${Date.now()}@example.com`)
    await dialog.getByLabel(/acepto/i).check()
    await dialog.getByRole('button', { name: /enviar solicitud/i }).click()
    await expect(dialog.getByRole('status')).toContainText(/gracias|recibimos/i)
  })

  test('WHATSAPP and EXTERNAL_URL modes link out correctly', async ({ page }) => {
    await page.goto('/karen-lamadri')
    const wa = page.getByRole('link', { name: /whatsapp/i }).first()
    await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+\?text=/)
    await page.goto('/mayerlin-hurtado')
    await expect(page.getByRole('link', { name: /reservar online/i }).first()).toHaveAttribute('href', /^https:\/\/calendly\.com/)
  })
})

test.describe('seo', () => {
  test('sitemap lists published profiles and robots blocks previews', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain('/jessica-de-sousa')
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Disallow: /preview/')
  })
})
