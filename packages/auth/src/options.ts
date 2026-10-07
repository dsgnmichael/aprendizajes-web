import { env } from '@repo/config'
import {
  findUserForLogin,
  getUserById,
  hitRateLimit,
  peekRateLimit,
  recordAudit,
  recordLoginFailure,
  recordLoginSuccess,
  SYSTEM_ACTOR,
} from '@repo/data-access'
import { loginSchema } from '@repo/domain'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { burnPasswordCheck, verifyPassword } from './password'
import './types'

const SESSION_MAX_AGE = 8 * 60 * 60 // 8h working session
const RECHECK_SECONDS = 60

/**
 * Auth.js (next-auth v4, the current stable line) configuration for the
 * backoffice. JWT sessions in an HttpOnly, Secure (in production), SameSite=Lax
 * cookie; Auth.js provides CSRF protection for its endpoints.
 */
export function authOptions(): NextAuthOptions {
  const e = env()
  const secure = e.ADMIN_BASE_URL.startsWith('https://')
  return {
    secret: e.AUTH_SECRET,
    session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },
    pages: { signIn: '/login', error: '/login' },
    useSecureCookies: secure,
    providers: [
      CredentialsProvider({
        name: 'Email',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Contraseña', type: 'password' },
        },
        async authorize(credentials, req) {
          const parsed = loginSchema.safeParse(credentials)
          if (!parsed.success) return null
          const { email, password } = parsed.data

          const forwarded = (req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
          const ip = forwarded || 'unknown'
          // Every attempt counts per IP; only FAILED attempts count per account.
          const failKey = `login:fail:${email}`
          const [byIp, byEmail] = await Promise.all([
            hitRateLimit(`login:ip:${ip}`, 30, 15 * 60),
            peekRateLimit(failKey, 10, 15 * 60),
          ])
          if (!byIp.allowed || !byEmail.allowed) {
            throw new Error('RateLimited')
          }
          const fail = () => hitRateLimit(failKey, 10, 15 * 60)

          const user = await findUserForLogin(email)
          if (!user) {
            await fail()
            await burnPasswordCheck(password)
            await recordAudit(SYSTEM_ACTOR, 'auth.loginFailed', 'user', null, { reason: 'unknown_email' })
            return null
          }
          if (!user.active || (user.lockedUntil && user.lockedUntil > new Date())) {
            await burnPasswordCheck(password)
            return null
          }
          const ok = await verifyPassword(user.passwordHash, password)
          if (!ok) {
            await fail()
            await recordLoginFailure(user._id)
            await recordAudit(SYSTEM_ACTOR, 'auth.loginFailed', 'user', user._id.toHexString(), {
              reason: 'bad_password',
            })
            return null
          }
          await recordLoginSuccess(user._id)
          await recordAudit(
            { id: user._id.toHexString(), email: user.email, role: user.role },
            'auth.login',
            'user',
            user._id.toHexString(),
          )
          return { id: user._id.toHexString(), email: user.email, name: user.name, role: user.role }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        const now = Math.floor(Date.now() / 1000)
        if (user) {
          token.uid = user.id
          token.role = user.role
          token.checkedAt = now
          return token
        }
        // Periodically re-validate so deactivations / role changes apply quickly.
        if (token.uid && (!token.checkedAt || now - token.checkedAt > RECHECK_SECONDS)) {
          const fresh = await getUserById(token.uid)
          if (!fresh || !fresh.active) return { ...token, uid: undefined, role: undefined }
          token.role = fresh.role
          token.name = fresh.name
          token.checkedAt = now
        }
        return token
      },
      async session({ session, token }) {
        if (!token.uid || !token.role) {
          return { ...session, user: undefined as never }
        }
        session.user = {
          id: token.uid,
          email: token.email ?? '',
          name: token.name ?? '',
          role: token.role,
        }
        return session
      },
      async redirect({ url, baseUrl }) {
        // Only same-origin redirects (prevents open redirects).
        if (url.startsWith('/') && !url.startsWith('//')) return `${baseUrl}${url}`
        try {
          if (new URL(url).origin === baseUrl) return url
        } catch {
          /* fall through */
        }
        return baseUrl
      },
    },
  }
}
