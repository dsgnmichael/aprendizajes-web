import type { Section, SectionType } from '@repo/domain'
import type { ComponentType } from 'react'
import type { ProfileContext, SectionProps } from '@/components/profile/types'
import {
  About,
  AppointmentCta,
  Contact,
  CustomCta,
  Experience,
  Gallery,
  Location,
  Modalities,
  RichTextSection,
  Services,
  SocialSection,
  Specialties,
} from './content'
import { Hero } from './Hero'
import { ProfessionalSwitcher } from './ProfessionalSwitcher'
import { Testimonials } from './Testimonials'

/**
 * Public renderer side of the section registry: one component per section
 * type declared in `@repo/domain` `sectionRegistry`. TypeScript guarantees
 * every registered type has a renderer (adding a type without one fails the
 * build), and unknown types from the database are simply skipped.
 */
export const sectionComponents: { [T in SectionType]: ComponentType<SectionProps<T>> } = {
  hero: Hero,
  about: About,
  experience: Experience,
  specialties: Specialties,
  services: Services,
  modalities: Modalities,
  testimonialCarousel: Testimonials,
  socialLinks: SocialSection,
  appointmentCTA: AppointmentCta,
  gallery: Gallery,
  contact: Contact,
  location: Location,
  richText: RichTextSection,
  professionalSwitcher: ProfessionalSwitcher,
  customCTA: CustomCta,
}

export function RenderSection({ section, ctx }: { section: Section; ctx: ProfileContext }) {
  const Component = sectionComponents[section.type] as ComponentType<{ section: Section; ctx: ProfileContext }> | undefined
  return Component ? <Component section={section} ctx={ctx} /> : null
}
