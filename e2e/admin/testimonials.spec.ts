import { expect, test } from '@playwright/test'
import { expectPublic, login, unique } from './helpers'

test('a manual testimonial appears on the public profile', async ({ page }) => {
  const text = `Testimonio de prueba ${unique('t')} muy recomendable.`
  await login(page)
  await page.goto('/testimonials')
  await page.getByRole('button', { name: 'Nuevo testimonio' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('combobox', { name: 'Profesional' }).click()
  await page.getByRole('option', { name: 'Jessica de Sousa' }).click()
  await dialog.getByLabel('Nombre o iniciales').fill('Persona E2E')
  await dialog.getByLabel('Testimonio').fill(text)
  await dialog.getByRole('switch', { name: 'Destacado' }).click()
  await dialog.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Testimonio creado')).toBeVisible()
  await expectPublic(page, 'jessica-de-sousa', { status: 200, text })

  // Cleanup: delete it and verify it disappears.
  await page.getByRole('button', { name: 'Eliminar testimonio de Persona E2E' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expectPublic(page, 'jessica-de-sousa', { status: 200, notText: text })
})
