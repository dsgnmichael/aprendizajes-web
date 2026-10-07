/**
 * Seeds a working demo: site settings, bootstrap super admin (from env),
 * five DEMO professionals (published) and DEMO manual testimonials.
 *
 *   pnpm db:seed            # idempotent: creates what is missing
 *   pnpm db:seed --reset    # removes demo professionals/testimonials first
 *
 * Everything created here is flagged `isDemo: true` and shows a DEMO badge in
 * the backoffice, so it is easy to find and replace. No Google reviews are
 * fabricated: testimonials are MANUAL demo content.
 */
import { hashPassword } from '@repo/auth/password'
import { env } from '@repo/config'
import {
  createProfessional,
  createTestimonial,
  getProfessionalById,
  getHomePageDraft,
  getSiteSettings,
  publishHomePage,
  publishProfessional,
  saveHomePageDraft,
  saveSiteSettings,
  SYSTEM_ACTOR,
  upsertBootstrapAdmin,
  upsertStaticMedia,
} from '@repo/data-access'
import { closeMongo, collections, ensureIndexes } from '@repo/database'
import { exampleLanding } from './seed-landing'
import {
  createSection,
  defaultSiteSettings,
  professionalInputSchema,
  shortId,
  type MediaRef,
  type ProfessionalInput,
  type Section,
  type SiteSettings,
} from '@repo/domain'

const reset = process.argv.includes('--reset')

const img = (url: string, width: number, height: number, alt: string, hasAlpha = true): MediaRef => ({
  url,
  width,
  height,
  alt,
  focalX: 50,
  focalY: 25,
  hasAlpha,
})

function sections(overrides: Partial<Record<Section['type'], Record<string, unknown>>>, types: Section['type'][]): Section[] {
  return types.map((type, order) => {
    const base = createSection(type, shortId('s'), order)
    const content = overrides[type]
    return content ? ({ ...base, content: { ...base.content, ...content } } as Section) : base
  })
}

const PAGE: Section['type'][] = [
  'hero',
  'testimonialCarousel',
  'professionalSwitcher',
  'about',
  'services',
  'specialties',
  'experience',
  'appointmentCTA',
  'contact',
]

const modalities = [
  { id: 'm1', label: 'Presencial', icon: 'map-pin' as const },
  { id: 'm2', label: 'Online', icon: 'monitor' as const },
]

interface DemoSeed {
  input: Partial<ProfessionalInput> & Pick<ProfessionalInput, 'name' | 'slug' | 'professionalTitle'>
  hero: [string, number, number]
  testimonials: { authorName: string; authorDetail: string; content: string; rating: number; featured?: boolean }[]
}

const demos: DemoSeed[] = [
  {
    hero: ['/demo/hero/jessica-de-sousa.png', 702, 1089],
    input: {
      name: 'Jessica de Sousa',
      slug: 'jessica-de-sousa',
      professionalTitle: 'Psicopedagoga',
      scriptTitle: 'psicopedagoga',
      yearsOfExperience: 14,
      credentials: ['Licenciada en Educación (DEMO)', 'Postítulo en Dificultades del Aprendizaje (DEMO)'],
      shortDescription:
        'Descubriendo que aprender no tiene por qué ser sinónimo de tristeza, sino de juego y descubrimiento.',
      biography:
        'Acompaño a niños, niñas y adolescentes a reencontrarse con el gusto por aprender.\n\nTrabajo con **evaluación psicopedagógica**, planes de intervención personalizados y un vínculo cercano con la familia y el colegio. *Contenido DEMO: reemplázalo desde el backoffice.*',
      specialties: [
        { id: 'sp1', label: 'Dificultades del aprendizaje', icon: 'puzzle' },
        { id: 'sp2', label: 'Lectoescritura', icon: 'book-open' },
        { id: 'sp3', label: 'Funciones ejecutivas', icon: 'brain' },
        { id: 'sp4', label: 'Hábitos de estudio', icon: 'graduation-cap' },
      ],
      targetAudience: [{ id: 'ta1', label: 'Niños y adolescentes', icon: 'users' }],
      modalities: [
        { id: 'm0', label: 'Dificultad del aprendizaje', icon: 'puzzle' },
        { id: 'm1', label: 'Presencial', icon: 'map-pin' },
        { id: 'm2', label: 'Online', icon: 'monitor' },
      ],
      services: [
        { id: 'sv1', name: 'Evaluación psicopedagógica', description: 'Diagnóstico integral con informe y devolución a la familia.', duration: '3 sesiones', icon: 'pencil' },
        { id: 'sv2', name: 'Intervención individual', description: 'Plan personalizado con objetivos medibles y seguimiento.', duration: '45 min', icon: 'heart-handshake' },
        { id: 'sv3', name: 'Orientación a familias', description: 'Herramientas concretas para acompañar en casa.', duration: '60 min', icon: 'users' },
      ],
      social: { instagram: 'https://www.instagram.com/aprendizajess', tiktok: '', facebook: '', linkedin: '', youtube: '', website: '' },
      appointment: {
        mode: 'INTERNAL_FORM',
        buttonLabel: '',
        externalUrl: '',
        whatsappNumber: '',
        whatsappMessage: '',
        formTitle: 'Agenda una primera conversación',
        formIntro: 'Cuéntame un poco y te contacto para coordinar el mejor horario.',
        successMessage: '',
        fields: { lastName: true, phone: true, modality: true, service: true, preferredDate: true, preferredTime: true, message: true },
        consentText: '',
      },
      sections: sections(
        {
          hero: {
            eyebrow: 'Consulta integral',
            experienceText: 'Más de 14 años',
            experienceScript: 'de experiencia',
            headline: 'Aprender también puede ser un juego.',
            description:
              'Descubriendo que aprender no tiene por qué ser sinónimo de tristeza, sino de juego y descubrimiento.',
          },
          experience: {
            items: [
              { id: 'e1', period: '2010', title: 'Inicio de la práctica clínica (DEMO)', description: '' },
              { id: 'e2', period: '2016', title: 'Especialización en funciones ejecutivas (DEMO)', description: '' },
              { id: 'e3', period: 'Hoy', title: 'Consulta integral Aprendizajess', description: '' },
            ],
          },
        },
        PAGE,
      ),
    },
    testimonials: [
      { authorName: 'Familia M. (demo)', authorDetail: 'Mamá de Tomás, 9 años', content: 'Lo mejor que le pudo pasar a mis hijos fue esta experiencia. Volvieron a disfrutar las tareas y ganaron mucha confianza. 100% recomendado.', rating: 5, featured: true },
      { authorName: 'Carolina R. (demo)', authorDetail: 'Apoderada', content: 'Muy profesional y cercana. Nos dio herramientas concretas para acompañar en casa y coordinó todo con el colegio.', rating: 5 },
      { authorName: 'Andrés P. (demo)', authorDetail: 'Papá de Sofía', content: 'En pocos meses notamos un cambio enorme en la lectura de nuestra hija. Las sesiones le encantan; las espera toda la semana. Gracias por la paciencia, por las explicaciones claras en cada devolución y por hacernos parte del proceso desde el primer día.', rating: 5 },
    ],
  },
  {
    hero: ['/demo/hero/karen-lamadri.png', 683, 1092],
    input: {
      name: 'Karen Lamadri',
      slug: 'karen-lamadri',
      professionalTitle: 'Psicóloga infanto-juvenil (DEMO)',
      scriptTitle: 'psicóloga',
      yearsOfExperience: 10,
      shortDescription: 'Espacios seguros para que niños y adolescentes pongan en palabras lo que sienten.',
      biography: 'Perfil DEMO. Reemplaza esta biografía desde el backoffice.',
      specialties: [
        { id: 'sp1', label: 'Ansiedad infantil', icon: 'smile' },
        { id: 'sp2', label: 'Regulación emocional', icon: 'heart-handshake' },
      ],
      modalities: [{ id: 'm0', label: 'Niños y adolescentes', icon: 'users' }, ...modalities],
      services: [{ id: 'sv1', name: 'Psicoterapia individual', description: 'Sesiones semanales con enfoque lúdico.', duration: '50 min', icon: 'message-circle' }],
      appointment: {
        mode: 'WHATSAPP',
        buttonLabel: 'Escribir por WhatsApp',
        externalUrl: '',
        whatsappNumber: '+56 9 0000 0000',
        whatsappMessage: 'Hola {name}, me gustaría agendar una hora (mensaje DEMO).',
        formTitle: '',
        formIntro: '',
        successMessage: '',
        fields: { lastName: true, phone: true, modality: true, service: true, preferredDate: true, preferredTime: true, message: true },
        consentText: '',
      },
      sections: sections(
        {
          hero: {
            experienceText: '10 años',
            experienceScript: 'acompañando',
            headline: 'Sentir, nombrar, crecer.',
            description: 'Terapia con enfoque lúdico para niños, niñas y adolescentes. (Contenido DEMO)',
          },
        },
        PAGE.filter((t) => t !== 'experience'),
      ),
    },
    testimonials: [
      { authorName: 'Valentina S. (demo)', authorDetail: 'Apoderada', content: 'Mi hijo se sintió escuchado desde la primera sesión. Un trabajo cálido y muy profesional.', rating: 5 },
    ],
  },
  {
    hero: ['/demo/hero/mayerlin-hurtado.png', 694, 1092],
    input: {
      name: 'Mayerlin Hurtado',
      slug: 'mayerlin-hurtado',
      professionalTitle: 'Fonoaudióloga (DEMO)',
      scriptTitle: 'fonoaudióloga',
      yearsOfExperience: 8,
      shortDescription: 'Lenguaje, comunicación y lectoescritura con juego y método.',
      biography: 'Perfil DEMO. Reemplaza esta biografía desde el backoffice.',
      specialties: [
        { id: 'sp1', label: 'Trastornos del lenguaje', icon: 'languages' },
        { id: 'sp2', label: 'Conciencia fonológica', icon: 'book-open' },
      ],
      modalities: [{ id: 'm0', label: 'Primera infancia', icon: 'baby' }, ...modalities],
      services: [{ id: 'sv1', name: 'Evaluación fonoaudiológica', description: 'Evaluación estandarizada y plan de trabajo.', duration: '60 min', icon: 'languages' }],
      appointment: {
        mode: 'EXTERNAL_URL',
        buttonLabel: 'Reservar online',
        externalUrl: 'https://calendly.com/',
        whatsappNumber: '',
        whatsappMessage: '',
        formTitle: '',
        formIntro: '',
        successMessage: '',
        fields: { lastName: true, phone: true, modality: true, service: true, preferredDate: true, preferredTime: true, message: true },
        consentText: '',
      },
      sections: sections(
        { hero: { experienceText: '8 años', experienceScript: 'de experiencia', headline: 'Cada palabra cuenta.', description: 'Estimulación del lenguaje con juego y método. (Contenido DEMO)' } },
        PAGE.filter((t) => t !== 'experience'),
      ),
    },
    testimonials: [],
  },
  {
    hero: ['/demo/hero/michael-perez.png', 721, 1089],
    input: {
      name: 'Michael Pérez',
      slug: 'michael-perez',
      professionalTitle: 'Terapeuta ocupacional (DEMO)',
      scriptTitle: 'terapeuta ocupacional',
      yearsOfExperience: 6,
      shortDescription: 'Autonomía, integración sensorial y motricidad para el día a día.',
      biography: 'Perfil DEMO. Reemplaza esta biografía desde el backoffice.',
      specialties: [
        { id: 'sp1', label: 'Integración sensorial', icon: 'activity' },
        { id: 'sp2', label: 'Motricidad fina', icon: 'pencil' },
      ],
      modalities,
      services: [{ id: 'sv1', name: 'Terapia ocupacional', description: 'Intervención individual con foco en autonomía.', duration: '45 min', icon: 'activity' }],
      sections: sections(
        { hero: { experienceText: '6 años', experienceScript: 'de experiencia', headline: 'Más autonomía, más confianza.', description: 'Terapia ocupacional pediátrica. (Contenido DEMO)' } },
        PAGE.filter((t) => t !== 'experience'),
      ),
    },
    testimonials: [],
  },
  {
    hero: ['/demo/hero/stella-sojo.png', 652, 1099],
    input: {
      name: 'Stella Sojo',
      slug: 'stella-sojo',
      professionalTitle: 'Profesora de tareas dirigidas (DEMO)',
      scriptTitle: 'tareas dirigidas',
      yearsOfExperience: 12,
      shortDescription: 'Rutinas de estudio que funcionan, sin peleas en casa.',
      biography: 'Perfil DEMO. Reemplaza esta biografía desde el backoffice.',
      specialties: [
        { id: 'sp1', label: 'Hábitos de estudio', icon: 'graduation-cap' },
        { id: 'sp2', label: 'Matemáticas', icon: 'puzzle' },
      ],
      modalities: [{ id: 'm0', label: 'Escolares', icon: 'school' }, ...modalities],
      services: [{ id: 'sv1', name: 'Tareas dirigidas', description: 'Acompañamiento escolar en grupos pequeños.', duration: '90 min', icon: 'school' }],
      sections: sections(
        { hero: { experienceText: '12 años', experienceScript: 'enseñando', headline: 'Estudiar con calma también se aprende.', description: 'Acompañamiento escolar personalizado. (Contenido DEMO)' } },
        PAGE.filter((t) => t !== 'experience'),
      ),
    },
    testimonials: [],
  },
]

function siteSettings(): SiteSettings {
  return {
    ...defaultSiteSettings,
    organizationName: 'Aprendizajess',
    tagline: 'Consultorio integral de aprendizaje',
    logo: img('/brand/logo.png', 761, 436, 'Aprendizajess'),
    favicon: img('/brand/logo.png', 761, 436, 'Aprendizajess'),
    navigation: {
      enabled: true,
      items: [
        { id: 'n1', label: 'Inicio', href: '/', enabled: true },
        { id: 'n2', label: 'Servicios', href: '/#servicios', enabled: true },
        { id: 'n3', label: 'Equipo', href: '/equipo', enabled: true },
        { id: 'n4', label: 'Contacto', href: '/#contacto', enabled: true },
      ],
    },
    footer: { text: 'Consultorio integral: psicopedagogía, psicología, terapia ocupacional, lenguaje y tareas dirigidas.', showSocial: true, links: [] },
    social: { ...defaultSiteSettings.social, instagram: 'https://www.instagram.com/aprendizajess' },
    seo: {
      ...defaultSiteSettings.seo,
      defaultTitle: 'Aprendizajess · Consultorio integral',
      description: 'Profesionales en psicopedagogía, psicología, lenguaje y terapia ocupacional.',
    },
    copy: { ...defaultSiteSettings.copy, directoryIntro: 'Un equipo que acompaña el aprendizaje con cercanía, juego y método.' },
    root: { mode: 'LANDING', defaultProfessionalSlug: 'jessica-de-sousa', renderInPlace: true },
    organization: { ...defaultSiteSettings.organization, ...DEMO_ORGANIZATION },
  }
}

/** Contact details shown on the landing. DEMO values: replace in the backoffice. */
const DEMO_ORGANIZATION = {
  email: 'contacto@ejemplo.cl',
  whatsapp: '+56 9 0000 0000',
  city: 'Santiago, Chile',
  hours: 'Lunes a viernes, 9:00 a 19:00 (DEMO)',
}

async function main() {
  const e = env()
  if (!e.MONGODB_URI) throw new Error('MONGODB_URI is required. Start a local DB with `pnpm db:local` or use Atlas.')
  const c = await collections()
  await ensureIndexes(c)

  if (reset) {
    const demoIds = (await c.professionals.find({ isDemo: true }, { projection: { _id: 1 } }).toArray()).map((d) => d._id)
    await Promise.all([
      c.professionals.deleteMany({ _id: { $in: demoIds } }),
      c.publishedProfiles.deleteMany({ professionalId: { $in: demoIds } }),
      c.profileRevisions.deleteMany({ professionalId: { $in: demoIds } }),
      c.testimonials.deleteMany({ isDemo: true }),
    ])
    console.info(`Reset: removed ${demoIds.length} demo professionals.`)
  }

  // 1) Bootstrap admin from env – never hardcoded.
  if (e.SEED_ADMIN_EMAIL && e.SEED_ADMIN_PASSWORD) {
    if (e.SEED_ADMIN_PASSWORD.length < 12) throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters')
    const { created } = await upsertBootstrapAdmin({
      email: e.SEED_ADMIN_EMAIL,
      name: 'Administrador',
      passwordHash: await hashPassword(e.SEED_ADMIN_PASSWORD),
    })
    console.info(created ? `Created SUPER_ADMIN ${e.SEED_ADMIN_EMAIL}` : `SUPER_ADMIN ${e.SEED_ADMIN_EMAIL} already exists`)
  } else {
    console.warn('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: skipping admin bootstrap.')
  }

  // 2) Site settings (only when missing, so real edits are never overwritten).
  if (reset || !(await c.siteSettings.findOne({ _id: 'site' }))) {
    await saveSiteSettings(siteSettings(), SYSTEM_ACTOR)
    console.info('Site settings written.')
  }

  // 3) Static demo media records (metadata only – binaries live in apps/web/public).
  for (const d of demos) {
    const [url, width, height] = d.hero
    await upsertStaticMedia({
      provider: 'static',
      key: url.slice(1),
      url,
      filename: url.split('/').pop() ?? url,
      mimeType: 'image/png',
      size: 0,
      width,
      height,
      hasAlpha: true,
      alt: d.input.name,
      focalX: 50,
      focalY: 25,
      folder: 'professionals',
    })
  }

  // 4) Professionals + testimonials.
  for (const [index, demo] of demos.entries()) {
    const exists = await c.professionals.findOne({ slug: demo.input.slug }, { projection: { _id: 1 } })
    if (exists) {
      console.info(`= ${demo.input.slug} already exists`)
      continue
    }
    const [heroUrl, w, h] = demo.hero
    const input = professionalInputSchema.parse({
      ...demo.input,
      displayOrder: index,
      isDemo: true,
      images: {
        hero: img(heroUrl, w, h, `${demo.input.name}, ${demo.input.professionalTitle}`),
        avatar: img(`/demo/avatars/${demo.input.slug}.png`, 258, 258, demo.input.name),
      },
      location: { label: 'Consulta Aprendizajess', address: '', city: 'Santiago', region: 'RM', country: 'CL', mapsUrl: '' },
      testimonials: { source: 'MANUAL', addReviewUrl: 'https://maps.app.goo.gl/U6Jj8aPCMypiP9TLA' },
    })
    const created = await createProfessional(input, SYSTEM_ACTOR)
    await publishProfessional(created.id, SYSTEM_ACTOR)
    for (const [order, t] of demo.testimonials.entries()) {
      await createTestimonial(
        {
          professionalId: created.id,
          authorName: t.authorName,
          authorDetail: t.authorDetail,
          content: t.content,
          rating: t.rating,
          date: new Date(Date.now() - (order + 1) * 30 * 86400000).toISOString().slice(0, 10),
          sourceLabel: 'Testimonio demo',
          sourceUrl: '',
          enabled: true,
          featured: Boolean(t.featured),
          displayOrder: order,
          isDemo: true,
        },
        SYSTEM_ACTOR,
      )
    }
    const check = await getProfessionalById(created.id)
    console.info(`+ ${demo.input.slug} (status: ${check?.status})`)
  }

  // An organisation-wide demo testimonial (shown on every profile).
  if ((await c.testimonials.countDocuments({ professionalId: null, isDemo: true })) === 0) {
    await createTestimonial(
      {
        professionalId: null,
        authorName: 'Comunidad Aprendizajess (demo)',
        authorDetail: 'Testimonio general',
        content: 'Un equipo que trabaja coordinado: psicopedagogía, lenguaje y psicología conversando entre sí por el bienestar de cada niño.',
        rating: 5,
        date: null,
        sourceLabel: 'Testimonio demo',
        sourceUrl: '',
        enabled: true,
        featured: false,
        displayOrder: 99,
        isDemo: true,
      },
      SYSTEM_ACTOR,
    )
  }

  // 5) Sales landing (home page): example content, published.
  const home = await getHomePageDraft()
  if (reset || home.revision === 0) {
    const saved = await saveHomePageDraft(exampleLanding(), home.revision, SYSTEM_ACTOR)
    await publishHomePage(SYSTEM_ACTOR)
    console.info(`Landing published (revision ${saved.revision}).`)
    if (home.revision === 0 && !reset) {
      // One-time migration of existing installs: the root now shows the landing
      // and the team lives at /equipo.
      const current = await getSiteSettings()
      const nav = siteSettings().navigation
      await saveSiteSettings(
        {
          ...current,
          root: { ...current.root, mode: 'LANDING' },
          navigation: nav,
          organization: { ...current.organization, ...Object.fromEntries(Object.entries(DEMO_ORGANIZATION).filter(([k]) => !current.organization[k as keyof typeof DEMO_ORGANIZATION])) },
        },
        SYSTEM_ACTOR,
      )
      console.info('Site settings migrated: root → LANDING, menu → /equipo.')
    }
  }

  console.info('Seed complete.')
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => closeMongo())
