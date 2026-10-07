import {
  mergeTheme,
  resolveAppointmentAction,
  themeToCssVars,
  visibleSections,
  type ProfessionalCard,
  type PublicProfile,
  type SiteSettings,
  type TestimonialFeed,
} from '@repo/domain'
import type { CSSProperties } from 'react'
import { AppointmentProvider } from '@/components/appointment/AppointmentContext'
import type { AppointmentFormConfig } from '@/components/appointment/types'
import { RenderSection } from '@/components/sections/registry'
import { ProfileAnalytics } from './ProfileAnalytics'

/**
 * Renders a professional page from its (published or preview) snapshot.
 * Theme overrides of the professional are applied as CSS variables scoped to
 * the article, inheriting everything else from the site theme.
 */
export function ProfileView({
  profile,
  site,
  cards,
  feed,
  liveReviews,
  preview = false,
}: {
  profile: PublicProfile
  site: SiteSettings
  cards: ProfessionalCard[]
  feed: TestimonialFeed | null
  liveReviews: boolean
  preview?: boolean
}) {
  const theme = mergeTheme(site.theme, profile.theme)
  const action = resolveAppointmentAction(profile.appointment, { professionalName: profile.name })
  const label = profile.appointment.buttonLabel || site.copy.appointmentCta
  const formConfig: AppointmentFormConfig | null =
    action.kind === 'form'
      ? {
          professionalSlug: profile.slug,
          professionalName: profile.name,
          title: profile.appointment.formTitle || label,
          intro: profile.appointment.formIntro || 'Déjanos tus datos y te contactaremos para coordinar.',
          fields: profile.appointment.fields,
          modalities: profile.modalities.map((m) => m.label),
          services: profile.services.map((s) => s.name),
          consentText: profile.appointment.consentText || site.copy.consentText,
          privacyUrl: site.policies.privacyUrl,
        }
      : null
  const sections = visibleSections(profile.sections)

  return (
    <article
      className="relative"
      style={themeToCssVars(theme) as CSSProperties}
      data-motion={theme.motion === 'off' ? 'off' : undefined}
      data-profile={profile.slug}
    >
      <AppointmentProvider config={preview ? null : formConfig}>
        {sections.map((section, index) => (
          <RenderSection
            key={section.id}
            section={section}
            ctx={{ profile, site, cards, appointment: { action, label }, feed, liveReviews, preview, index }}
          />
        ))}
      </AppointmentProvider>
      {preview ? null : <ProfileAnalytics slug={profile.slug} />}
    </article>
  )
}
