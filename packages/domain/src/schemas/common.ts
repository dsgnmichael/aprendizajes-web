import { z } from 'zod'
import { ICON_NAMES } from '../constants'

export const objectIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, 'Identificador inválido')

/** Short, trimmed single-line text. */
export const text = (max = 160) => z.string().trim().max(max)
export const optionalText = (max = 160) => text(max).optional().default('')

/**
 * Links accepted from the CMS. Only http(s), mailto, tel and site-relative
 * paths/anchors are allowed: `javascript:` and other schemes are rejected.
 */
export const SAFE_HREF = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d\s()-]+|\/(?!\/)[^\s]*|#[\w-]*)$/i

export const hrefSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === '' || SAFE_HREF.test(value), 'Enlace no permitido')

export const httpsUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === '' || /^https?:\/\/[^\s]+$/i.test(value), 'Debe ser una URL http(s)')

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, 'Color hexadecimal inválido')

export const iconNameSchema = z.enum(ICON_NAMES)

/** Image reference stored inside documents (never the binary itself). */
export const mediaRefSchema = z.object({
  mediaId: z.string().optional(),
  url: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => /^(https:\/\/|http:\/\/localhost|http:\/\/127\.0\.0\.1|\/)/.test(v), 'URL de imagen inválida'),
  alt: z.string().trim().max(240).default(''),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  /** Focal point in percentage (0-100), used as object-position. */
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
  /** True when the image has transparency (cutout) – changes hero composition. */
  hasAlpha: z.boolean().default(false),
})
export type MediaRef = z.infer<typeof mediaRefSchema>

export const labeledIconSchema = z.object({
  id: z.string().min(1).max(40),
  label: text(80).min(1, 'Requerido'),
  icon: iconNameSchema.default('sparkles'),
})
export type LabeledIcon = z.infer<typeof labeledIconSchema>

export const socialLinksSchema = z.object({
  instagram: httpsUrlSchema.default(''),
  tiktok: httpsUrlSchema.default(''),
  facebook: httpsUrlSchema.default(''),
  linkedin: httpsUrlSchema.default(''),
  youtube: httpsUrlSchema.default(''),
  website: httpsUrlSchema.default(''),
})
export type SocialLinks = z.infer<typeof socialLinksSchema>
export const SOCIAL_KEYS = Object.keys(socialLinksSchema.shape) as (keyof SocialLinks)[]

export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v === '' || /^\+?[\d\s()-]{7,20}$/.test(v), 'Teléfono inválido')

export const ctaSchema = z.object({
  label: text(60),
  href: hrefSchema,
})
export type Cta = z.infer<typeof ctaSchema>
