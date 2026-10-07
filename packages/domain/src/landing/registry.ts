import { z } from 'zod'
import { ctaSchema, iconNameSchema, mediaRefSchema, optionalText, text } from '../schemas/common'
import { baseFields, define, type FieldDescriptor, type SectionStyle } from '../sections/registry'

/*
 * Section registry for the organisation's sales LANDING (home page).
 * Same contract as the professional-page registry: every type declares its
 * own Zod content schema, variants and field descriptors (the backoffice
 * generates the editor from them). No arbitrary code or HTML.
 */

const title = (label = 'Título'): FieldDescriptor => ({ kind: 'text', name: 'title', label })
const kicker: FieldDescriptor = { kind: 'text', name: 'kicker', label: 'Antetítulo manuscrito', placeholder: 'nuestros servicios' }
const intro: FieldDescriptor = { kind: 'textarea', name: 'intro', label: 'Introducción', rows: 2 }
const itemId = z.string().min(1).max(40)

const iconItem = z.object({
  id: itemId,
  icon: iconNameSchema.default('sparkles'),
  title: text(100).min(1, 'Requerido'),
  description: optionalText(400),
})
const iconItemFields: FieldDescriptor[] = [
  { kind: 'icon', name: 'icon', label: 'Icono' },
  { kind: 'text', name: 'title', label: 'Título' },
  { kind: 'textarea', name: 'description', label: 'Descripción', rows: 2 },
]

export const landingHeroSection = define({
  type: 'landingHero',
  label: 'Hero de la landing',
  description: 'Mensaje principal, CTAs y collage del equipo publicado.',
  icon: 'sparkles',
  variants: ['editorial', 'centered'],
  variantLabels: { editorial: 'Editorial (texto + collage del equipo)', centered: 'Centrado' },
  singleton: true,
  content: z.object({
    eyebrow: optionalText(80),
    title: text(140).default('Aprender también puede ser un juego'),
    titleScript: optionalText(60),
    subtitle: optionalText(400),
    primaryCta: ctaSchema.default({ label: '', href: '' }),
    secondaryCta: ctaSchema.default({ label: '', href: '' }),
    image: mediaRefSchema.optional(),
    showTeamCollage: z.boolean().default(true),
    highlights: z.array(z.object({ id: itemId, icon: iconNameSchema.default('sparkles'), label: text(60).min(1) })).max(4).default([]),
  }),
  fields: [
    { kind: 'text', name: 'eyebrow', label: 'Eyebrow', placeholder: 'Consultorio integral' },
    { kind: 'text', name: 'title', label: 'Titular' },
    { kind: 'text', name: 'titleScript', label: 'Acento manuscrito', placeholder: 'con cariño y método' },
    { kind: 'textarea', name: 'subtitle', label: 'Bajada', rows: 3 },
    { kind: 'cta', name: 'primaryCta', label: 'CTA principal' },
    { kind: 'cta', name: 'secondaryCta', label: 'CTA secundario' },
    { kind: 'boolean', name: 'showTeamCollage', label: 'Mostrar collage con los profesionales publicados' },
    { kind: 'image', name: 'image', label: 'Imagen propia (reemplaza el collage)' },
    {
      kind: 'items',
      name: 'highlights',
      label: 'Destacados',
      itemLabel: 'Destacado',
      fields: [
        { kind: 'icon', name: 'icon', label: 'Icono' },
        { kind: 'text', name: 'label', label: 'Texto' },
      ],
    },
  ],
})

export const statsSection = define({
  type: 'stats',
  label: 'Cifras',
  description: 'Cifras verificables. {equipo} se reemplaza por el número de profesionales publicados.',
  icon: 'activity',
  variants: ['band', 'cards'],
  variantLabels: { band: 'Banda de color', cards: 'Tarjetas' },
  singleton: false,
  content: z.object({
    title: optionalText(),
    items: z.array(z.object({ id: itemId, value: text(20).min(1), label: text(80).min(1), note: optionalText(120) })).max(6).default([]),
  }),
  fields: [
    title(),
    {
      kind: 'items',
      name: 'items',
      label: 'Cifras',
      itemLabel: 'Cifra',
      fields: [
        { kind: 'text', name: 'value', label: 'Valor', placeholder: '+14 · {equipo}', help: 'Usa solo datos reales y verificables.' },
        { kind: 'text', name: 'label', label: 'Etiqueta' },
        { kind: 'text', name: 'note', label: 'Nota (opcional)' },
      ],
    },
  ],
})

export const painPointsSection = define({
  type: 'painPoints',
  label: '¿Te suena familiar?',
  description: 'Situaciones con las que tu público se identifica.',
  icon: 'message-circle',
  variants: ['cards', 'list'],
  variantLabels: { cards: 'Tarjetas', list: 'Lista' },
  singleton: false,
  content: z.object({ kicker: optionalText(60), title: optionalText(), intro: optionalText(400), items: z.array(iconItem).max(9).default([]) }),
  fields: [kicker, title(), intro, { kind: 'items', name: 'items', label: 'Situaciones', itemLabel: 'Situación', fields: iconItemFields }],
})

export const servicesOverviewSection = define({
  type: 'servicesOverview',
  label: 'Servicios',
  description: 'Oferta de servicios de la organización.',
  icon: 'heart-handshake',
  variants: ['bento', 'grid'],
  variantLabels: { bento: 'Bento (destaca el primero)', grid: 'Cuadrícula' },
  singleton: false,
  content: z.object({
    kicker: optionalText(60),
    title: optionalText(),
    intro: optionalText(400),
    items: z
      .array(iconItem.extend({ tag: optionalText(40), href: z.string().trim().max(300).default('') }))
      .max(12)
      .default([]),
    cta: ctaSchema.default({ label: '', href: '' }),
  }),
  fields: [
    kicker,
    title(),
    intro,
    {
      kind: 'items',
      name: 'items',
      label: 'Servicios',
      itemLabel: 'Servicio',
      fields: [...iconItemFields, { kind: 'text', name: 'tag', label: 'Etiqueta', placeholder: 'Presencial y online' }, { kind: 'href', name: 'href', label: 'Enlace (opcional)' }],
    },
    { kind: 'cta', name: 'cta', label: 'Botón al final (opcional)' },
  ],
})

export const processSection = define({
  type: 'process',
  label: 'Cómo trabajamos',
  description: 'Pasos del proceso, de la primera consulta al seguimiento.',
  icon: 'calendar',
  variants: ['steps', 'timeline'],
  variantLabels: { steps: 'Pasos horizontales', timeline: 'Línea vertical' },
  singleton: false,
  content: z.object({
    kicker: optionalText(60),
    title: optionalText(),
    intro: optionalText(400),
    items: z.array(z.object({ id: itemId, title: text(100).min(1), description: optionalText(400) })).max(8).default([]),
  }),
  fields: [
    kicker,
    title(),
    intro,
    {
      kind: 'items',
      name: 'items',
      label: 'Pasos',
      itemLabel: 'Paso',
      fields: [
        { kind: 'text', name: 'title', label: 'Título' },
        { kind: 'textarea', name: 'description', label: 'Descripción', rows: 2 },
      ],
    },
  ],
})

export const teamShowcaseSection = define({
  type: 'teamShowcase',
  label: 'Equipo (profesionales)',
  description: 'Muestra automáticamente los profesionales publicados y enlaza a sus perfiles y a /equipo.',
  icon: 'users',
  variants: ['rail', 'grid'],
  variantLabels: { rail: 'Carrusel', grid: 'Cuadrícula' },
  singleton: true,
  content: z.object({
    kicker: optionalText(60),
    title: optionalText(),
    intro: optionalText(400),
    maxProfessionals: z.number().int().min(1).max(24).default(8),
    ctaLabel: optionalText(40),
  }),
  fields: [
    kicker,
    title(),
    intro,
    { kind: 'number', name: 'maxProfessionals', label: 'Máximo de profesionales', min: 1, max: 24 },
    { kind: 'text', name: 'ctaLabel', label: 'Texto del enlace a /equipo', placeholder: 'Conoce a todo el equipo' },
  ],
})

export const testimonialsWallSection = define({
  type: 'testimonialsWall',
  label: 'Testimonios',
  description: 'Testimonios manuales habilitados de toda la organización.',
  icon: 'message-circle',
  variants: ['wall', 'marquee'],
  variantLabels: { wall: 'Muro (mosaico)', marquee: 'Cinta en movimiento' },
  singleton: true,
  content: z.object({
    kicker: optionalText(60),
    title: optionalText(),
    subtitle: optionalText(300),
    maxItems: z.number().int().min(2).max(24).default(9),
    addReviewUrl: z.string().trim().max(500).default(''),
  }),
  fields: [
    kicker,
    title(),
    { kind: 'textarea', name: 'subtitle', label: 'Subtítulo', rows: 2 },
    { kind: 'number', name: 'maxItems', label: 'Máximo de testimonios', min: 2, max: 24 },
    { kind: 'href', name: 'addReviewUrl', label: 'Enlace "Dejar una reseña" (opcional)' },
  ],
})

export const plansSection = define({
  type: 'plans',
  label: 'Planes / programas',
  description: 'Programas o modalidades de atención. El precio es opcional.',
  icon: 'award',
  variants: ['cards'],
  variantLabels: { cards: 'Tarjetas' },
  singleton: false,
  content: z.object({
    kicker: optionalText(60),
    title: optionalText(),
    intro: optionalText(400),
    items: z
      .array(
        z.object({
          id: itemId,
          name: text(80).min(1),
          price: optionalText(40),
          period: optionalText(40),
          description: optionalText(300),
          features: optionalText(1200),
          highlighted: z.boolean().default(false),
          cta: ctaSchema.default({ label: '', href: '' }),
        }),
      )
      .max(4)
      .default([]),
    note: optionalText(300),
  }),
  fields: [
    kicker,
    title(),
    intro,
    {
      kind: 'items',
      name: 'items',
      label: 'Planes',
      itemLabel: 'Plan',
      fields: [
        { kind: 'text', name: 'name', label: 'Nombre' },
        { kind: 'text', name: 'price', label: 'Precio (opcional)', placeholder: 'Consultar' },
        { kind: 'text', name: 'period', label: 'Periodo', placeholder: 'por sesión' },
        { kind: 'textarea', name: 'description', label: 'Descripción', rows: 2 },
        { kind: 'textarea', name: 'features', label: 'Incluye (una línea por ítem)', rows: 4 },
        { kind: 'boolean', name: 'highlighted', label: 'Destacar' },
        { kind: 'cta', name: 'cta', label: 'Botón' },
      ],
    },
    { kind: 'textarea', name: 'note', label: 'Nota al pie', rows: 2 },
  ],
})

export const valuesSection = define({
  type: 'values',
  label: 'Compromiso ético',
  description: 'Principios y garantías (confidencialidad, evidencia, cercanía…).',
  icon: 'shield-check',
  variants: ['grid', 'split'],
  variantLabels: { grid: 'Cuadrícula', split: 'Dividido' },
  singleton: false,
  defaultStyle: { background: 'mist' },
  content: z.object({ kicker: optionalText(60), title: optionalText(), intro: optionalText(400), items: z.array(iconItem).max(8).default([]) }),
  fields: [kicker, title(), intro, { kind: 'items', name: 'items', label: 'Principios', itemLabel: 'Principio', fields: iconItemFields }],
})

export const faqSection = define({
  type: 'faq',
  label: 'Preguntas frecuentes',
  description: 'Acordeón accesible de preguntas y respuestas.',
  icon: 'message-circle',
  variants: ['accordion'],
  variantLabels: { accordion: 'Acordeón' },
  singleton: false,
  content: z.object({
    kicker: optionalText(60),
    title: optionalText(),
    items: z.array(z.object({ id: itemId, question: text(200).min(1), answer: text(2000).min(1) })).max(20).default([]),
  }),
  fields: [
    kicker,
    title(),
    {
      kind: 'items',
      name: 'items',
      label: 'Preguntas',
      itemLabel: 'Pregunta',
      fields: [
        { kind: 'text', name: 'question', label: 'Pregunta' },
        { kind: 'richtext', name: 'answer', label: 'Respuesta' },
      ],
    },
  ],
})

export const logosSection = define({
  type: 'logos',
  label: 'Convenios / colegios',
  description: 'Logos de instituciones con las que trabajan.',
  icon: 'school',
  variants: ['row'],
  variantLabels: { row: 'Fila' },
  singleton: false,
  content: z.object({
    title: optionalText(),
    items: z.array(z.object({ id: itemId, name: text(80).min(1), image: mediaRefSchema.optional(), href: z.string().trim().max(300).default('') })).max(16).default([]),
  }),
  fields: [
    title(),
    {
      kind: 'items',
      name: 'items',
      label: 'Instituciones',
      itemLabel: 'Institución',
      fields: [
        { kind: 'text', name: 'name', label: 'Nombre' },
        { kind: 'image', name: 'image', label: 'Logo' },
        { kind: 'href', name: 'href', label: 'Enlace (opcional)' },
      ],
    },
  ],
})

export const ctaBannerSection = define({
  type: 'ctaBanner',
  label: 'Llamado a la acción',
  description: 'Banda de conversión con uno o dos botones.',
  icon: 'calendar',
  variants: ['panel', 'split'],
  variantLabels: { panel: 'Panel', split: 'Dividido' },
  singleton: false,
  defaultStyle: { background: 'canvas' },
  content: z.object({
    script: optionalText(60),
    title: optionalText(),
    description: optionalText(400),
    primaryCta: ctaSchema.default({ label: '', href: '' }),
    secondaryCta: ctaSchema.default({ label: '', href: '' }),
  }),
  fields: [
    { kind: 'text', name: 'script', label: 'Acento manuscrito' },
    title(),
    { kind: 'textarea', name: 'description', label: 'Descripción', rows: 2 },
    { kind: 'cta', name: 'primaryCta', label: 'Botón principal' },
    { kind: 'cta', name: 'secondaryCta', label: 'Botón secundario' },
  ],
})

export const contactBlockSection = define({
  type: 'contactBlock',
  label: 'Contacto',
  description: 'Datos de contacto de la organización (Configuración → Organización).',
  icon: 'map-pin',
  variants: ['split'],
  variantLabels: { split: 'Dividido' },
  singleton: true,
  content: z.object({
    kicker: optionalText(60),
    title: optionalText(),
    intro: optionalText(400),
    whatsappMessage: optionalText(300),
  }),
  fields: [kicker, title(), intro, { kind: 'textarea', name: 'whatsappMessage', label: 'Mensaje prellenado de WhatsApp', rows: 2 }],
})

export const landingRichTextSection = define({
  type: 'landingRichText',
  label: 'Texto libre',
  description: 'Texto con formato seguro.',
  icon: 'type',
  variants: ['prose', 'highlight'],
  variantLabels: { prose: 'Texto', highlight: 'Destacado' },
  singleton: false,
  content: z.object({ title: optionalText(), body: text(6000).default('') }),
  fields: [title(), { kind: 'richtext', name: 'body', label: 'Contenido' }],
})

export const landingGallerySection = define({
  type: 'landingGallery',
  label: 'Galería',
  description: 'Imágenes de la consulta y actividades.',
  icon: 'image',
  variants: ['masonry', 'strip'],
  variantLabels: { masonry: 'Mosaico', strip: 'Tira deslizable' },
  singleton: false,
  content: z.object({ title: optionalText(), images: z.array(mediaRefSchema).max(24).default([]) }),
  fields: [title(), { kind: 'images', name: 'images', label: 'Imágenes' }],
})

export const landingSectionRegistry = {
  landingHero: landingHeroSection,
  stats: statsSection,
  painPoints: painPointsSection,
  servicesOverview: servicesOverviewSection,
  process: processSection,
  teamShowcase: teamShowcaseSection,
  testimonialsWall: testimonialsWallSection,
  plans: plansSection,
  values: valuesSection,
  faq: faqSection,
  logos: logosSection,
  ctaBanner: ctaBannerSection,
  contactBlock: contactBlockSection,
  landingRichText: landingRichTextSection,
  landingGallery: landingGallerySection,
} as const

export type LandingSectionRegistry = typeof landingSectionRegistry
export type LandingSectionType = keyof LandingSectionRegistry
export const LANDING_SECTION_TYPES = Object.keys(landingSectionRegistry) as LandingSectionType[]

function instance<D extends LandingSectionRegistry[LandingSectionType]>(def: D) {
  return z.object({
    ...baseFields,
    type: z.literal(def.type as D['type']),
    variant: z.enum(def.variants as D['variants']).default(def.variants[0] as D['variants'][0]),
    content: def.content as D['content'],
  })
}

export const landingSectionSchema = z.discriminatedUnion('type', [
  instance(landingHeroSection),
  instance(statsSection),
  instance(painPointsSection),
  instance(servicesOverviewSection),
  instance(processSection),
  instance(teamShowcaseSection),
  instance(testimonialsWallSection),
  instance(plansSection),
  instance(valuesSection),
  instance(faqSection),
  instance(logosSection),
  instance(ctaBannerSection),
  instance(contactBlockSection),
  instance(landingRichTextSection),
  instance(landingGallerySection),
])

export type LandingSection = z.infer<typeof landingSectionSchema>
export type LandingSectionOf<T extends LandingSectionType> = Extract<LandingSection, { type: T }>

export const landingSectionsSchema = z
  .array(landingSectionSchema)
  .max(40)
  .superRefine((sections, ctx) => {
    const ids = new Set<string>()
    const singletons = new Set<string>()
    sections.forEach((section, index) => {
      if (ids.has(section.id)) ctx.addIssue({ code: 'custom', message: 'ID de sección duplicado', path: [index, 'id'] })
      ids.add(section.id)
      if (landingSectionRegistry[section.type].singleton) {
        if (singletons.has(section.type)) {
          ctx.addIssue({ code: 'custom', message: `Solo se permite una sección "${landingSectionRegistry[section.type].label}"`, path: [index, 'type'] })
        }
        singletons.add(section.type)
      }
    })
  })

export function createLandingSection(type: LandingSectionType, id: string, order = 0): LandingSection {
  const def = landingSectionRegistry[type] as LandingSectionRegistry[LandingSectionType] & { defaultStyle?: Partial<SectionStyle> }
  return landingSectionSchema.parse({
    id,
    type,
    order,
    enabled: true,
    variant: def.variants[0],
    content: {},
    style: { background: 'canvas', spacing: 'normal', align: 'start', ...(def.defaultStyle ?? {}) },
  })
}

/* -------------------------------------------------------------------------- */
/*  Home page document                                                        */
/* -------------------------------------------------------------------------- */

export const homePageInputSchema = z.object({
  sections: landingSectionsSchema.default([]),
  seo: z
    .object({
      title: optionalText(70),
      description: optionalText(170),
      ogImage: mediaRefSchema.optional(),
    })
    .default({ title: '', description: '' }),
})
export type HomePageInput = z.infer<typeof homePageInputSchema>

/** Published, immutable representation consumed by the public site. */
export interface PublicHomePage extends HomePageInput {
  revision: number
  publishedAt: string
}

export interface HomePageDocument extends HomePageInput {
  revision: number
  publishedRevision: number | null
  updatedAt: Date
  publishedAt: Date | null
  updatedBy?: string
}

/** Replaces `{equipo}` with the number of published professionals (verifiable figure). */
export function fillStatValue(value: string, ctx: { professionals: number }): string {
  return value.replace(/\{equipo\}/g, String(ctx.professionals))
}

export const DEFAULT_LANDING_SECTION_TYPES: LandingSectionType[] = [
  'landingHero',
  'stats',
  'painPoints',
  'servicesOverview',
  'process',
  'teamShowcase',
  'testimonialsWall',
  'values',
  'plans',
  'faq',
  'ctaBanner',
  'contactBlock',
]
