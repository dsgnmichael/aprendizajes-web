import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { safeRedirectPath } from '@repo/domain'

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/cron']

/**
 * Coarse gate: unauthenticated users are redirected to /login. This is NOT
 * the authorization layer – every page, server action and route handler
 * re-checks the session and permissions on the server.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)))
    return NextResponse.next()

  const adminBase = process.env.ADMIN_BASE_URL ?? ''
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: adminBase.startsWith('https://'),
  })
  if (token?.uid) return NextResponse.next()

  if (pathname.startsWith('/api/'))
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const login = request.nextUrl.clone()
  login.pathname = '/login'
  login.search = ''
  const callback = safeRedirectPath(`${pathname}${search}`, '/')
  if (callback !== '/') login.searchParams.set('callbackUrl', callback)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)'],
}
