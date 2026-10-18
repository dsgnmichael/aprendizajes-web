import type { SiteSettings } from '@repo/domain'
import { digitsOnly, whatsappUrl } from '@repo/domain'
import { Mail } from 'lucide-react'
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from '@/components/ui/BrandIcons'
import { TrackedLink } from '@/components/ui/TrackedLink'

export function Footer({ site, year }: { site: SiteSettings; year: number }) {
  const links = [
    ...site.footer.links.filter((l) => l.enabled),
    ...(site.policies.privacyUrl ? [{ id: 'privacy', label: 'Privacidad', href: site.policies.privacyUrl, enabled: true }] : []),
    ...(site.policies.termsUrl ? [{ id: 'terms', label: 'Términos', href: site.policies.termsUrl, enabled: true }] : []),
  ]

  // Construimos la lista de iconos de contacto (WhatsApp, IG, TikTok, Email)
  const org = site.organization
  const social = site.social
  const contactItems = [
    org.whatsapp && digitsOnly(org.whatsapp).length >= 8
      ? {
          key: 'whatsapp',
          label: 'WhatsApp',
          href: whatsappUrl(org.whatsapp, `Hola ${site.organizationName}, `),
          Icon: WhatsAppIcon,
          external: true,
        }
      : null,
    social?.instagram
      ? { key: 'instagram', label: 'Instagram', href: social.instagram, Icon: InstagramIcon, external: true }
      : null,
    social?.tiktok
      ? { key: 'tiktok', label: 'TikTok', href: social.tiktok, Icon: TikTokIcon, external: true }
      : null,
    org.email
      ? { key: 'email', label: 'Email', href: `mailto:${org.email}`, Icon: Mail, external: false }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <footer className="relative mt-8 border-t border-line bg-canvas pb-[calc(2rem+var(--safe-bottom))]">
      <div className="mx-auto flex w-full max-w-wide flex-col gap-6 px-5 pt-10 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-10">
        <div className="max-w-md">
          <p className="script text-4xl text-brand">{site.organizationName}</p>
          {site.footer.text ? <p className="mt-2 text-sm leading-relaxed text-ink-muted">{site.footer.text}</p> : null}
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          {site.footer.showSocial && contactItems.length > 0 ? (
            <ul className="flex items-center gap-1 -ml-2 md:ml-0 md:-mr-2">
              {contactItems.map((item) => (
                <li key={item.key}>
                  <TrackedLink
                    href={item.href}
                    event="social_click"
                    eventProps={{ network: item.key }}
                    external={item.external}
                    aria-label={item.label}
                    className="grid size-11 place-items-center rounded-full text-brand transition-colors hover:bg-brand-mist"
                  >
                    <item.Icon size={24} />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          ) : null}
          {links.length > 0 ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {links.map((l) => (
                <li key={l.id}>
                  <a href={l.href} className="inline-flex min-h-11 items-center font-bold text-ink-muted hover:text-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-xs text-ink-muted">
            © {year} {site.organization.legalName || site.organizationName}
          </p>
        </div>
      </div>
    </footer>
  )
}
