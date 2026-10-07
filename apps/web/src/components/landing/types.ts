import type { LandingSection, LandingSectionType, ProfessionalCard, SiteSettings } from '@repo/domain'

export interface LandingContext {
  site: SiteSettings
  cards: ProfessionalCard[]
  preview: boolean
  index: number
}

export type LandingSectionProps<T extends LandingSectionType> = {
  section: Extract<LandingSection, { type: T }>
  ctx: LandingContext
}
