import { NextResponse, type NextRequest } from 'next/server'
import { cancelParentClubRegistration } from '@repo/data-access'
import { objectIdSchema } from '@repo/domain'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = objectIdSchema.safeParse(body.id)
    if (!parsed.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: NO_STORE })
    }
    const ok = await cancelParentClubRegistration(parsed.data)
    if (!ok) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404, headers: NO_STORE })
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ error: 'Error al cancelar' }, { status: 500, headers: NO_STORE })
  }
}
