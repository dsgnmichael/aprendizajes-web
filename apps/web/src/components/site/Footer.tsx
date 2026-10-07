import type { SiteSettings } from '@repo/domain'
import { SocialLinks } from '@/components/ui/SocialLinks'

export function Footer({ site, year }: { site: SiteSettings; year: number }) {
  const links = [
    ...site.footer.links.filter((l) => l.enabled),
    ...(site.policies.privacyUrl ? [{ id: 'privacy', label: 'Privacidad', href: site.policies.privacyUrl, enabled: true }] : []),
    ...(site.policies.termsUrl ? [{ id: 'terms', label: 'Términos', href: site.policies.termsUrl, enabled: true }] : []),
  ]
  return (
    <footer className="relative mt-8 border-t border-line bg-canvas pb-[calc(2rem+var(--safe-bottom))]">
      <div className="mx-auto flex w-full max-w-wide flex-col gap-6 px-5 pt-10 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-10">
        <div className="max-w-md">
          <p className="script text-4xl text-brand">{site.organizationName}</p>
          {site.footer.text ? <p className="mt-2 text-sm leading-relaxed text-ink-muted">{site.footer.text}</p> : null}
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          {site.footer.showSocial ? <SocialLinks social={site.social} owner={site.organizationName} tone="brand" className="-ml-3 md:ml-0 md:-mr-3" /> : null}
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
