import { describe, expect, it } from 'vitest'
import { burnPasswordCheck, hashPassword, verifyPassword } from '../src/password'

describe('password hashing (Argon2id)', () => {
  it('hashes with argon2id and verifies only the right password', async () => {
    const hash = await hashPassword('Correct-horse-42')
    expect(hash.startsWith('$argon2id$')).toBe(true)
    expect(hash).not.toContain('Correct-horse-42')
    expect(await verifyPassword(hash, 'Correct-horse-42')).toBe(true)
    expect(await verifyPassword(hash, 'wrong-password-42')).toBe(false)
  })
  it('never throws on malformed hashes', async () => {
    expect(await verifyPassword('not-a-hash', 'x')).toBe(false)
    await expect(burnPasswordCheck('anything')).resolves.toBeUndefined()
  })
})
