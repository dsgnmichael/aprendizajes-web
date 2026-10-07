import { z } from 'zod'
import {
  APPOINTMENT_STATUSES,
  type MEDIA_LIMITS,
  ROLES,
  TESTIMONIAL_ORIGINS,
  type AppointmentStatus,
  type Role,
  type TestimonialOrigin,
} from '../constants'
import { httpsUrlSchema, mediaRefSchema, optionalText, phoneSchema, text } from './common'

/* ------------------------------- Testimonials ------------------------------ */

export const testimonialInputSchema = z.object({
  professionalId: z.string().min(1, 'Selecciona un profesional').nullable(),
  authorName: text(80).min(1, 'Requerido'),
  authorAvatar: mediaRefSchema.optional(),
  authorDetail: optionalText(80),
  rating: z.number().int().min(1).max(5).nullable().default(5),
  content: text(2000).min(10, 'Mínimo 10 caracteres'),
  date: z.iso.date().nullable().default(null),
  sourceLabel: optionalText(60),
  sourceUrl: httpsUrlSchema.default(''),
  enabled: z.boolean().default(true),
  featured: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(10000).default(0),
  isDemo: z.boolean().default(false),
})
export type TestimonialInput = z.infer<typeof testimonialInputSchema>

export interface TestimonialDocument extends TestimonialInput {
  id: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Normalized testimonial DTO consumed by the public UI, whatever the provider.
 * Google-origin entries keep their original text and attribution intact.
 */
export interface TestimonialDTO {
  id: string
  origin: TestimonialOrigin
  authorName: string
  authorDetail?: string
  authorPhotoUrl?: string
  /** Link to the author's profile (Google requires it when available). */
  authorUrl?: string
  rating: number | null
  content: string
  /** ISO date when known. */
  date?: string
  /** Provider-formatted relative time ("hace 2 meses"). */
  relativeTime?: string
  /** Link back to the review/place on the provider. */
  sourceUrl?: string
  sourceLabel?: string
  featured: boolean
  isDemo?: boolean
  /** True when the text was machine translated by the provider. */
  translated?: boolean
}

export interface TestimonialSummary {
  averageRating: number | null
  totalReviews: number | null
  /** Where the aggregate comes from (only shown when legitimate). */
  aggregateOrigin: TestimonialOrigin | null
  placeUrl?: string
}

export interface TestimonialFeed {
  items: TestimonialDTO[]
  summary: TestimonialSummary
  /** Providers whose attribution must be displayed with the feed. */
  attributions: TestimonialOrigin[]
  /** Non-fatal provider errors (never contain secrets). */
  degraded: boolean
}

export const testimonialOriginSchema = z.enum(TESTIMONIAL_ORIGINS)

/* ------------------------------- Appointments ------------------------------ */

export const appointmentRequestInputSchema = z.object({
  professionalSlug: z.string().trim().min(1).max(80),
  firstName: text(60).min(2, 'Ingresa tu nombre'),
  lastName: optionalText(60),
  email: z.email('Email inválido').max(160),
  phone: phoneSchema.default(''),
  modality: optionalText(80),
  service: optionalText(100),
  preferredDate: z
    .union([z.literal(''), z.iso.date('Fecha inválida')])
    .default(''),
  preferredTime: z
    .union([z.literal(''), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida')])
    .default(''),
  message: optionalText(1500),
  consent: z.literal(true, { error: 'Debes aceptar para continuar' }),
  /** Honeypot – must stay empty. */
  website: z.string().max(0).optional().default(''),
  /** Attribution (e.g. "qr") – informative only. */
  entry: z.enum(['direct', 'qr', 'switcher']).default('direct'),
})
export type AppointmentRequestInput = z.infer<typeof appointmentRequestInputSchema>

export interface AppointmentRequestDocument {
  id: string
  professionalId: string
  professionalSlug: string
  professionalName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  modality: string
  service: string
  preferredDate: string
  preferredTime: string
  message: string
  consentText: string
  entry: 'direct' | 'qr' | 'switcher'
  status: AppointmentStatus
  notes: string
  createdAt: Date
  updatedAt: Date
}

export const appointmentStatusUpdateSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  notes: optionalText(2000),
})

/* ----------------------------------- Users --------------------------------- */

export const passwordSchema = z
  .string()
  .min(12, 'Mínimo 12 caracteres')
  .max(128)
  .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), 'Debe incluir letras y números')

export const userCreateSchema = z.object({
  name: text(80).min(2, 'Requerido'),
  email: z.email('Email inválido').max(160).transform((v) => v.toLowerCase()),
  role: z.enum(ROLES),
  password: passwordSchema,
})
export type UserCreate = z.infer<typeof userCreateSchema>

export interface UserDocument {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
}

export const loginSchema = z.object({
  email: z.email().max(160).transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
})

/* ----------------------------------- Media --------------------------------- */

export const mediaUploadMetaSchema = z.object({
  alt: text(240).default(''),
  folder: z.enum(['professionals', 'testimonials', 'site', 'gallery']).default('professionals'),
})

export interface MediaDocument {
  id: string
  provider: 'local' | 'vercel-blob' | 'static'
  key: string
  url: string
  filename: string
  mimeType: (typeof MEDIA_LIMITS.mimeTypes)[number]
  size: number
  width: number
  height: number
  hasAlpha: boolean
  alt: string
  focalX: number
  focalY: number
  folder: string
  createdAt: Date
  uploadedBy?: string
}

/* ------------------------------- Audit log --------------------------------- */

export const AUDIT_ACTIONS = [
  'professional.created',
  'professional.updated',
  'professional.published',
  'professional.unpublished',
  'professional.archived',
  'professional.duplicated',
  'professional.deleted',
  'landing.updated',
  'landing.published',
  'testimonial.created',
  'testimonial.updated',
  'testimonial.hidden',
  'testimonial.deleted',
  'appointment.statusChanged',
  'integration.connected',
  'integration.disconnected',
  'integration.updated',
  'integration.synced',
  'media.uploaded',
  'media.deleted',
  'settings.updated',
  'user.created',
  'user.roleChanged',
  'user.activated',
  'user.deactivated',
  'auth.login',
  'auth.loginFailed',
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export interface AuditActor {
  id: string
  email: string
  role: Role | 'SYSTEM'
}

export interface AuditLogDocument {
  id: string
  actor: AuditActor
  action: AuditAction
  entityType: string
  entityId: string | null
  timestamp: Date
  metadata: Record<string, string | number | boolean | null>
}

/* ------------------------------- Integrations ------------------------------ */

export const INTEGRATION_IDS = ['google_places', 'google_business_profile'] as const
export type IntegrationId = (typeof INTEGRATION_IDS)[number]

export interface IntegrationStatusView {
  id: IntegrationId
  enabled: boolean
  /** Required credentials exist in the environment. */
  configured: boolean
  connected: boolean
  accountLabel: string | null
  lastTestedAt: Date | null
  lastTestOk: boolean | null
  lastSyncAt: Date | null
  lastSyncStatus: 'ok' | 'error' | 'reauth_required' | null
  lastError: string | null
}
