import { hash, verify } from '@node-rs/argon2'

/**
 * Argon2id with OWASP-recommended parameters (19 MiB, 2 iterations).
 * @node-rs/argon2 ships prebuilt binaries (no node-gyp) and works on Vercel.
 */
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 } as const

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS)
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password)
  } catch {
    return false
  }
}

/** Equalises timing for unknown users to avoid user enumeration. */
let dummyHash: Promise<string> | undefined
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hash('timing-equaliser-not-a-real-password', OPTIONS)
  await verifyPassword(await dummyHash, password)
}
