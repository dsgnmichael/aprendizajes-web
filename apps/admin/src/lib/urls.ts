import { env } from '@repo/config'
import { publicProfileUrl, qrTargetUrl } from '@repo/domain'

export function publicBaseUrl(): string {
  return env().PUBLIC_BASE_URL
}

/** Media stored as site-relative paths lives in the web app's public dir. */
export function absoluteMediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  return url.startsWith('/') ? `${publicBaseUrl()}${url}` : url
}

export function profileUrls(slug: string) {
  const base = publicBaseUrl()
  return { publicUrl: publicProfileUrl(base, slug), qrUrl: qrTargetUrl(base, slug) }
}
