import { createParentClubRegistration } from '@repo/data-access'
import { parentClubRegistrationSchema } from '@repo/domain'
import { NextResponse, type NextRequest } from 'next/server'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = parentClubRegistrationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400, headers: NO_STORE })
    }
    await createParentClubRegistration(parsed.data)
    return NextResponse.json({ ok: true }, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ error: 'Error al procesar el registro' }, { status: 500, headers: NO_STORE })
  }
}
