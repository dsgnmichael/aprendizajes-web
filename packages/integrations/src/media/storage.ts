import { existsSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env, requireEnv } from '@repo/config'

/**
 * Storage abstraction. MongoDB only keeps metadata + URL; binaries live here.
 * - `local`: filesystem (development), served by the web app at /media/*.
 * - `vercel-blob`: Vercel Blob (production on Vercel).
 * Adding S3/R2/GCS means implementing this interface.
 */
export interface MediaStorage {
  readonly provider: 'local' | 'vercel-blob'
  put(key: string, data: Buffer, contentType: string): Promise<{ url: string }>
  delete(key: string, url: string): Promise<void>
}

export const SAFE_KEY = /^[a-z0-9][a-z0-9/_-]*\.(png|jpg|webp|avif)$/

function findRepoRoot(start: string): string {
  let dir = start
  for (let i = 0; i < 6; i++) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return start
}

export function localMediaDir(): string {
  return env().LOCAL_MEDIA_DIR ?? path.join(findRepoRoot(process.cwd()), '.media')
}

/** Resolves a key inside the media dir, rejecting path traversal. */
export function resolveLocalMediaPath(key: string): string | null {
  if (!SAFE_KEY.test(key) || key.includes('..')) return null
  // Runtime-only media dir outside the bundle: exclude from output file tracing.
  const root = path.resolve(/*turbopackIgnore: true*/ localMediaDir())
  const full = path.resolve(/*turbopackIgnore: true*/ root, key)
  return full.startsWith(root + path.sep) ? full : null
}

export const localStorage: MediaStorage = {
  provider: 'local',
  async put(key, data) {
    const full = resolveLocalMediaPath(key)
    if (!full) throw new Error('Invalid media key')
    await mkdir(path.dirname(full), { recursive: true })
    await writeFile(full, data)
    return { url: `${env().PUBLIC_BASE_URL}/media/${key}` }
  },
  async delete(key) {
    const full = resolveLocalMediaPath(key)
    if (full) await unlink(full).catch(() => undefined)
  },
}

export async function readLocalMedia(key: string): Promise<Buffer | null> {
  const full = resolveLocalMediaPath(key)
  if (!full) return null
  return readFile(/*turbopackIgnore: true*/ full).catch(() => null)
}

export const vercelBlobStorage: MediaStorage = {
  provider: 'vercel-blob',
  async put(key, data, contentType) {
    const { put } = await import('@vercel/blob')
    const blob = await put(key, data, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      token: requireEnv('BLOB_READ_WRITE_TOKEN', 'Vercel Blob storage'),
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    })
    return { url: blob.url }
  },
  async delete(_key, url) {
    const { del } = await import('@vercel/blob')
    await del(url, { token: requireEnv('BLOB_READ_WRITE_TOKEN', 'Vercel Blob storage') })
  },
}

export function getMediaStorage(): MediaStorage {
  return env().MEDIA_PROVIDER === 'vercel-blob' ? vercelBlobStorage : localStorage
}
