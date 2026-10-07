import { serializeJsonLd, type HomePageInput, type ProfessionalCard, type SiteSettings } from '@repo/domain'
import { RenderLandingSection } from './registry'

/** Sales landing: renders enabled sections in order + Organization JSON-LD. */
export function LandingView({
  page,
  site,
  cards,
  baseUrl,
  preview = false,
}: {
  page: HomePageInput
  site: SiteSettings
  cards: ProfessionalCard[]
  baseUrl: string
  preview?: boolean
}) {
  const sections = page.sections.filter((s) => s.enabled).toSorted((a, b) => a.order - b.order)
  const org = site.organization
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: site.organizationName,
    url: org.url || baseUrl,
    logo: site.logo ? new URL(site.logo.url, baseUrl).toString() : undefined,
    email: org.email || undefined,
    telephone: org.phone || undefined,
    address: org.address ? { '@type': 'PostalAddress', streetAddress: org.address, addressLocality: org.city || undefined } : undefined,
    sameAs: Object.values(site.social).filter((v) => /^https:\/\//.test(v)),
    employee: cards.map((c) => ({ '@type': 'Person', name: c.name, jobTitle: c.professionalTitle, url: `${baseUrl}/${c.slug}` })),
  }
  return (
    <>
      {sections.map((section, index) => (
        <RenderLandingSection key={section.id} section={section} ctx={{ site, cards, preview, index }} />
      ))}
      {preview ? null : (
        <script
          type="application/ld+json"
          // Generated from validated data; `<` is escaped by serializeJsonLd.
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
    </>
  )
}
