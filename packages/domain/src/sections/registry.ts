import { z } from 'zod'
import { ctaSchema, mediaRefSchema, optionalText, text } from '../schemas/common'

/* -------------------------------------------------------------------------- */
/*  Field descriptors: drive the auto-generated editor in the backoffice.      */
/* -------------------------------------------------------------------------- */

export type FieldDescriptor =
  | { kind: 'text'; name: string; label: string; placeholder?: string; help?: string; max?: number }
  | { kind: 'textarea'; name: string; label: string; placeholder?: string; help?: string; rows?: number }
  | { kind: 'richtext'; name: string; label: string; help?: string }
  | { kind: 'boolean'; name: string; label: string; help?: string }
  | { kind: 'number'; name: string; label: string; min?: number; max?: number; help?: string }
  | { kind: 'select'; name: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'href'; name: string; label: string; help?: string }
  | { kind: 'cta'; name: string; label: string; help?: string }
  | { kind: 'items'; name: string; label: string; itemLabel: string; fields: FieldDescriptor[] }
  | { kind: 'images'; name: string; label: string; help?: string }
  | { kind: 'image'; name: string; label: string; help?: string }
  | { kind: 'icon'; name: string; label: string }

/* -------------------------------------------------------------------------- */
/*  Shared style/responsive options                                           */
/* -------------------------------------------------------------------------- */

export const SECTION_BACKGROUNDS = ['canvas', 'surface', 'mist', 'brand'] as const
export const SECTION_SPACING = ['compact', 'normal', 'relaxed'] as const

export const sectionStyleSchema = z.object({
  background: z.enum(SECTION_BACKGROUNDS).default('canvas'),
  spacing: z.enum(SECTION_SPACING).default('normal'),
  align: z.enum(['start', 'center']).default('start'),
})
export type SectionStyle = z.infer<typeof sectionStyleSchema>

export const sectionResponsiveSchema = z.object({
  hideOnMobile: z.boolean().default(false),
  hideOnDesktop: z.boolean().default(false),
})

/* -------------------------------------------------------------------------- */
/*  Section definitions                                                        */
/* -------------------------------------------------------------------------- */

export interface SectionDefinition<
  T extends string,
  V extends readonly [string, ...string[]],
  S extends z.ZodObject,
> {
  type: T
  label: string
  description: string
  /** Lucide icon name used in the builder palette. */
  icon: string
  variants: V
  variantLabels: Record<V[number], string>
  content: S
  fields: FieldDescriptor[]
  /** Only one instance allowed per page. */
  singleton: boolean
  defaultStyle?: Partial<SectionStyle>
}

export function define<T extends string, const V extends readonly [string, ...string[]], S extends z.ZodObject>(
  def: SectionDefinition<T, V, S>,
) {
  return def
}

const titleField = (label = 'Título'): FieldDescriptor => ({ kind: 'text', name: 'title', label })
const introField: FieldDescriptor = { kind: 'textarea', name: 'intro', label: 'Introducción', rows: 2 }

export const heroSection = define({
  type: 'hero',
  label: 'Hero',
  description: 'Presentación principal: foto, nombre, especialidad, claim y CTA.',
  icon: 'sparkles',
  variants: ['classic', 'immersive', 'minimal'],
  variantLabels: { classic: 'Clásico (panel + recorte)', immersive: 'Inmersivo', minimal: 'Minimal' },
  singleton: true,
  content: z.object({
    eyebrow: optionalText(80),
    experienceText: optionalText(60),
    experienceScript: optionalText(60),
    headline: optionalText(160),
    description: optionalText(600),
    ctaLabel: optionalText(40),
    secondaryCta: ctaSchema.optional(),
    showModalities: z.boolean().default(true),
    showSocialLinks: z.boolean().default(true),
    showSpecialties: z.boolean().default(true),
  }),
  fields: [
    { kind: 'text', name: 'eyebrow', label: 'Eyebrow', placeholder: 'Consulta integral' },
    { kind: 'text', name: 'experienceText', label: 'Texto de experiencia', placeholder: 'Más de 14 años' },
    { kind: 'text', name: 'experienceScript', label: 'Experiencia (manuscrita)', placeholder: 'de experiencia' },
    { kind: 'text', name: 'headline', label: 'Claim principal' },
    { kind: 'textarea', name: 'description', label: 'Descripción', rows: 3 },
    { kind: 'text', name: 'ctaLabel', label: 'Texto del CTA (vacío = predeterminado)' },
    { kind: 'cta', name: 'secondaryCta', label: 'CTA secundario (opcional)' },
    { kind: 'boolean', name: 'showModalities', label: 'Mostrar modalidades' },
    { kind: 'boolean', name: 'showSpecialties', label: 'Mostrar especialidades' },
    { kind: 'boolean', name: 'showSocialLinks', label: 'Mostrar redes sociales' },
  ],
})

export const aboutSection = define({
  type: 'about',
  label: 'Sobre mí',
  description: 'Biografía del profesional. Si el cuerpo está vacío usa la biografía del perfil.',
  icon: 'user',
  variants: ['split', 'centered'],
  variantLabels: { split: 'Dividido', centered: 'Centrado' },
  singleton: true,
  content: z.object({ title: optionalText(), body: optionalText(4000) }),
  fields: [titleField(), { kind: 'richtext', name: 'body', label: 'Cuerpo (opcional)' }],
})

export const experienceSection = define({
  type: 'experience',
  label: 'Trayectoria',
  description: 'Hitos de formación y experiencia.',
  icon: 'award',
  variants: ['timeline', 'cards'],
  variantLabels: { timeline: 'Línea de tiempo', cards: 'Tarjetas' },
  singleton: false,
  content: z.object({
    title: optionalText(),
    items: z
      .array(
        z.object({
          id: z.string().min(1).max(40),
          period: optionalText(40),
          title: text(120).min(1),
          description: optionalText(400),
        }),
      )
      .max(20)
      .default([]),
  }),
  fields: [
    titleField(),
    {
      kind: 'items',
      name: 'items',
      label: 'Hitos',
      itemLabel: 'Hito',
      fields: [
        { kind: 'text', name: 'period', label: 'Periodo' },
        { kind: 'text', name: 'title', label: 'Título' },
        { kind: 'textarea', name: 'description', label: 'Descripción', rows: 2 },
      ],
    },
  ],
})

export const specialtiesSection = define({
  type: 'specialties',
  label: 'Especialidades',
  description: 'Áreas de especialidad del profesional.',
  icon: 'brain',
  variants: ['chips', 'grid'],
  variantLabels: { chips: 'Etiquetas', grid: 'Cuadrícula' },
  singleton: true,
  content: z.object({ title: optionalText(), intro: optionalText(400) }),
  fields: [titleField(), introField],
})

export const servicesSection = define({
  type: 'services',
  label: 'Servicios',
  description: 'Servicios que ofrece, con duración y descripción.',
  icon: 'heart-handshake',
  variants: ['cards', 'list'],
  variantLabels: { cards: 'Tarjetas', list: 'Lista' },
  singleton: true,
  content: z.object({ title: optionalText(), intro: optionalText(400) }),
  fields: [titleField(), introField],
})

export const modalitiesSection = define({
  type: 'modalities',
  label: 'Modalidades',
  description: 'Presencial, online, a domicilio… y público objetivo.',
  icon: 'monitor',
  variants: ['icons', 'band'],
  variantLabels: { icons: 'Iconos', band: 'Banda de color' },
  singleton: true,
  content: z.object({ title: optionalText(), showTargetAudience: z.boolean().default(true) }),
  fields: [titleField(), { kind: 'boolean', name: 'showTargetAudience', label: 'Incluir público objetivo' }],
})

export const testimonialCarouselSection = define({
  type: 'testimonialCarousel',
  label: 'Testimonios',
  description: 'Carrusel de testimonios manuales y/o reseñas de Google.',
  icon: 'message-circle',
  variants: ['spotlight', 'stack'],
  variantLabels: { spotlight: 'Destacado', stack: 'Tarjetas apiladas' },
  singleton: true,
  content: z.object({
    title: optionalText(),
    subtitle: optionalText(200),
    showAddReviewLink: z.boolean().default(true),
  }),
  fields: [
    titleField(),
    { kind: 'text', name: 'subtitle', label: 'Subtítulo' },
    { kind: 'boolean', name: 'showAddReviewLink', label: 'Mostrar enlace "dejar reseña"' },
  ],
})

export const socialLinksSection = define({
  type: 'socialLinks',
  label: 'Redes sociales',
  description: 'Enlaces a Instagram, TikTok, sitio web…',
  icon: 'users',
  variants: ['buttons', 'inline'],
  variantLabels: { buttons: 'Botones', inline: 'En línea' },
  singleton: true,
  content: z.object({ title: optionalText() }),
  fields: [titleField()],
})

export const appointmentCtaSection = define({
  type: 'appointmentCTA',
  label: 'Agendar cita',
  description: 'Bloque de conversión con el CTA de agendamiento configurado.',
  icon: 'calendar',
  variants: ['banner', 'card'],
  variantLabels: { banner: 'Banda', card: 'Tarjeta' },
  singleton: false,
  defaultStyle: { background: 'brand' },
  content: z.object({
    title: optionalText(),
    description: optionalText(400),
    buttonLabel: optionalText(40),
  }),
  fields: [
    titleField(),
    { kind: 'textarea', name: 'description', label: 'Descripción', rows: 2 },
    { kind: 'text', name: 'buttonLabel', label: 'Texto del botón (vacío = predeterminado)' },
  ],
})

export const gallerySection = define({
  type: 'gallery',
  label: 'Galería',
  description: 'Imágenes de la consulta, actividades o material.',
  icon: 'image',
  variants: ['masonry', 'strip'],
  variantLabels: { masonry: 'Mosaico', strip: 'Tira deslizable' },
  singleton: false,
  content: z.object({ title: optionalText(), images: z.array(mediaRefSchema).max(24).default([]) }),
  fields: [titleField(), { kind: 'images', name: 'images', label: 'Imágenes' }],
})

export const contactSection = define({
  type: 'contact',
  label: 'Contacto',
  description: 'Email, teléfono y WhatsApp del profesional.',
  icon: 'mail',
  variants: ['cards', 'compact'],
  variantLabels: { cards: 'Tarjetas', compact: 'Compacto' },
  singleton: true,
  content: z.object({
    title: optionalText(),
    showEmail: z.boolean().default(true),
    showPhone: z.boolean().default(true),
    showWhatsapp: z.boolean().default(true),
  }),
  fields: [
    titleField(),
    { kind: 'boolean', name: 'showEmail', label: 'Mostrar email' },
    { kind: 'boolean', name: 'showPhone', label: 'Mostrar teléfono' },
    { kind: 'boolean', name: 'showWhatsapp', label: 'Mostrar WhatsApp' },
  ],
})

export const locationSection = define({
  type: 'location',
  label: 'Ubicación',
  description: 'Dirección de atención y enlace a mapas.',
  icon: 'map-pin',
  variants: ['card'],
  variantLabels: { card: 'Tarjeta' },
  singleton: true,
  content: z.object({ title: optionalText(), note: optionalText(300) }),
  fields: [titleField(), { kind: 'textarea', name: 'note', label: 'Indicaciones', rows: 2 }],
})

export const richTextSection = define({
  type: 'richText',
  label: 'Texto libre',
  description: 'Texto con formato seguro (negrita, cursiva, listas, enlaces).',
  icon: 'type',
  variants: ['prose', 'highlight'],
  variantLabels: { prose: 'Texto', highlight: 'Destacado' },
  singleton: false,
  content: z.object({ title: optionalText(), body: text(6000).default('') }),
  fields: [titleField(), { kind: 'richtext', name: 'body', label: 'Contenido' }],
})

export const professionalSwitcherSection = define({
  type: 'professionalSwitcher',
  label: 'Selector de profesionales',
  description: 'Carrusel de avatares del equipo publicado. Se oculta si hay un solo profesional.',
  icon: 'users',
  variants: ['avatars'],
  variantLabels: { avatars: 'Avatares' },
  singleton: true,
  content: z.object({ title: optionalText() }),
  fields: [titleField()],
})

export const customCtaSection = define({
  type: 'customCTA',
  label: 'CTA personalizado',
  description: 'Llamado a la acción con enlace propio.',
  icon: 'mouse-pointer-click',
  variants: ['banner', 'card'],
  variantLabels: { banner: 'Banda', card: 'Tarjeta' },
  singleton: false,
  content: z.object({
    title: text(120).default(''),
    description: optionalText(400),
    cta: ctaSchema.default({ label: '', href: '' }),
  }),
  fields: [
    titleField(),
    { kind: 'textarea', name: 'description', label: 'Descripción', rows: 2 },
    { kind: 'cta', name: 'cta', label: 'Botón' },
  ],
})

export const sectionRegistry = {
  hero: heroSection,
  about: aboutSection,
  experience: experienceSection,
  specialties: specialtiesSection,
  services: servicesSection,
  modalities: modalitiesSection,
  testimonialCarousel: testimonialCarouselSection,
  socialLinks: socialLinksSection,
  appointmentCTA: appointmentCtaSection,
  gallery: gallerySection,
  contact: contactSection,
  location: locationSection,
  richText: richTextSection,
  professionalSwitcher: professionalSwitcherSection,
  customCTA: customCtaSection,
} as const

export type SectionRegistry = typeof sectionRegistry
export type SectionType = keyof SectionRegistry
export const SECTION_TYPES = Object.keys(sectionRegistry) as SectionType[]

/* -------------------------------------------------------------------------- */
/*  Section instance schema (discriminated union over the registry)            */
/* -------------------------------------------------------------------------- */

export const baseFields = {
  id: z.string().min(1).max(40),
  enabled: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
  style: sectionStyleSchema.default({ background: 'canvas', spacing: 'normal', align: 'start' }),
  responsive: sectionResponsiveSchema.default({ hideOnMobile: false, hideOnDesktop: false }),
}

function instanceSchema<D extends SectionRegistry[SectionType]>(def: D) {
  return z.object({
    ...baseFields,
    type: z.literal(def.type as D['type']),
    variant: z.enum(def.variants as D['variants']).default(def.variants[0] as D['variants'][0]),
    content: def.content as D['content'],
  })
}

export const sectionSchema = z.discriminatedUnion('type', [
  instanceSchema(heroSection),
  instanceSchema(aboutSection),
  instanceSchema(experienceSection),
  instanceSchema(specialtiesSection),
  instanceSchema(servicesSection),
  instanceSchema(modalitiesSection),
  instanceSchema(testimonialCarouselSection),
  instanceSchema(socialLinksSection),
  instanceSchema(appointmentCtaSection),
  instanceSchema(gallerySection),
  instanceSchema(contactSection),
  instanceSchema(locationSection),
  instanceSchema(richTextSection),
  instanceSchema(professionalSwitcherSection),
  instanceSchema(customCtaSection),
])

export type Section = z.infer<typeof sectionSchema>
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>
export type SectionContent<T extends SectionType> = SectionOf<T>['content']

export const sectionsSchema = z
  .array(sectionSchema)
  .max(40)
  .superRefine((sections, ctx) => {
    const ids = new Set<string>()
    const singletons = new Set<string>()
    sections.forEach((section, index) => {
      if (ids.has(section.id)) {
        ctx.addIssue({ code: 'custom', message: 'ID de sección duplicado', path: [index, 'id'] })
      }
      ids.add(section.id)
      if (sectionRegistry[section.type].singleton) {
        if (singletons.has(section.type)) {
          ctx.addIssue({
            code: 'custom',
            message: `Solo se permite una sección "${sectionRegistry[section.type].label}"`,
            path: [index, 'type'],
          })
        }
        singletons.add(section.type)
      }
    })
  })

/** Creates a new section instance with valid defaults. */
export function createSection(type: SectionType, id: string, order = 0): Section {
  const def = sectionRegistry[type]
  return sectionSchema.parse({
    id,
    type,
    order,
    enabled: true,
    variant: def.variants[0],
    content: {},
    style: { background: 'canvas', spacing: 'normal', align: 'start', ...('defaultStyle' in def ? def.defaultStyle : {}) },
  })
}

/** Enabled sections sorted by `order` — what the public renderer iterates. */
export function visibleSections(sections: readonly Section[]): Section[] {
  return sections.filter((s) => s.enabled).toSorted((a, b) => a.order - b.order)
}

/** Re-numbers `order` after drag & drop so it stays dense and stable. */
export function normalizeOrder<T extends { order: number }>(sections: readonly T[]): T[] {
  return sections.map((section, index) => ({ ...section, order: index }))
}

/** Default page composition for a brand new professional. */
export const DEFAULT_SECTION_TYPES: SectionType[] = [
  'hero',
  'testimonialCarousel',
  'professionalSwitcher',
  'about',
  'services',
  'specialties',
  'appointmentCTA',
  'contact',
]
