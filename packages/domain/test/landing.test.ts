import { describe, expect, it } from 'vitest'
import {
  createLandingSection,
  DEFAULT_LANDING_SECTION_TYPES,
  fillStatValue,
  homePageInputSchema,
  LANDING_SECTION_TYPES,
  landingSectionRegistry,
  landingSectionsSchema,
  siteSettingsSchema,
} from '../src'

describe('landing registry', () => {
  it('creates valid defaults for every landing section type', () => {
    for (const type of LANDING_SECTION_TYPES) {
      const s = createLandingSection(type, `id-${type}`)
      expect(s.type).toBe(type)
      expect(landingSectionRegistry[type].variants).toContain(s.variant)
    }
  })
  it('enforces singletons and rejects unsafe CTAs', () => {
    expect(landingSectionsSchema.safeParse([createLandingSection('landingHero', 'a'), createLandingSection('landingHero', 'b')]).success).toBe(false)
    const hero = createLandingSection('landingHero', 'h')
    const bad = { ...hero, content: { ...hero.content, primaryCta: { label: 'x', href: 'javascript:alert(1)' } } }
    expect(landingSectionsSchema.safeParse([bad]).success).toBe(false)
  })
  it('builds a default home page composition', () => {
    const page = homePageInputSchema.parse({
      sections: DEFAULT_LANDING_SECTION_TYPES.map((t, i) => createLandingSection(t, `s${i}`, i)),
    })
    expect(page.sections.map((s) => s.type)).toContain('teamShowcase')
  })
  it('fills verifiable stats from real data', () => {
    expect(fillStatValue('{equipo}', { professionals: 5 })).toBe('5')
    expect(fillStatValue('+14', { professionals: 5 })).toBe('+14')
  })
  it('defaults the site root to the sales landing', () => {
    expect(siteSettingsSchema.parse({}).root.mode).toBe('LANDING')
  })
})
