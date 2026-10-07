import { expect, test } from '@playwright/test'
import { login, logout, unique } from './helpers'

test('an EDITOR cannot manage users (UI and server-side)', async ({ page }) => {
  const email = `${unique('editor')}@example.com`
  const password = 'Editor-password-2026'

  await login(page)
  await page.goto('/users')
  await page.getByRole('button', { name: 'Nuevo usuario' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nombre').fill('Editora E2E')
  await dialog.getByLabel('Email').fill(email)
  await dialog.getByLabel('Contraseña inicial').fill(password)
  // Role defaults to EDITOR.
  await dialog.getByRole('button', { name: 'Crear usuario' }).click()
  await expect(page.getByText(email)).toBeVisible()
  await logout(page)

  await login(page, email, password)
  const nav = page.getByRole('navigation', { name: 'Navegación principal' }).first()
  await expect(nav).toContainText('Profesionales')
  await expect(nav).not.toContainText('Usuarios')
  await expect(nav).not.toContainText('Configuración')

  // Direct navigation is blocked on the server, not just hidden.
  await page.goto('/users')
  await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible()
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible()
})
