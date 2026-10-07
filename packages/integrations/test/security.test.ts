import { randomBytes } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { decryptSecret, encryptSecret } from '../src/crypto'
import { isValidRevalidationTag } from '../src/revalidation'
import { signPreviewToken, signRequest, verifyPreviewToken, verifySignedRequest } from '../src/signing'

const key = randomBytes(32)
const SECRET = 'x'.repeat(40)

describe('token encryption (AES-256-GCM)', () => {
  it('round-trips and never stores plaintext', () => {
    const enc = encryptSecret('refresh-token-123', key)
    expect(JSON.stringify(enc)).not.toContain('refresh-token-123')
    expect(decryptSecret(enc, key)).toBe('refresh-token-123')
  })
  it('detects tampering and wrong keys', () => {
    const enc = encryptSecret('secret', key)
    expect(() => decryptSecret({ ...enc, data: Buffer.from('other').toString('base64') }, key)).toThrow()
    expect(() => decryptSecret(enc, randomBytes(32))).toThrow()
  })
})

describe('preview tokens', () => {
  it('accepts valid tokens and rejects tampered/expired ones', () => {
    const token = signPreviewToken(SECRET, 'abc', 60)
    expect(verifyPreviewToken(SECRET, token)?.pid).toBe('abc')
    expect(verifyPreviewToken('y'.repeat(40), token)).toBeNull()
    const [body, sig] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ pid: 'other', exp: 9999999999 })).toString('base64url')
    expect(verifyPreviewToken(SECRET, `${forged}.${sig}`)).toBeNull()
    expect(body).toBeTruthy()
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 120_000)
    expect(verifyPreviewToken(SECRET, token)).toBeNull()
    vi.useRealTimers()
  })
})

describe('signed revalidation requests', () => {
  it('verifies HMAC and rejects replays outside the window', () => {
    const body = JSON.stringify({ tags: ['site'] })
    const { timestamp, signature } = signRequest(SECRET, body)
    expect(verifySignedRequest(SECRET, body, timestamp, signature)).toBe(true)
    expect(verifySignedRequest(SECRET, body + ' ', timestamp, signature)).toBe(false)
    const old = signRequest(SECRET, body, Math.floor(Date.now() / 1000) - 3600)
    expect(verifySignedRequest(SECRET, body, old.timestamp, old.signature)).toBe(false)
    expect(verifySignedRequest(SECRET, body, null, signature)).toBe(false)
  })
  it('only accepts well-formed tags', () => {
    expect(isValidRevalidationTag('profile:jessica-de-sousa')).toBe(true)
    expect(isValidRevalidationTag('testimonials:0123456789abcdef01234567')).toBe(true)
    expect(isValidRevalidationTag('anything')).toBe(false)
    expect(isValidRevalidationTag('profile:../../x')).toBe(false)
  })
})
