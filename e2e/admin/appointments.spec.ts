import { expect, test } from '@playwright/test'
import { MongoClient, ObjectId } from 'mongodb'
import { login, unique } from './helpers'

test('an appointment request can be opened and its status changed', async ({ page }) => {
  const firstName = unique('Paciente')
  const client = await MongoClient.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017')
  const db = client.db(process.env.MONGODB_DB_NAME ?? 'aprendizajess_e2e')
  const professional = await db.collection('professionals').findOne({ slug: 'jessica-de-sousa' })
  const now = new Date()
  await db.collection('appointmentRequests').insertOne({
    _id: new ObjectId(),
    professionalId: professional?._id ?? new ObjectId(),
    professionalSlug: 'jessica-de-sousa',
    professionalName: 'Jessica de Sousa',
    firstName,
    lastName: 'E2E',
    email: 'paciente-e2e@example.com',
    phone: '+56 9 1111 2222',
    modality: 'Online',
    service: '',
    preferredDate: '',
    preferredTime: '',
    message: 'Hola, quisiera agendar.',
    consentText: 'Acepto',
    entry: 'qr',
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ipHash: null,
  })
  await client.close()

  await login(page)
  await page.goto('/appointments?status=new')
  await page.getByRole('link', { name: `${firstName} E2E` }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText('Código QR')).toBeVisible()
  await sheet.getByLabel('Estado').click()
  await page.getByRole('option', { name: 'Agendada' }).click()
  await sheet.getByLabel('Notas internas').fill('Coordinado por teléfono')
  await sheet.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByText('Solicitud actualizada')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto('/appointments?status=scheduled')
  await expect(page.getByRole('link', { name: `${firstName} E2E` })).toBeVisible()
})
