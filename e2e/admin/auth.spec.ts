import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, login } from './helpers'

test('unauthenticated users are redirected to login with a safe callback', async ({ page }) => {
  await page.goto('/professionals')
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fprofessionals/)
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
})

test('rejects bad credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Contraseña').fill('definitely-not-the-password-1')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByText('Email o contraseña incorrectos.')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('logs in and shows the dashboard', async ({ page }) => {
  await login(page)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hola')
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' }).first(),
  ).toContainText('Profesionales')
})

test('cron endpoint rejects requests without the secret', async ({ request }) => {
  const response = await request.get('/api/cron/sync-reviews', { failOnStatusCode: false })
  expect(response.status()).toBe(401)
})
