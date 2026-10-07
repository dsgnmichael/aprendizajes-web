import { z } from 'zod'
import {
  APPOINTMENT_MODES,
  PROFESSIONAL_STATUSES,
  TESTIMONIAL_SOURCES,
  type ProfessionalStatus,
} from '../constants'
import { isValidSlug } from '../logic/slug'
import { sectionsSchema, type Section } from '../sections/registry'
import {
  httpsUrlSchema,
  iconNameSchema,
  labeledIconSchema,
  mediaRefSchema,
  optionalText,
  phoneSchema,
  socialLinksSchema,
  text,
} from './common'
import { themeOverridesSchema } from './theme'

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Mínimo 2 caracteres')
  .max(80, 'Máximo 80 caracteres')
  .refine(isValidSlug, 'Solo minúsculas, números y guiones; no puede ser una ruta reservada')

export const serviceSchema = z.object({
  id: z.string().min(1).max(40),
  name: text(100).min(1, 'Requerido'),
  description: optionalText(500),
  duration: optionalText(40),
  icon: iconNameSchema.default('heart-handshake'),
})
export type Service = z.infer<typeof serviceSchema>

export const appointmentFormFieldsSchema = z.object({
  lastName: z.boolean().default(true),
  phone: z.boolean().default(true),
  modality: z.boolean().default(true),
  service: z.boolean().default(true),
  preferredDate: z.boolean().default(true),
  preferredTime: z.boolean().default(true),
  message: z.boolean().default(true),
})
export type AppointmentFormFields = z.infer<typeof appointmentFormFieldsSchema>

export const appointmentConfigSchema = z
  .object({
    mode: z.enum(APPOINTMENT_MODES).default('INTERNAL_FORM'),
    buttonLabel: optionalText(40),
    externalUrl: httpsUrlSchema.default(''),
    whatsappNumber: phoneSchema.default(''),
    whatsappMessage: optionalText(400),
    formTitle: optionalText(80),
    formIntro: optionalText(300),
    successMessage: optionalText(300),
    fields: appointmentFormFieldsSchema.default({
      lastName: true,
      phone: true,
      modality: true,
      service: true,
      preferredDate: true,
      preferredTime: true,
      message: true,
    }),
    consentText: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'EXTERNAL_URL' && !/^https:\/\//.test(value.externalUrl)) {
      ctx.addIssue({ code: 'custom', path: ['externalUrl'], message: 'Requiere una URL https' })
    }
    if (value.mode === 'WHATSAPP' && value.whatsappNumber.replace(/\D/g, '').length < 8) {
      ctx.addIssue({ code: 'custom', path: ['whatsappNumber'], message: 'Requiere un número de WhatsApp' })
    }
  })
export type AppointmentConfig = z.infer<typeof appointmentConfigSchema>

export const testimonialsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  source: z.enum(TESTIMONIAL_SOURCES).default('MANUAL'),
  maxReviews: z.number().int().min(1).max(20).default(8),
  minimumRating: z.number().int().min(1).max(5).default(4),
  ordering: z.enum(['featured', 'recent', 'rating']).default('featured'),
  manualFallback: z.boolean().default(true),
  showAverageRating: z.boolean().default(true),
  showTotalReviews: z.boolean().default(true),
  showSourceBadge: z.boolean().default(true),
  /** Google Place ID (allowed to be stored indefinitely by Places policies). */
  googlePlaceId: optionalText(300),
  /** Business Profile location resource name, e.g. `locations/123`. */
  gbpLocationName: optionalText(200),
  /** Review identifiers hidden by the admin (identifiers only, never content). */
  hiddenReviewIds: z.array(z.string().max(300)).max(200).default([]),
  addReviewUrl: httpsUrlSchema.default(''),
})
export type TestimonialsConfig = z.infer<typeof testimonialsConfigSchema>

export const seoSchema = z.object({
  title: optionalText(70),
  description: optionalText(170),
  canonical: httpsUrlSchema.default(''),
  ogTitle: optionalText(90),
  ogDescription: optionalText(200),
  ogImage: mediaRefSchema.optional(),
  noIndex: z.boolean().default(false),
})
export type SeoConfig = z.infer<typeof seoSchema>

export const professionalImagesSchema = z.object({
  hero: mediaRefSchema.optional(),
  heroMobile: mediaRefSchema.optional(),
  avatar: mediaRefSchema.optional(),
  profile: mediaRefSchema.optional(),
})

export const locationSchema = z.object({
  label: optionalText(80),
  address: optionalText(200),
  city: optionalText(80),
  region: optionalText(80),
  country: optionalText(2),
  mapsUrl: httpsUrlSchema.default(''),
})

/**
 * Everything an editor can change about a professional. This is the *draft*;
 * the public site never reads it directly (see PublishedProfile).
 */
export const professionalInputSchema = z.object({
  name: text(100).min(2, 'Requerido'),
  slug: slugSchema,
  professionalTitle: text(80).min(2, 'Requerido'),
  /** Handwritten-style accent shown under the name (e.g. "psicopedagoga"). */
  scriptTitle: optionalText(60),
  credentials: z.array(text(120)).max(10).default([]),
  shortDescription: optionalText(300),
  biography: optionalText(5000),
  yearsOfExperience: z.number().int().min(0).max(80).nullable().default(null),
  images: professionalImagesSchema.default({}),
  specialties: z.array(labeledIconSchema).max(12).default([]),
  targetAudience: z.array(labeledIconSchema).max(8).default([]),
  modalities: z.array(labeledIconSchema).max(8).default([]),
  services: z.array(serviceSchema).max(20).default([]),
  contact: z
    .object({
      email: z.union([z.literal(''), z.email('Email inválido').max(160)]).default(''),
      phone: phoneSchema.default(''),
      whatsapp: phoneSchema.default(''),
    })
    .default({ email: '', phone: '', whatsapp: '' }),
  social: socialLinksSchema.default({
    instagram: '',
    tiktok: '',
    facebook: '',
    linkedin: '',
    youtube: '',
    website: '',
  }),
  location: locationSchema.default({ label: '', address: '', city: '', region: '', country: '', mapsUrl: '' }),
  appointment: appointmentConfigSchema.default({
    mode: 'INTERNAL_FORM',
    buttonLabel: '',
    externalUrl: '',
    whatsappNumber: '',
    whatsappMessage: '',
    formTitle: '',
    formIntro: '',
    successMessage: '',
    fields: {
      lastName: true,
      phone: true,
      modality: true,
      service: true,
      preferredDate: true,
      preferredTime: true,
      message: true,
    },
    consentText: '',
  }),
  testimonials: testimonialsConfigSchema.default(testimonialsConfigSchema.parse({})),
  seo: seoSchema.default(seoSchema.parse({})),
  theme: themeOverridesSchema.default({ colors: {} }),
  sections: sectionsSchema.default([]),
  displayOrder: z.number().int().min(0).max(10000).default(0),
  /** Marks seeded demo content so it is easy to find and replace. */
  isDemo: z.boolean().default(false),
})
export type ProfessionalInput = z.infer<typeof professionalInputSchema>

/** Minimal payload to create a professional from the admin "new" dialog. */
export const professionalCreateSchema = professionalInputSchema.pick({
  name: true,
  slug: true,
  professionalTitle: true,
})
export type ProfessionalCreate = z.infer<typeof professionalCreateSchema>

export const professionalStatusSchema = z.enum(PROFESSIONAL_STATUSES)

/** Draft document as stored in Mongo (`professionals`). */
export interface ProfessionalDocument extends ProfessionalInput {
  id: string
  status: ProfessionalStatus
  /** Incremented on every draft save. */
  revision: number
  /** Revision currently live on the public site (null when never published). */
  publishedRevision: number | null
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  createdBy?: string
  updatedBy?: string
}

export type ProfessionalSummary = Pick<
  ProfessionalDocument,
  | 'id'
  | 'name'
  | 'slug'
  | 'professionalTitle'
  | 'status'
  | 'revision'
  | 'publishedRevision'
  | 'updatedAt'
  | 'publishedAt'
  | 'displayOrder'
  | 'isDemo'
> & { avatar?: z.infer<typeof mediaRefSchema> }

export function hasUnpublishedChanges(p: Pick<ProfessionalDocument, 'revision' | 'publishedRevision' | 'status'>) {
  return p.status === 'published' && p.publishedRevision !== null && p.revision > p.publishedRevision
}

/* -------------------------------------------------------------------------- */
/*  Public representation                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Snapshot of a professional as it must appear publicly. Created atomically at
 * publish time; the web app consumes only this shape.
 */
export interface PublicProfile
  extends Omit<ProfessionalInput, 'testimonials' | 'isDemo' | 'displayOrder' | 'sections'> {
  id: string
  revision: number
  publishedAt: string
  sections: Section[]
  testimonials: Omit<TestimonialsConfig, 'hiddenReviewIds'>
}

export interface PublishedProfileDocument {
  professionalId: string
  slug: string
  revision: number
  displayOrder: number
  publishedAt: Date
  profile: PublicProfile
  /** Server-only: never serialized to the client. */
  hiddenReviewIds: string[]
}

/** Lightweight item for the professional switcher and the directory. */
export interface ProfessionalCard {
  id: string
  slug: string
  name: string
  professionalTitle: string
  scriptTitle: string
  avatar?: z.infer<typeof mediaRefSchema>
  hero?: z.infer<typeof mediaRefSchema>
  shortDescription: string
}

export function toPublicProfile(doc: ProfessionalDocument, publishedAt: Date): PublicProfile {
  const { hiddenReviewIds: _hidden, ...testimonials } = doc.testimonials
  return {
    id: doc.id,
    revision: doc.revision,
    publishedAt: publishedAt.toISOString(),
    name: doc.name,
    slug: doc.slug,
    professionalTitle: doc.professionalTitle,
    scriptTitle: doc.scriptTitle,
    credentials: doc.credentials,
    shortDescription: doc.shortDescription,
    biography: doc.biography,
    yearsOfExperience: doc.yearsOfExperience,
    images: doc.images,
    specialties: doc.specialties,
    targetAudience: doc.targetAudience,
    modalities: doc.modalities,
    services: doc.services,
    contact: doc.contact,
    social: doc.social,
    location: doc.location,
    appointment: doc.appointment,
    testimonials,
    seo: doc.seo,
    theme: doc.theme,
    sections: doc.sections,
  }
}

export function toProfessionalCard(profile: PublicProfile): ProfessionalCard {
  return {
    id: profile.id,
    slug: profile.slug,
    name: profile.name,
    professionalTitle: profile.professionalTitle,
    scriptTitle: profile.scriptTitle,
    avatar: profile.images.avatar ?? profile.images.profile,
    hero: profile.images.hero,
    shortDescription: profile.shortDescription,
  }
}
