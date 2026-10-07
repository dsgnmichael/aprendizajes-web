import type { LandingSection, LandingSectionType } from '@repo/domain'
import type { ComponentType } from 'react'
import { LandingHero } from './LandingHero'
import {
  ContactBlock,
  CtaBanner,
  Faq,
  LandingGallery,
  LandingRichText,
  Logos,
  PainPoints,
  Plans,
  Process,
  ServicesOverview,
  Stats,
  TeamShowcase,
  TestimonialsWall,
  Values,
} from './sections'
import type { LandingContext, LandingSectionProps } from './types'

/**
 * Public renderer side of `landingSectionRegistry`. TypeScript guarantees a
 * renderer for every registered landing section type.
 */
export const landingComponents: { [T in LandingSectionType]: ComponentType<LandingSectionProps<T>> } = {
  landingHero: LandingHero,
  stats: Stats,
  painPoints: PainPoints,
  servicesOverview: ServicesOverview,
  process: Process,
  teamShowcase: TeamShowcase,
  testimonialsWall: TestimonialsWall,
  plans: Plans,
  values: Values,
  faq: Faq,
  logos: Logos,
  ctaBanner: CtaBanner,
  contactBlock: ContactBlock,
  landingRichText: LandingRichText,
  landingGallery: LandingGallery,
}

export function RenderLandingSection({ section, ctx }: { section: LandingSection; ctx: LandingContext }) {
  const Component = landingComponents[section.type] as ComponentType<{ section: LandingSection; ctx: LandingContext }> | undefined
  return Component ? <Component section={section} ctx={ctx} /> : null
}
