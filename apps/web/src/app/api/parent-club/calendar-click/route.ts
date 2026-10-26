import { NextResponse, type NextRequest } from 'next/server'
import { markCalendarClicked } from '@repo/data-access'
import { objectIdSchema } from '@repo/domain'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = objectIdSchema.safeParse(body.id)
    if (!parsed.success) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    await markCalendarClicked(parsed.data)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
