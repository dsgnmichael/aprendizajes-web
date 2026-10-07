import sharp, { type Metadata } from 'sharp'
import { MEDIA_LIMITS } from '@repo/domain'

export class MediaValidationError extends Error {
  override name = 'MediaValidationError'
}

const FORMAT_TO_MIME = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  heif: 'image/avif',
} as const

const MAX_DIMENSION = 2400

export interface ProcessedImage {
  buffer: Buffer
  mimeType: (typeof MEDIA_LIMITS.mimeTypes)[number]
  extension: string
  width: number
  height: number
  hasAlpha: boolean
}

/**
 * Validates an upload by DECODING it (not trusting the client mime/extension),
 * then normalises it: applies EXIF orientation, strips metadata (GPS, camera)
 * and caps dimensions. Transparency is preserved for PNG/WebP/AVIF cut-outs.
 */
export async function processImage(input: Buffer, declared: { mimeType: string; filename: string }): Promise<ProcessedImage> {
  if (input.byteLength === 0) throw new MediaValidationError('Archivo vacío')
  if (input.byteLength > MEDIA_LIMITS.maxBytes) throw new MediaValidationError('El archivo supera 8 MB')
  const ext = declared.filename.split('.').pop()?.toLowerCase() ?? ''
  if (!(MEDIA_LIMITS.extensions as readonly string[]).includes(ext)) {
    throw new MediaValidationError('Extensión no permitida (png, jpg, webp, avif)')
  }
  if (!(MEDIA_LIMITS.mimeTypes as readonly string[]).includes(declared.mimeType)) {
    throw new MediaValidationError('Tipo de archivo no permitido')
  }

  let meta: Metadata
  try {
    meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata()
  } catch {
    throw new MediaValidationError('El archivo no es una imagen válida')
  }
  const format = meta.format as keyof typeof FORMAT_TO_MIME | undefined
  if (!format || !(format in FORMAT_TO_MIME)) throw new MediaValidationError('Formato de imagen no soportado')

  const pipeline = sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })

  const output =
    format === 'png'
      ? pipeline.png({ compressionLevel: 9 })
      : format === 'webp'
        ? pipeline.webp({ quality: 88 })
        : format === 'heif'
          ? pipeline.avif({ quality: 70 })
          : pipeline.jpeg({ quality: 86, mozjpeg: true })

  const { data, info } = await output.toBuffer({ resolveWithObject: true })
  return {
    buffer: data,
    mimeType: FORMAT_TO_MIME[format],
    extension: format === 'jpeg' ? 'jpg' : format === 'heif' ? 'avif' : format,
    width: info.width,
    height: info.height,
    hasAlpha: Boolean(meta.hasAlpha),
  }
}
