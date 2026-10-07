import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export function hmac(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('base64url')
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/* ------------------------------- Preview tokens ---------------------------- */

export interface PreviewClaims {
  /** Professional id whose DRAFT may be rendered. */
  pid: string
  /** Expiry (unix seconds). */
  exp: number
}

/** Short-lived signed token for the draft preview iframe (admin → web). */
export function signPreviewToken(secret: string, pid: string, ttlSeconds = 15 * 60): string {
  const claims: PreviewClaims = { pid, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${body}.${hmac(secret, `preview.${body}`)}`
}

export function verifyPreviewToken(secret: string, token: string): PreviewClaims | null {
  const [body, signature] = token.split('.')
  if (!body || !signature || !safeEqual(signature, hmac(secret, `preview.${body}`))) return null
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as PreviewClaims
    if (typeof claims.pid !== 'string' || typeof claims.exp !== 'number') return null
    if (claims.exp < Math.floor(Date.now() / 1000)) return null
    return claims
  } catch {
    return null
  }
}

/* ------------------------- Signed server-to-server calls -------------------- */

const MAX_SKEW_SECONDS = 300

export function signRequest(secret: string, body: string, timestamp = Math.floor(Date.now() / 1000)) {
  return { timestamp: String(timestamp), signature: hmac(secret, `${timestamp}.${body}`) }
}

/** Verifies HMAC(timestamp.body) and rejects stale requests (replay window 5 min). */
export function verifySignedRequest(
  secret: string,
  body: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false
  const skew = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp))
  if (skew > MAX_SKEW_SECONDS) return false
  return safeEqual(signature, hmac(secret, `${timestamp}.${body}`))
}
