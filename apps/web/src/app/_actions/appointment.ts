'use server'

import { createHash } from 'node:crypto'
import { createAppointmentRequest, getPublishedProfile, getSiteSettings, hitRateLimit } from '@repo/data-access'
import { appointmentRequestInputSchema } from '@repo/domain'
import { headers } from 'next/headers'

export type AppointmentActionState =
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> }

async function clientIpHash(): Promise<string | null> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || ''
  return ip ? createHash('sha256').update(`appt:${ip}`).digest('base64url').slice(0, 32) : null
}

/**
 * Public appointment request. Validates with Zod at the boundary, enforces
 * honeypot + rate limit (per IP and per email) and only accepts requests for
 * PUBLISHED professionals whose CTA mode is INTERNAL_FORM.
 */
export async function submitAppointment(input: unknown): Promise<AppointmentActionState> {
  const parsed = appointmentRequestInputSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      fieldErrors[key] ??= issue.message
    }
    return { status: 'error', message: 'Revisa los campos marcados.', fieldErrors }
  }
  const data = parsed.data
  // Bots fill the hidden field: pretend success, store nothing.
  if (data.website) return { status: 'success', message: 'Solicitud recibida.' }

  try {
    const ipHash = await clientIpHash()
    const [byIp, byEmail] = await Promise.all([
      hitRateLimit(`appt:ip:${ipHash ?? 'unknown'}`, 5, 60 * 60),
      hitRateLimit(`appt:email:${data.email}`, 3, 60 * 60),
    ])
    if (!byIp.allowed || !byEmail.allowed) {
      return { status: 'error', message: 'Recibimos varias solicitudes seguidas. Intenta nuevamente en un rato.' }
    }

    const published = await getPublishedProfile(data.professionalSlug)
    if (!published || published.profile.appointment.mode !== 'INTERNAL_FORM') {
      return { status: 'error', message: 'Este profesional no recibe solicitudes por este medio.' }
    }
    const { profile } = published
    const site = await getSiteSettings()
    await createAppointmentRequest(
      data,
      { id: profile.id, slug: profile.slug, name: profile.name },
      { consentText: profile.appointment.consentText || site.copy.consentText, ipHash },
    )
    return { status: 'success', message: profile.appointment.successMessage || site.copy.appointmentSuccess }
  } catch (error) {
    console.error('[appointment] failed', error instanceof Error ? error.name : 'unknown')
    return { status: 'error', message: 'No pudimos enviar tu solicitud. Intenta nuevamente en unos minutos.' }
  }
}
