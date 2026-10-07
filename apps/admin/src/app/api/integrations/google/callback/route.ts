import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@repo/auth'
import { env } from '@repo/config'
import {
  getIntegration,
  recordAudit,
  storeRefreshToken,
  updateIntegration,
} from '@repo/data-access'
import { can } from '@repo/domain'
import { encryptSecret } from '@repo/integrations/crypto'
import { createGbpClient, getGbpCredentials } from '@repo/integrations/google'
import { safeEqual, sha256 } from '@repo/integrations/signing'

/** OAuth 2.0 redirect URI for Google Business Profile. */
export async function GET(request: NextRequest) {
  const adminBase = env().ADMIN_BASE_URL
  const back = (status: string) => NextResponse.redirect(`${adminBase}/integrations?gbp=${status}`)

  const session = await getServerSession(authOptions())
  if (!session?.user?.id || !can(session.user.role, 'integrations:connect'))
    return back('forbidden')
  const credentials = getGbpCredentials()
  if (!credentials) return back('not_configured')

  const params = request.nextUrl.searchParams
  if (params.get('error')) return back('denied')
  const code = params.get('code')
  const state = params.get('state')
  const integration = await getIntegration('google_business_profile')
  const pending = integration.pendingState
  const stateValid =
    !!state &&
    !!pending &&
    pending.expiresAt > new Date() &&
    pending.userId === session.user.id &&
    safeEqual(sha256(state), pending.hash)
  // The state is single-use whatever the outcome.
  await updateIntegration('google_business_profile', { pendingState: null })
  if (!code || !stateValid) return back('invalid_state')

  try {
    const client = createGbpClient(credentials)
    const { accessToken, refreshToken, scopes } = await client.exchangeCode(code)
    const accounts = await client.listAccounts(accessToken).catch(() => [])
    await storeRefreshToken('google_business_profile', encryptSecret(refreshToken), {
      accountLabel: accounts[0]?.label ?? null,
      scopes,
      userId: session.user.id,
    })
    await recordAudit(
      { id: session.user.id, email: session.user.email, role: session.user.role },
      'integration.connected',
      'integration',
      'google_business_profile',
      { accounts: accounts.length },
    )
    return back('connected')
  } catch (error) {
    await updateIntegration('google_business_profile', {
      lastError: error instanceof Error ? error.message.slice(0, 200) : 'OAuth error',
    })
    return back('error')
  }
}
