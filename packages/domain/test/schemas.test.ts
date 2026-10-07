import { describe, expect, it } from 'vitest'
import {
  appointmentRequestInputSchema,
  buildTestimonialFeed,
  contrastRatio,
  createSection,
  defaultTheme,
  mergeTheme,
  professionalInputSchema,
  sectionRegistry,
  sectionsSchema,
  SECTION_TYPES,
  themeToCssVars,
  visibleSections,
  type TestimonialDTO,
} from '../src'

describe('section registry', () => {
  it('creates valid defaults for every registered type', () => {
    for (const type of SECTION_TYPES) {
      const section = createSection(type, `id-${type}`)
      expect(section.type).toBe(type)
      expect(sectionRegistry[type].variants).toContain(section.variant)
    }
  })
  it('enforces singletons and unique ids', () => {
    expect(sectionsSchema.safeParse([createSection('hero', 'a'), createSection('hero', 'b')]).success).toBe(false)
    expect(sectionsSchema.safeParse([createSection('richText', 'a'), createSection('richText', 'a')]).success).toBe(false)
    expect(sectionsSchema.safeParse([createSection('richText', 'a'), createSection('richText', 'b')]).success).toBe(true)
  })
  it('rejects unknown section types and unsafe CTAs', () => {
    expect(sectionsSchema.safeParse([{ id: 'x', type: 'script', content: {} }]).success).toBe(false)
    const cta = createSection('customCTA', 'c')
    expect(sectionsSchema.safeParse([{ ...cta, content: { title: 'x', description: '', cta: { label: 'x', href: 'javascript:alert(1)' } } }]).success).toBe(false)
  })
  it('renders only enabled sections, by order', () => {
    const list = [
      { ...createSection('about', 'a'), order: 2 },
      { ...createSection('hero', 'h'), order: 0 },
      { ...createSection('contact', 'c'), order: 1, enabled: false },
    ]
    expect(visibleSections(list).map((s) => s.id)).toEqual(['h', 'a'])
  })
})

describe('professional schema', () => {
  it('requires name, slug and title, and rejects reserved slugs', () => {
    expect(professionalInputSchema.safeParse({ name: 'Ana', slug: 'admin', professionalTitle: 'Psicóloga' }).success).toBe(false)
    const ok = professionalInputSchema.parse({ name: 'Ana Pérez', slug: 'ana-perez', professionalTitle: 'Psicóloga' })
    expect(ok.testimonials.source).toBe('MANUAL')
    expect(ok.appointment.mode).toBe('INTERNAL_FORM')
  })
  it('rejects non-https social links', () => {
    const r = professionalInputSchema.safeParse({
      name: 'Ana Pérez',
      slug: 'ana-perez',
      professionalTitle: 'Psicóloga',
      social: { instagram: 'javascript:alert(1)' },
    })
    expect(r.success).toBe(false)
  })
})

describe('appointment request', () => {
  const valid = { professionalSlug: 'ana', firstName: 'Juan', email: 'j@x.cl', consent: true }
  it('requires consent and a valid email', () => {
    expect(appointmentRequestInputSchema.safeParse(valid).success).toBe(true)
    expect(appointmentRequestInputSchema.safeParse({ ...valid, consent: false }).success).toBe(false)
    expect(appointmentRequestInputSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false)
  })
  it('rejects filled honeypots', () => {
    expect(appointmentRequestInputSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false)
  })
})

describe('theme', () => {
  it('merges overrides and emits only validated values', () => {
    const t = mergeTheme(defaultTheme, { colors: { brand: '#112233' }, radius: 'sm' })
    const vars = themeToCssVars(t)
    expect(vars['--t-brand']).toBe('#112233')
    expect(vars['--t-radius-panel']).toBe('24px')
  })
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio(defaultTheme.colors.onBrand, defaultTheme.colors.brand)).toBeGreaterThan(4.5)
  })
})

describe('testimonial feed', () => {
  const t = (id: string, origin: TestimonialDTO['origin'], rating: number | null, extra: Partial<TestimonialDTO> = {}): TestimonialDTO => ({
    id,
    origin,
    authorName: id,
    rating,
    content: 'contenido válido',
    featured: false,
    ...extra,
  })
  const config = { maxReviews: 3, minimumRating: 4, ordering: 'featured' as const, manualFallback: true, source: 'MIXED' as const }

  it('filters hidden and low-rated reviews and caps the list', () => {
    const feed = buildTestimonialFeed(
      [
        { origin: 'manual', items: [t('m1', 'manual', 5), t('m2', 'manual', null, { featured: true })] },
        { origin: 'google_places', items: [t('g1', 'google_places', 3), t('g2', 'google_places', 5), t('g3', 'google_places', 5)], summary: { averageRating: 4.8, totalReviews: 120 } },
      ],
      { ...config, hiddenReviewIds: ['g3'] },
    )
    expect(feed.items.map((i) => i.id)).toEqual(['m2', 'm1', 'g2'])
    expect(feed.summary.averageRating).toBe(4.8)
    expect(feed.attributions).toContain('google_places')
  })
  it('falls back to manual testimonials when Google fails', () => {
    const feed = buildTestimonialFeed(
      [
        { origin: 'manual', items: [t('m1', 'manual', 5)] },
        { origin: 'google_places', items: [], failed: true },
      ],
      { ...config, source: 'GOOGLE_PLACES' },
    )
    expect(feed.items.map((i) => i.id)).toEqual(['m1'])
    expect(feed.degraded).toBe(true)
    expect(feed.summary.averageRating).toBeNull()
  })
})
