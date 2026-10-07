import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { requireEnv } from '@repo/config'
import type { EncryptedValue } from '@repo/database'

function key(): Buffer {
  const raw = requireEnv('INTEGRATION_ENCRYPTION_KEY', 'encrypting integration tokens')
  const buf = Buffer.from(raw, raw.includes('-') || raw.includes('_') ? 'base64url' : 'base64')
  if (buf.length !== 32) throw new Error('INTEGRATION_ENCRYPTION_KEY must decode to 32 bytes')
  return buf
}

/** AES-256-GCM authenticated encryption for OAuth tokens at rest. */
export function encryptSecret(plain: string, keyOverride?: Buffer): EncryptedValue {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyOverride ?? key(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return { v: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') }
}

export function decryptSecret(value: EncryptedValue, keyOverride?: Buffer): string {
  const decipher = createDecipheriv('aes-256-gcm', keyOverride ?? key(), Buffer.from(value.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(value.data, 'base64')), decipher.final()]).toString('utf8')
}
