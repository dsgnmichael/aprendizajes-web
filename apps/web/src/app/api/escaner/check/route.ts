import { getStudentByCode } from '@repo/data-access'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.json({ exists: false })
  }

  const student = await getStudentByCode(code)
  return NextResponse.json({ exists: !!student })
}
