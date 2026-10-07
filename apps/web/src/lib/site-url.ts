import { env } from '@repo/config'

export function siteUrl(): string {
  return env().PUBLIC_BASE_URL
}

export function absoluteUrl(path: string): string {
  return new URL(path, `${siteUrl()}/`).toString()
}
