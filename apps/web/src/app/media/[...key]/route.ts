import { readLocalMedia } from '@repo/integrations/media'
import { NextResponse } from 'next/server'

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif' }

/**
 * Serves locally stored uploads (MEDIA_PROVIDER=local, development). Keys
 * are validated against a strict pattern and resolved inside the media
 * directory, so path traversal is impossible. Production uses Vercel Blob.
 */
export async function GET(_request: Request, { params }: RouteContext<'/media/[...key]'>) {
  const { key } = await params
  const path = key.join('/')
  const ext = path.split('.').pop() ?? ''
  const type = TYPES[ext]
  const data = type ? await readLocalMedia(path) : null
  if (!type || !data) return new NextResponse('Not found', { status: 404 })
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
}
