import { createParentClubRegistration, findExistingParentClubRegistration } from '@repo/data-access'
import { parentClubRegistrationSchema } from '@repo/domain'
import { NextResponse, type NextRequest } from 'next/server'
import { sendParentClubEmail } from '@/lib/send-email'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = parentClubRegistrationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.flatten() }, { status: 400, headers: NO_STORE })
    }

    // Verificar duplicados por email o WhatsApp
    const duplicate = await findExistingParentClubRegistration(parsed.data.email, parsed.data.whatsapp)
    if (duplicate.exists) {
      return NextResponse.json(
        { error: duplicate.message, field: duplicate.field },
        { status: 409, headers: NO_STORE },
      )
    }

    const registration = await createParentClubRegistration(parsed.data)

    // 🔥 ENVIAR EL CORREO EA MANERA INDISPARABLE (Asincrono para no bloquear la respuesta)
    // El usuario ve la pantalla de "registro exitoso" de inmediato, y el correo se procesa por detras.
    sendParentClubEmail({
      registrationId: registration.id,
      fullName: registration.fullName,
      email: registration.email,
    }).catch(err => console.error('Error enviando correo en segundo plano:', err))

    return NextResponse.json({ ok: true, registration }, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ error: 'Error al procesar el registro' }, { status: 500, headers: NO_STORE })
  }
}
