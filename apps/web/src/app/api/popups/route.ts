import { NextResponse } from 'next/server'
import { listPopups } from '@repo/data-access'

export async function GET() {
  try {
    const popups = await listPopups()
    const activePopups = popups.filter((p) => p.active)
    return NextResponse.json(activePopups)
  } catch (error) {
    console.error('Error fetching popups:', error)
    return NextResponse.json({ error: 'Failed to fetch popups' }, { status: 500 })
  }
}
