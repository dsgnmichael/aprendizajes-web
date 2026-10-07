import { NextResponse } from 'next/server'

/** Liveness probe (no database round-trip, no secrets). */
export function GET() {
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
