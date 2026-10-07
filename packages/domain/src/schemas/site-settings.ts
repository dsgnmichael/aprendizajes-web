import { z } from 'zod'
import { ROOT_MODES } from '../constants'
import {
  hrefSchema,
  httpsUrlSchema,
  mediaRefSchema,
  optionalText,
  socialLinksSchema,
  text,
} from './common'
import { themeSchema } from './theme'

export const navItemSchema = z.object({
  id: z.string().min(1).max(40),
  label: text(40).min(1, 'Requerido'),
  href: hrefSchema.refine((v) => v !== '', 'Requerido'),
  enabled: z.boolean().default(true),
})
export type NavItem = z.infer<typeof navItemSchema>

export const siteSettingsSchema = z.object({
  organizationName: text(80).min(1).default('Aprendizajess'),
  tagline: optionalText(160),
  logo: mediaRefSchema.optional(),
  favicon: mediaRefSchema.optional(),
  theme: themeSchema.default(themeSchema.parse({})),
  navigation: z
    .object({
      enabled: z.boolean().default(true),
      items: z.array(navItemSchema).max(8).default([]),
    })
    .default({ enabled: true, items: [] }),
  footer: z
    .object({
      text: optionalText(300),
      showSocial: z.boolean().default(true),
      links: z.array(navItemSchema).max(8).default([]),
    })
    .default({ text: '', showSocial: true, links: [] }),
  social: socialLinksSchema.default({
    instagram: '',
    tiktok: '',
    facebook: '',
    linkedin: '',
    youtube: '',
    website: '',
  }),
  /** Default copy used when a section/professional leaves a label empty. */
  copy: z
    .object({
      appointmentCta: text(40).default('Agendar cita'),
      testimonialsTitle: text(80).default('Lo que dicen las familias'),
      switcherTitle: text(80).default('Conoce al equipo'),
      directoryTitle: text(120).default('Nuestro equipo'),
      directoryIntro: optionalText(400),
      servicesTitle: text(80).default('Cómo puedo ayudarte'),
      specialtiesTitle: text(80).default('Especialidades'),
      aboutTitle: text(80).default('Sobre mí'),
      contactTitle: text(80).default('Hablemos'),
      appointmentSuccess: text(300).default(
        '¡Gracias! Recibimos tu solicitud y te contactaremos a la brevedad.',
      ),
      consentText: text(500).default(
        'Acepto que mis datos sean utilizados únicamente para coordinar mi cita.',
      ),
      addReviewLabel: text(60).default('Dejar una reseña'),
    })
    .default(() => ({
      appointmentCta: 'Agendar cita',
      testimonialsTitle: 'Lo que dicen las familias',
      switcherTitle: 'Conoce al equipo',
      directoryTitle: 'Nuestro equipo',
      directoryIntro: '',
      servicesTitle: 'Cómo puedo ayudarte',
      specialtiesTitle: 'Especialidades',
      aboutTitle: 'Sobre mí',
      contactTitle: 'Hablemos',
      appointmentSuccess: '¡Gracias! Recibimos tu solicitud y te contactaremos a la brevedad.',
      consentText: 'Acepto que mis datos sean utilizados únicamente para coordinar mi cita.',
      addReviewLabel: 'Dejar una reseña',
    })),
  policies: z
    .object({
      privacyUrl: hrefSchema.default(''),
      termsUrl: hrefSchema.default(''),
    })
    .default({ privacyUrl: '', termsUrl: '' }),
  seo: z
    .object({
      defaultTitle: text(70).default('Aprendizajess'),
      titleTemplate: text(70)
        .default('%s · Aprendizajess')
        .refine((v) => v.includes('%s'), 'Debe incluir %s'),
      description: optionalText(170),
      ogImage: mediaRefSchema.optional(),
      locale: text(10).default('es_CL'),
    })
    .default({ defaultTitle: 'Aprendizajess', titleTemplate: '%s · Aprendizajess', description: '', locale: 'es_CL' }),
  root: z
    .object({
      mode: z.enum(ROOT_MODES).default('LANDING'),
      defaultProfessionalSlug: optionalText(80),
      /** When DEFAULT_PROFESSIONAL: render in place (true) or redirect (false). */
      renderInPlace: z.boolean().default(true),
    })
    .default({ mode: 'LANDING', defaultProfessionalSlug: '', renderInPlace: true }),
  switcher: z
    .object({
      enabled: z.boolean().default(true),
      showNames: z.boolean().default(true),
      /** Prefetch the neighbour profiles of the active one. */
      prefetchNeighbours: z.boolean().default(true),
    })
    .default({ enabled: true, showNames: true, prefetchNeighbours: true }),
  analytics: z
    .object({
      ga4MeasurementId: z
        .string()
        .trim()
        .regex(/^(G-[A-Z0-9]{4,20})?$/, 'ID de GA4 inválido (G-XXXX)')
        .default(''),
    })
    .default({ ga4MeasurementId: '' }),
  organization: z
    .object({
      legalName: optionalText(120),
      url: httpsUrlSchema.default(''),
      email: optionalText(160),
      phone: optionalText(30),
      whatsapp: optionalText(30),
      address: optionalText(200),
      city: optionalText(80),
      mapsUrl: httpsUrlSchema.default(''),
      hours: optionalText(200),
    })
    .default({ legalName: '', url: '', email: '', phone: '', whatsapp: '', address: '', city: '', mapsUrl: '', hours: '' }),
})
export type SiteSettings = z.infer<typeof siteSettingsSchema>

export const defaultSiteSettings: SiteSettings = siteSettingsSchema.parse({})
