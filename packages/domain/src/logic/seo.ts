import type { PublicProfile } from '../schemas/professional'
import type { SiteSettings } from '../schemas/site-settings'
import { richTextToPlain } from './richtext'

/**
 * JSON-LD for a professional page. Uses `Person` + `ProfessionalService`
 * linked to the `Organization`. Deliberately does NOT include
 * `aggregateRating`/`review`: Google treats self-serving reviews on
 * LocalBusiness/Organization pages as ineligible, and we never fabricate them.
 */
export function buildProfileJsonLd(profile: PublicProfile, site: SiteSettings, url: string, baseUrl: string) {
  const sameAs = Object.values(profile.social).filter((v) => /^https:\/\//.test(v))
  const image = profile.images.hero?.url ?? profile.images.avatar?.url
  const absolute = (src?: string) => (src ? new URL(src, baseUrl).toString() : undefined)
  const organizationId = `${baseUrl}/#organization`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: site.organizationName,
        url: site.organization.url || baseUrl,
        logo: absolute(site.logo?.url),
      },
      {
        '@type': 'Person',
        '@id': `${url}#person`,
        name: profile.name,
        jobTitle: profile.professionalTitle,
        description: profile.shortDescription || richTextToPlain(profile.biography).slice(0, 300) || undefined,
        image: absolute(image),
        url,
        sameAs: sameAs.length ? sameAs : undefined,
        worksFor: { '@id': organizationId },
        knowsAbout: profile.specialties.map((s) => s.label),
        hasCredential: profile.credentials.length
          ? profile.credentials.map((c) => ({ '@type': 'EducationalOccupationalCredential', name: c }))
          : undefined,
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${url}#service`,
        name: `${profile.name} · ${profile.professionalTitle}`,
        url,
        image: absolute(image),
        provider: { '@id': `${url}#person` },
        parentOrganization: { '@id': organizationId },
        areaServed: profile.location.city || undefined,
        address: profile.location.address
          ? {
              '@type': 'PostalAddress',
              streetAddress: profile.location.address,
              addressLocality: profile.location.city || undefined,
              addressRegion: profile.location.region || undefined,
              addressCountry: profile.location.country || undefined,
            }
          : undefined,
        telephone: profile.contact.phone || undefined,
        email: profile.contact.email || undefined,
        hasOfferCatalog: profile.services.length
          ? {
              '@type': 'OfferCatalog',
              name: 'Servicios',
              itemListElement: profile.services.map((s) => ({
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name: s.name, description: s.description || undefined },
              })),
            }
          : undefined,
      },
    ],
  }
}

/** Serializes JSON-LD safely for a <script> tag (escapes `<`). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
