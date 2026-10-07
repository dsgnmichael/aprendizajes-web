import type { AppointmentConfig } from '../schemas/professional'

/** Canonical public URL of a professional: `${PUBLIC_BASE_URL}/${slug}`. */
export function publicProfileUrl(publicBaseUrl: string, slug: string): string {
  const base = publicBaseUrl.replace(/\/+$/, '')
  return `${base}/${encodeURIComponent(slug)}`
}

/** URL encoded in printed QR codes. `src=qr` lets analytics detect QR entries. */
export function qrTargetUrl(publicBaseUrl: string, slug: string): string {
  return `${publicProfileUrl(publicBaseUrl, slug)}?src=qr`
}

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '')
}

/** Builds a wa.me deep link with a prefilled, URL-encoded message. */
export function whatsappUrl(phone: string, message?: string): string {
  const number = digitsOnly(phone)
  const text = message?.trim()
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match)
}

export type AppointmentAction =
  | { kind: 'form' }
  | { kind: 'link'; href: string; external: true }
  | { kind: 'disabled' }

/**
 * Resolves what the "Agendar cita" CTA should do. Adapters for future
 * providers (Calendly embed, Google Calendar booking pages…) plug in here
 * without touching the professional model.
 */
export function resolveAppointmentAction(
  config: AppointmentConfig,
  ctx: { professionalName: string },
): AppointmentAction {
  switch (config.mode) {
    case 'INTERNAL_FORM':
      return { kind: 'form' }
    case 'EXTERNAL_URL':
      return /^https:\/\//.test(config.externalUrl)
        ? { kind: 'link', href: config.externalUrl, external: true }
        : { kind: 'disabled' }
    case 'WHATSAPP': {
      if (digitsOnly(config.whatsappNumber).length < 8) return { kind: 'disabled' }
      const message = fillTemplate(
        config.whatsappMessage || 'Hola {name}, me gustaría agendar una cita.',
        { name: ctx.professionalName },
      )
      return { kind: 'link', href: whatsappUrl(config.whatsappNumber, message), external: true }
    }
  }
}

/**
 * Only allows redirects to same-origin relative paths. Prevents open
 * redirects via `callbackUrl`-style parameters.
 */
export function safeRedirectPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (/[\r\n]/.test(value)) return fallback
  return value
}
