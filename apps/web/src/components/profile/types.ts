import type { AppointmentAction, ProfessionalCard, PublicProfile, Section, SiteSettings, TestimonialFeed } from '@repo/domain'

/** Everything a section renderer may need. Built once per page on the server. */
export interface ProfileContext {
  profile: PublicProfile
  site: SiteSettings
  cards: ProfessionalCard[]
  appointment: { action: AppointmentAction; label: string }
  feed: TestimonialFeed | null
  liveReviews: boolean
  preview: boolean
  /** Index of the section in the rendered list (first = above the fold). */
  index: number
}

export type SectionProps<T extends Section['type']> = {
  section: Extract<Section, { type: T }>
  ctx: ProfileContext
}
