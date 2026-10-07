import type { SiteSettings } from '@repo/domain'
import Image from 'next/image'
import { SocialLinks } from '@/components/ui/SocialLinks'
import { MobileMenu } from './MobileMenu'

/**
 * Public header: configurable navigation, centered logo. There is
 * intentionally NO login entry point on the public site.
 */
export function Header({ site }: { site: SiteSettings }) {
  const items = site.navigation.enabled ? site.navigation.items.filter((i) => i.enabled) : []
  const half = Math.ceil(items.length / 2)
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/70">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-full bg-brand px-4 py-2 font-bold text-on-brand focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto grid h-[var(--header-h)] w-full max-w-wide grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {items.slice(0, half).map((item) => (
              <li key={item.id}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <span className="md:hidden" />
        <a href="/" className="flex items-center justify-center rounded-lg" aria-label={`${site.organizationName}, inicio`}>
          {site.logo ? (
            <Image
              src={site.logo.url}
              alt=""
              width={site.logo.width}
              height={site.logo.height}
              sizes="96px"
              className="h-10 w-auto sm:h-11"
              preload
            />
          ) : (
            <span className="text-xl font-black tracking-tight">{site.organizationName}</span>
          )}
        </a>
        <div className="flex items-center justify-end gap-1">
          <ul className="hidden items-center gap-1 md:flex">
            {items.slice(half).map((item) => (
              <li key={item.id}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
          {items.length === 0 ? (
            <SocialLinks social={site.social} owner={site.organizationName} tone="ink" className="hidden md:flex" />
          ) : null}
          {items.length > 0 ? <MobileMenu items={items} organizationName={site.organizationName} social={site.social} /> : null}
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    'relative inline-flex min-h-11 items-center rounded-full px-4 text-[0.95rem] font-bold text-ink transition-colors hover:text-brand after:absolute after:inset-x-4 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-brand after:transition-transform after:duration-300 hover:after:scale-x-100'
  return (
    <a href={href} className={className} {...(/^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}
