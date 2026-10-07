import { z } from 'zod'

const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))

const secret = (min: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || v.length >= min, `must be at least ${min} characters`)

const url = (fallback: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/\/+$/, '') : fallback))
    .pipe(z.url())

/**
 * Every environment variable used by the platform. Optional features
 * (Google, Blob storage, cron, analytics) never block startup: their absence
 * simply disables the feature (see `features`).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: optional,
  MONGODB_DB_NAME: z.string().trim().default('aprendizajess'),
  AUTH_SECRET: secret(32),
  PUBLIC_BASE_URL: url('http://localhost:3000'),
  ADMIN_BASE_URL: url('http://localhost:3001'),
  REVALIDATION_SECRET: secret(32),
  PREVIEW_SECRET: secret(32),
  MEDIA_PROVIDER: z.enum(['local', 'vercel-blob']).default('local'),
  LOCAL_MEDIA_DIR: optional,
  BLOB_READ_WRITE_TOKEN: optional,
  GOOGLE_MAPS_API_KEY: optional,
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  GOOGLE_REDIRECT_URI: optional,
  INTEGRATION_ENCRYPTION_KEY: optional.refine(
    (v) => v === undefined || /^[A-Za-z0-9+/=_-]{43,}$/.test(v),
    'must be a base64 encoded 32-byte key (pnpm secrets:generate)',
  ),
  CRON_SECRET: secret(16),
  SEED_ADMIN_EMAIL: optional,
  SEED_ADMIN_PASSWORD: optional,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: optional,
})

export type ServerEnv = z.infer<typeof envSchema>

let cached: ServerEnv | undefined

export class ConfigError extends Error {
  override name = 'ConfigError'
}

/** Parses `process.env` once. Throws a readable error (without values). */
export function env(): ServerEnv {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new ConfigError(`Invalid environment variables:\n${issues}`)
  }
  cached = parsed.data
  return cached
}

/** Returns a required variable or throws a descriptive (value-free) error. */
export function requireEnv<K extends keyof ServerEnv>(key: K, feature: string): NonNullable<ServerEnv[K]> {
  const value = env()[key]
  if (value === undefined || value === null || value === '') {
    throw new ConfigError(`${String(key)} is required for ${feature}. See .env.example.`)
  }
  return value as NonNullable<ServerEnv[K]>
}

export const features = {
  database: () => Boolean(env().MONGODB_URI),
  googlePlaces: () => Boolean(env().GOOGLE_MAPS_API_KEY),
  googleBusinessProfile: () => {
    const e = env()
    return Boolean(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET && e.INTEGRATION_ENCRYPTION_KEY)
  },
  blobStorage: () => env().MEDIA_PROVIDER === 'vercel-blob' && Boolean(env().BLOB_READ_WRITE_TOKEN),
  crossAppRevalidation: () => Boolean(env().REVALIDATION_SECRET),
  preview: () => Boolean(env().PREVIEW_SECRET),
  cron: () => Boolean(env().CRON_SECRET),
}

/** For tests only. */
export function resetEnvCache() {
  cached = undefined
}
