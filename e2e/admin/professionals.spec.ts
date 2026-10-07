import { expect, test } from '@playwright/test'
import { expectPublic, login, PUBLIC_BASE_URL, unique } from './helpers'

test.describe.configure({ mode: 'serial' })

test('create → draft → publish → edit draft → publish → QR → unpublish → archive → delete', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const slug = unique('e2e-prof')
  const name = `E2E ${slug}`
  const firstText = `Primera descripción ${slug}`
  const secondText = `Segunda descripción ${slug}`

  await login(page)
  await page.goto('/professionals')
  await page.getByRole('button', { name: 'Nuevo profesional' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nombre completo').fill(name)
  await dialog.getByLabel('Profesión / especialidad').fill('Psicopedagoga')
  await dialog.getByLabel('URL pública').fill(slug)
  await expect(dialog.getByText('Disponible.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Crear borrador' }).click()
  await expect(page).toHaveURL(/\/professionals\/[a-f0-9]{24}$/)

  // Draft content is never public.
  await page.getByRole('tab', { name: 'Contenido' }).click()
  await page.getByLabel('Descripción breve').fill(firstText)
  await page.getByRole('button', { name: 'Guardar borrador' }).click()
  await expect(page.getByText('Borrador guardado')).toBeVisible()
  await expectPublic(page, slug, { status: 404 })

  // Publish.
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expect(page.getByText('Publicado en el sitio')).toBeVisible()
  await expectPublic(page, slug, { status: 200, text: name })

  // A saved draft does not change the public page until it is published.
  await page.getByRole('tab', { name: 'Contenido' }).click()
  await page.getByLabel('Descripción breve').fill(secondText)
  await page.getByRole('button', { name: 'Guardar borrador' }).click()
  await expect(page.getByText('Borrador guardado').first()).toBeVisible()
  await expect(page.getByText('Cambios sin publicar')).toBeVisible()
  await expectPublic(page, slug, { status: 200, notText: secondText })
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expectPublic(page, slug, { status: 200, text: secondText })

  // QR always targets the PUBLIC domain.
  await page.goto('/professionals')
  await page.getByRole('button', { name: `Generar QR de ${name}` }).click()
  await expect(page.getByTestId('qr-target')).toHaveText(`${PUBLIC_BASE_URL}/${slug}?src=qr`)
  await page.keyboard.press('Escape')

  // Unpublish → real 404.
  await page.getByRole('button', { name: `Acciones para ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Despublicar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Despublicar' }).click()
  await expect(page.getByText('Despublicado')).toBeVisible()
  await expectPublic(page, slug, { status: 404 })

  // Archive and delete (cleanup).
  await page.getByRole('button', { name: `Acciones para ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Archivar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Archivar' }).click()
  await expect(page.getByText('Archivado', { exact: true }).first()).toBeVisible()
  await page.goto('/professionals?status=archived')
  await page.getByRole('button', { name: `Acciones para ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Eliminar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('link', { name })).toHaveCount(0)
})

test('validates the slug in the creation dialog', async ({ page }) => {
  await login(page)
  await page.goto('/professionals')
  await page.getByRole('button', { name: 'Nuevo profesional' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nombre completo').fill('Duplicado')
  await dialog.getByLabel('URL pública').fill('jessica-de-sousa')
  await expect(dialog.getByText('Ya está en uso.')).toBeVisible()
  await dialog.getByLabel('URL pública').fill('admin')
  await expect(dialog.getByText(/reservado/)).toBeVisible()
})
