import { publishedSlugExists } from '@repo/data-access'
import { isValidSlug } from '@repo/domain'
import { NextResponse, type NextRequest } from 'next/server'
import { forget, isMemoised, memoise } from '@/lib/slug-memo'

/*
 * With Cache Components every page streams a static shell first, so the HTTP
 * status is decided here (Next.js docs: "run that check in proxy"). Unknown,
 * draft or archived slugs get a real 404 instead of a soft 404.
 *
 * Positive results are memoised briefly; misses are always re-checked so a
 * freshly published profile is reachable immediately.
 */
async function exists(slug: string): Promise<boolean> {
  if (isMemoised(slug)) return true
  const found = await publishedSlugExists(slug)
  if (found) memoise(slug)
  else forget(slug)
  return found
}

/** Single-segment routes that exist in the app (never treated as profile slugs). */
const APP_ROUTES = new Set(['equipo'])

export async function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.slice(1)
  if (!segment || segment.includes('/') || APP_ROUTES.has(segment)) return NextResponse.next()
  const slug = decodeURIComponent(segment)
  try {
    if (isValidSlug(slug) && (await exists(slug))) return NextResponse.next()
  } catch {
    // Database unreachable: fail open and let the page/error boundary respond.
    return NextResponse.next()
  }
  // A path that matches no route: Next renders app/not-found.tsx with a native
  // 404 status (a prerendered target page would be served with 200 instead).
  return NextResponse.rewrite(new URL('/_/not-found', request.url))
}

export const config = {
  // Single-segment paths only; system routes and static files are excluded.
  matcher: [
    '/((?!api|_next|media|demo|brand|preview|favicon\\.ico|robots\\.txt|sitemap\\.xml|icon|apple-icon|opengraph-image|twitter-image|manifest)[^/]+)',
  ],
}
