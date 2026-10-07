import { env } from '@repo/config'
import { isValidRevalidationTag } from '@repo/integrations/revalidation'
import { verifySignedRequest } from '@repo/integrations/signing'
import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { forget } from '@/lib/slug-memo'

const bodySchema = z.object({ tags: z.array(z.string().max(120)).min(1).max(200) })

/**
 * Private cache invalidation endpoint called by the backoffice after it
 * publishes/changes content. Requests are authenticated with
 * HMAC-SHA256(timestamp.body) using REVALIDATION_SECRET and must be fresh
 * (5 min window). Only well-formed tags are accepted.
 */
export async function POST(request: NextRequest) {
  const secret = env().REVALIDATION_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  const raw = await request.text()
  if (raw.length > 20_000) return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  const ok = verifySignedRequest(secret, raw, request.headers.get('x-timestamp'), request.headers.get('x-signature'))
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const tags = parsed.data.tags.filter(isValidRevalidationTag)
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 })
    if (tag.startsWith('profile:')) forget(tag.slice('profile:'.length))
    if (tag === 'directory') forget()
  }
  return NextResponse.json({ revalidated: tags })
}
