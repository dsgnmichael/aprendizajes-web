import { expect, type Page } from '@playwright/test'

export const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? 'http://localhost:3100').replace(
  /\/+$/,
  '',
)
export const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'e2e-admin@example.com'
export const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'e2e-Password-123456'

export const unique = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`

export async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/$/)
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Menú de usuario' }).first().click()
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login/)
}

/** Waits until the public page reflects the expected state (cross-app revalidation is async). */
export async function expectPublic(
  page: Page,
  slug: string,
  check: { status: number; text?: string; notText?: string },
) {
  await expect
    .poll(
      async () => {
        const response = await page.request.get(`${PUBLIC_BASE_URL}/${slug}`, {
          failOnStatusCode: false,
        })
        if (response.status() !== check.status) return `status ${response.status()}`
        const body = await response.text()
        if (check.text && !body.includes(check.text)) return 'missing text'
        if (check.notText && body.includes(check.notText)) return 'unexpected text'
        return 'ok'
      },
      { timeout: 20_000, intervals: [500, 1000, 2000] },
    )
    .toBe('ok')
}
