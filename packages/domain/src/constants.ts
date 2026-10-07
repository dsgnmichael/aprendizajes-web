/**
 * Slugs that can never be used by a professional because they collide with
 * system routes of the public app (or are likely to in the future).
 */
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'login',
  'logout',
  'auth',
  'preview',
  'media',
  'demo',
  'brand',
  'static',
  'assets',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'manifest.webmanifest',
  'opengraph-image',
  'twitter-image',
  'icon',
  'apple-icon',
  'equipo',
  'directorio',
  'contacto',
  'servicios',
  'privacidad',
  'terminos',
  'health',
  'not-found',
])

export const PROFESSIONAL_STATUSES = ['draft', 'published', 'archived'] as const
export type ProfessionalStatus = (typeof PROFESSIONAL_STATUSES)[number]

export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] as const
export type Role = (typeof ROLES)[number]

export const APPOINTMENT_STATUSES = [
  'new',
  'contacted',
  'scheduled',
  'completed',
  'cancelled',
] as const
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

export const APPOINTMENT_MODES = ['INTERNAL_FORM', 'EXTERNAL_URL', 'WHATSAPP'] as const
export type AppointmentMode = (typeof APPOINTMENT_MODES)[number]

export const TESTIMONIAL_SOURCES = [
  'MANUAL',
  'GOOGLE_PLACES',
  'GOOGLE_BUSINESS_PROFILE',
  'MIXED',
] as const
export type TestimonialSourceSetting = (typeof TESTIMONIAL_SOURCES)[number]

/** Origin of a single, normalized testimonial. */
export const TESTIMONIAL_ORIGINS = ['manual', 'google_places', 'google_business_profile'] as const
export type TestimonialOrigin = (typeof TESTIMONIAL_ORIGINS)[number]

export const ROOT_MODES = ['LANDING', 'DIRECTORY', 'DEFAULT_PROFESSIONAL'] as const
export type RootMode = (typeof ROOT_MODES)[number]

/**
 * Whitelisted icon names. The public app maps each one to a tree-shaken
 * Lucide component, so the CMS can never request arbitrary components.
 */
export const ICON_NAMES = [
  'user',
  'users',
  'baby',
  'graduation-cap',
  'brain',
  'puzzle',
  'book-open',
  'heart-handshake',
  'monitor',
  'video',
  'map-pin',
  'home',
  'calendar',
  'clock',
  'message-circle',
  'sparkles',
  'school',
  'smile',
  'hand-heart',
  'stethoscope',
  'pencil',
  'languages',
  'activity',
  'shield-check',
  'star',
  'award',
] as const
export type IconName = (typeof ICON_NAMES)[number]

export const ICON_LABELS: Record<IconName, string> = {
  user: 'Persona',
  users: 'Grupo',
  baby: 'Infancia',
  'graduation-cap': 'Educación',
  brain: 'Cognición',
  puzzle: 'Aprendizaje',
  'book-open': 'Lectura',
  'heart-handshake': 'Acompañamiento',
  monitor: 'Online',
  video: 'Videollamada',
  'map-pin': 'Presencial',
  home: 'Domicilio',
  calendar: 'Agenda',
  clock: 'Horario',
  'message-circle': 'Conversación',
  sparkles: 'Destacado',
  school: 'Colegio',
  smile: 'Bienestar',
  'hand-heart': 'Cuidado',
  stethoscope: 'Salud',
  pencil: 'Escritura',
  languages: 'Lenguaje',
  activity: 'Actividad',
  'shield-check': 'Confianza',
  star: 'Estrella',
  award: 'Certificación',
}

export const COLLECTIONS = {
  users: 'users',
  professionals: 'professionals',
  homePage: 'homePage',
  publishedProfiles: 'publishedProfiles',
  profileRevisions: 'profileRevisions',
  testimonials: 'testimonials',
  externalReviews: 'externalReviews',
  appointmentRequests: 'appointmentRequests',
  siteSettings: 'siteSettings',
  integrations: 'integrations',
  media: 'media',
  auditLogs: 'auditLogs',
  rateLimits: 'rateLimits',
} as const

/** Cache tags shared by the admin (invalidator) and the public app (consumer). */
export const CACHE_TAGS = {
  site: 'site',
  directory: 'directory',
  landing: 'landing',
  profile: (slug: string) => `profile:${slug}`,
  testimonials: (professionalId: string) => `testimonials:${professionalId}`,
} as const

export const MEDIA_LIMITS = {
  maxBytes: 8 * 1024 * 1024,
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'] as const,
  extensions: ['png', 'jpg', 'jpeg', 'webp', 'avif'] as const,
} as const
