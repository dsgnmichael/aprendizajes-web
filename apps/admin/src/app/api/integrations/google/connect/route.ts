import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@repo/auth'
import { env } from '@repo/config'
import { hitRateLimit, updateIntegration } from '@repo/data-access'
import { can } from '@repo/domain'
import { buildGbpAuthUrl, getGbpCredentials } from '@repo/integrations/google'
import { randomToken, sha256 } from '@repo/integrations/signing'

/** Starts the Google Business Profile OAuth flow (SUPER_ADMIN only). */
export async function GET() {
  const adminBase = env().ADMIN_BASE_URL
  const session = await getServerSession(authOptions())
  if (!session?.user?.id) return NextResponse.redirect(`${adminBase}/login`)
  if (!can(session.user.role, 'integrations:connect'))
    return NextResponse.redirect(`${adminBase}/forbidden`)
  const credentials = getGbpCredentials()
  if (!credentials) return NextResponse.redirect(`${adminBase}/integrations?gbp=not_configured`)
  const limit = await hitRateLimit(`gbp:connect:${session.user.id}`, 10, 600)
  if (!limit.allowed) return NextResponse.redirect(`${adminBase}/integrations?gbp=rate_limited`)

  // CSRF protection: random state, only its hash is stored, bound to the user, 10 min TTL.
  const state = randomToken(32)
  await updateIntegration('google_business_profile', {
    pendingState: {
      hash: sha256(state),
      expiresAt: new Date(Date.now() + 10 * 60_000),
      userId: session.user.id,
    },
  })
  return NextResponse.redirect(buildGbpAuthUrl(credentials, state))
}
