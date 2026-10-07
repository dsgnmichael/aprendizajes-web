'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  deleteMediaRecord,
  hitRateLimit,
  insertMedia,
  listMedia,
  updateMediaMeta,
} from '@repo/data-access'
import { mediaUploadMetaSchema, objectIdSchema, shortId, type MediaDocument } from '@repo/domain'
import {
  getMediaStorage,
  localStorage,
  processImage,
  vercelBlobStorage,
} from '@repo/integrations/media'
import { ActionError, runAction } from '@/lib/action'
import { toActor } from '@/lib/auth'
import { publicBaseUrl } from '@/lib/urls'

export type MediaItem = Omit<MediaDocument, 'createdAt'> & { createdAt: string }

function serialize(m: MediaDocument): MediaItem {
  return { ...m, createdAt: m.createdAt.toISOString() }
}

/**
 * Upload handler: the file is DECODED and re-encoded server-side (sharp),
 * so the declared mime/extension is never trusted. Only metadata + URL are
 * stored in MongoDB; the binary goes to the configured MediaStorage.
 */
export async function uploadMediaAction(formData: FormData) {
  return runAction('media:write', async (user) => {
    const limit = await hitRateLimit(`media:upload:${user.id}`, 60, 3600)
    if (!limit.allowed) throw new ActionError('Límite de subidas alcanzado. Intenta más tarde.')
    const file = formData.get('file')
    if (!(file instanceof File)) throw new ActionError('Selecciona un archivo')
    const meta = mediaUploadMetaSchema.parse({
      alt: formData.get('alt') ?? '',
      folder: formData.get('folder') ?? undefined,
    })
    const processed = await processImage(Buffer.from(await file.arrayBuffer()), {
      mimeType: file.type,
      filename: file.name,
    })
    const key = `${meta.folder}/${new Date().getUTCFullYear()}/${shortId('', 16)}.${processed.extension}`
    const storage = getMediaStorage()
    const { url } = await storage.put(key, processed.buffer, processed.mimeType)
    const doc = await insertMedia(
      {
        provider: storage.provider,
        key,
        url,
        filename: file.name.slice(0, 200),
        mimeType: processed.mimeType,
        size: processed.buffer.byteLength,
        width: processed.width,
        height: processed.height,
        hasAlpha: processed.hasAlpha,
        alt: meta.alt,
        focalX: 50,
        focalY: 50,
        folder: meta.folder,
      },
      toActor(user),
    )
    revalidatePath('/media')
    return serialize(doc)
  })
}

export async function listMediaAction(page = 1) {
  return runAction('media:write', async () => {
    const result = await listMedia({ page: z.number().int().min(1).parse(page), pageSize: 48 })
    return { ...result, items: result.items.map(serialize) }
  })
}

const metaSchema = z.object({
  alt: z.string().trim().max(240),
  focalX: z.number().min(0).max(100),
  focalY: z.number().min(0).max(100),
})

export async function updateMediaAction(id: string, input: unknown) {
  return runAction('media:write', async (user) => {
    await updateMediaMeta(objectIdSchema.parse(id), metaSchema.parse(input), toActor(user))
    revalidatePath('/media')
    return null
  })
}

export async function deleteMediaAction(id: string) {
  return runAction('media:write', async (user) => {
    const removed = await deleteMediaRecord(objectIdSchema.parse(id), toActor(user))
    // Delete from the storage the file was written to (static demo assets are left alone).
    if (removed.provider === 'local') await localStorage.delete(removed.key, removed.url)
    if (removed.provider === 'vercel-blob') await vercelBlobStorage.delete(removed.key, removed.url)
    revalidatePath('/media')
    return null
  })
}

const LOGO_MAX_BYTES = 600 * 1024

/**
 * Returns the site logo as a data URL so the QR canvas stays same-origin
 * (a cross-origin image would taint the canvas and block PNG export).
 */
export async function qrLogoDataUrlAction(url: string) {
  return runAction('professionals:read', async () => {
    const parsed = z.url({ protocol: /^https?$/ }).parse(url)
    const allowed = new URL(publicBaseUrl()).origin
    const host = new URL(parsed)
    if (host.origin !== allowed && !host.hostname.endsWith('.public.blob.vercel-storage.com')) {
      throw new ActionError('Origen de logo no permitido')
    }
    const response = await fetch(parsed, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !/^image\/(png|jpeg|webp)/.test(type))
      throw new ActionError('No se pudo cargar el logo')
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > LOGO_MAX_BYTES)
      throw new ActionError('El logo es demasiado pesado para el QR')
    return `data:${type.split(';')[0]};base64,${buffer.toString('base64')}`
  })
}
