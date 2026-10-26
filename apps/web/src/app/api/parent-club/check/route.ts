import { NextResponse, type NextRequest } from 'next/server'
import { findExistingParentClubRegistration } from '@repo/data-access'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') || ''
  const whatsapp = searchParams.get('whatsapp') || ''

  try {
    const result = await findExistingParentClubRegistration(email, whatsapp)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Error al verificar disponibilidad' }, { status: 500 })
  }
}
