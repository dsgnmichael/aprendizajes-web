/**
 * Example content for the sales landing (home page). Everything here is
 * editable from the backoffice (Página de inicio). Copy follows an ethical
 * line: no invented figures (only real/verifiable ones or `{equipo}`, which is
 * computed from published professionals), no fake prices, no guarantees of
 * results, and demo testimonials are always labelled as such.
 */
import { createLandingSection, homePageInputSchema, shortId, type HomePageInput, type LandingSection, type LandingSectionType } from '@repo/domain'

type ContentOf<T extends LandingSectionType> = Extract<LandingSection, { type: T }>['content']

function section<T extends LandingSectionType>(
  type: T,
  order: number,
  content: Partial<ContentOf<T>>,
  extra: Partial<Pick<LandingSection, 'variant' | 'style'>> = {},
): LandingSection {
  const base = createLandingSection(type, shortId('l'), order)
  return { ...base, ...extra, style: { ...base.style, ...(extra.style ?? {}) }, content: { ...base.content, ...content } } as LandingSection
}

const id = () => shortId('it')

export function exampleLanding(): HomePageInput {
  let o = 0
  return homePageInputSchema.parse({
    seo: {
      title: 'Aprendizajess · Consultorio integral de aprendizaje',
      description:
        'Psicopedagogía, psicología infanto-juvenil, fonoaudiología, terapia ocupacional y tareas dirigidas. Atención presencial y online.',
    },
    sections: [
      section('landingHero', o++, {
        eyebrow: 'Consultorio integral · presencial y online',
        title: 'Aprender también puede ser un juego',
        titleScript: 'con cariño y con método',
        subtitle:
          'Un equipo interdisciplinario que acompaña a niños, niñas, adolescentes y sus familias a reencontrarse con el gusto por aprender.',
        primaryCta: { label: 'Agendar una orientación', href: '#contacto' },
        secondaryCta: { label: 'Conocer al equipo', href: '/equipo' },
        showTeamCollage: true,
        highlights: [
          { id: id(), icon: 'users', label: 'Equipo interdisciplinario' },
          { id: id(), icon: 'monitor', label: 'Presencial y online' },
          { id: id(), icon: 'heart-handshake', label: 'Trabajo con la familia y el colegio' },
        ],
      }),
      section('stats', o++, {
        items: [
          { id: id(), value: '{equipo}', label: 'especialistas en el equipo', note: '' },
          { id: id(), value: '+14', label: 'años de experiencia de nuestra fundadora', note: '' },
          { id: id(), value: '5', label: 'disciplinas coordinadas', note: '' },
          { id: id(), value: '2', label: 'modalidades: presencial y online', note: '' },
        ],
      }),
      section('painPoints', o++, {
        kicker: '¿te suena familiar?',
        title: 'Cuando aprender se vuelve cuesta arriba',
        intro: 'Muchas familias llegan con preguntas parecidas. No están solas: tienen solución y un camino claro.',
        items: [
          { id: id(), icon: 'book-open', title: 'Le cuesta leer o escribir', description: 'Se frustra con la lectura, confunde letras o evita las tareas escritas.' },
          { id: id(), icon: 'brain', title: 'Se distrae con facilidad', description: 'Le cuesta organizarse, terminar lo que empieza o mantener la atención.' },
          { id: id(), icon: 'smile', title: 'Va al colegio con ansiedad', description: 'Las evaluaciones o la sala de clases le generan angustia o rechazo.' },
          { id: id(), icon: 'languages', title: 'Dudas sobre su lenguaje', description: 'Habla poco para su edad, no se le entiende bien o le cuesta expresarse.' },
          { id: id(), icon: 'puzzle', title: 'Las tareas terminan en discusión', description: 'Las tardes de estudio se transformaron en un momento difícil en casa.' },
          { id: id(), icon: 'school', title: 'El colegio pidió una evaluación', description: 'Necesitan un informe profesional y orientación sobre los próximos pasos.' },
        ],
      }),
      section('servicesOverview', o++, {
        kicker: 'servicios',
        title: 'Un equipo, todas las miradas que tu hijo necesita',
        intro: 'Cada especialista trabaja en su área y nos coordinamos entre nosotros para que el proceso sea coherente.',
        items: [
          { id: id(), icon: 'puzzle', title: 'Psicopedagogía', description: 'Evaluación e intervención en dificultades del aprendizaje, lectoescritura y funciones ejecutivas.', tag: 'Presencial y online', href: '/jessica-de-sousa' },
          { id: id(), icon: 'smile', title: 'Psicología infanto-juvenil', description: 'Regulación emocional, ansiedad y acompañamiento a la familia.', tag: 'Presencial y online', href: '/karen-lamadri' },
          { id: id(), icon: 'languages', title: 'Fonoaudiología', description: 'Lenguaje, comunicación y conciencia fonológica.', tag: 'Presencial', href: '/mayerlin-hurtado' },
          { id: id(), icon: 'activity', title: 'Terapia ocupacional', description: 'Integración sensorial, motricidad y autonomía en el día a día.', tag: 'Presencial', href: '/michael-perez' },
          { id: id(), icon: 'graduation-cap', title: 'Tareas dirigidas', description: 'Rutinas y hábitos de estudio en grupos pequeños.', tag: 'Presencial', href: '/stella-sojo' },
        ],
        cta: { label: 'Agendar una orientación', href: '#contacto' },
      }),
      section('process', o++, {
        kicker: 'cómo trabajamos',
        title: 'Un proceso claro desde el primer día',
        items: [
          { id: id(), title: 'Conversación inicial', description: 'Nos cuentas qué está pasando y te orientamos sobre qué especialista conviene.' },
          { id: id(), title: 'Evaluación', description: 'Conocemos al niño o niña con instrumentos adecuados a su edad y necesidades.' },
          { id: id(), title: 'Plan personalizado', description: 'Definimos objetivos concretos y los compartimos con la familia y, si corresponde, con el colegio.' },
          { id: id(), title: 'Acompañamiento y seguimiento', description: 'Revisamos avances periódicamente y ajustamos el plan cuando hace falta.' },
        ],
      }),
      section('teamShowcase', o++, {
        kicker: 'nuestro equipo',
        title: 'Personas reales, con nombre y trayectoria',
        intro: 'Conoce a cada especialista, su forma de trabajar y agenda directamente desde su perfil.',
        maxProfessionals: 8,
        ctaLabel: 'Conoce a todo el equipo',
      }),
      section('testimonialsWall', o++, {
        kicker: 'testimonios',
        title: 'Lo que dicen las familias',
        subtitle: 'Testimonios de ejemplo (DEMO). Reemplázalos por testimonios reales con autorización de sus autores.',
        maxItems: 6,
        addReviewUrl: 'https://maps.app.goo.gl/U6Jj8aPCMypiP9TLA',
      }),
      section(
        'values',
        o++,
        {
          kicker: 'nuestro compromiso',
          title: 'Ética antes que promesas',
          intro: 'Creemos que la confianza se construye con transparencia. Por eso trabajamos así:',
          items: [
            { id: id(), icon: 'shield-check', title: 'Confidencialidad', description: 'La información de cada familia se resguarda y solo se comparte con su autorización.' },
            { id: id(), icon: 'award', title: 'Profesionales acreditados', description: 'Cada especialista muestra su formación y credenciales en su perfil.' },
            { id: id(), icon: 'brain', title: 'Prácticas basadas en evidencia', description: 'Usamos enfoques y evaluaciones respaldados por la investigación.' },
            { id: id(), icon: 'heart-handshake', title: 'Sin falsas promesas', description: 'Cada proceso es distinto: te explicamos con honestidad qué esperar y cuándo derivar.' },
          ],
        },
        { style: { background: 'mist', spacing: 'normal', align: 'start' } },
      ),
      section('plans', o++, {
        kicker: 'cómo empezar',
        title: 'Elige cómo comenzar',
        intro: 'Los valores dependen del especialista y del tipo de atención. Te los informamos antes de agendar, sin compromiso.',
        items: [
          {
            id: id(),
            name: 'Orientación inicial',
            price: 'Consultar',
            period: '',
            description: 'Una conversación para entender la situación y recomendarte el mejor camino.',
            features: 'Entrevista con la familia\nRecomendación de especialista\nResolución de dudas',
            highlighted: false,
            cta: { label: 'Agendar', href: '#contacto' },
          },
          {
            id: id(),
            name: 'Evaluación integral',
            price: 'Consultar',
            period: '',
            description: 'Evaluación por el especialista adecuado, con informe y devolución a la familia.',
            features: 'Sesiones de evaluación\nInforme escrito\nDevolución y plan de trabajo\nCoordinación con el colegio (si corresponde)',
            highlighted: true,
            cta: { label: 'Quiero evaluar', href: '#contacto' },
          },
          {
            id: id(),
            name: 'Intervención',
            price: 'Consultar',
            period: 'por sesión',
            description: 'Sesiones periódicas con objetivos concretos y seguimiento.',
            features: 'Plan personalizado\nSesiones presenciales u online\nReportes de avance',
            highlighted: false,
            cta: { label: 'Consultar', href: '#contacto' },
          },
        ],
        note: 'Contenido de ejemplo: ajusta nombres, alcances y valores desde el backoffice.',
      }),
      section('faq', o++, {
        kicker: 'preguntas frecuentes',
        title: 'Resolvemos tus dudas',
        items: [
          { id: id(), question: '¿Cómo sé qué especialista necesita mi hijo?', answer: 'Agenda una **orientación inicial**: escuchamos lo que está pasando y te recomendamos el especialista adecuado. Si no somos la mejor opción, te lo decimos.' },
          { id: id(), question: '¿Atienden online?', answer: 'Sí. Varias de nuestras especialistas ofrecen sesiones online. En cada perfil verás las modalidades disponibles.' },
          { id: id(), question: '¿Trabajan con el colegio?', answer: 'Cuando la familia lo autoriza, coordinamos con profesores y equipos del colegio para que todos apunten en la misma dirección.' },
          { id: id(), question: '¿Entregan informes?', answer: 'Las evaluaciones incluyen un informe escrito y una reunión de devolución con la familia.' },
        ],
      }),
      section('ctaBanner', o++, {
        script: 'demos el primer paso',
        title: '¿Conversamos sobre tu hijo o hija?',
        description: 'Cuéntanos qué está pasando. Te respondemos y te orientamos sin compromiso.',
        primaryCta: { label: 'Agendar una orientación', href: '#contacto' },
        secondaryCta: { label: 'Ver especialistas', href: '/equipo' },
      }),
      section('contactBlock', o++, {
        kicker: 'contacto',
        title: 'Estamos para ayudarte',
        intro: 'Escríbenos por WhatsApp o correo y te respondemos a la brevedad. (Datos de contacto DEMO: edítalos en Configuración → Organización.)',
        whatsappMessage: 'Hola, me gustaría recibir orientación para mi hijo/a.',
      }),
    ],
  })
}
