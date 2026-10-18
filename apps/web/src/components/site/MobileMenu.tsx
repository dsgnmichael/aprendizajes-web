'use client'

import type { NavItem, SocialLinks as Social } from '@repo/domain'
import { digitsOnly, whatsappUrl } from '@repo/domain'
import { Globe, Mail, Menu, Search, X } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Dialog } from 'radix-ui'
import { useEffect, useState, type ComponentType } from 'react'
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from '@/components/ui/BrandIcons'
import { TrackedLink } from '@/components/ui/TrackedLink'
import { cn } from '@/lib/cn'

type Logo = { url: string; width: number; height: number } | null
type Organization = {
  email: string
  phone: string
  whatsapp: string
  address: string
  city: string
  mapsUrl: string
}

type ContactItem = {
  key: string
  label: string
  href: string
  Icon: ComponentType<{ size?: number }>
  external: boolean
}

type SearchHit = {
  type: 'professional' | 'service' | 'testimonial' | 'contact'
  title: string
  subtitle?: string
  snippet?: string
  href: string
  score: number
  external?: boolean
}

const TYPE_LABEL: Record<SearchHit['type'], string> = {
  professional: 'Profesional',
  service: 'Servicio',
  testimonial: 'Testimonio',
  contact: 'Contacto',
}

function normalizeText(v: string): string {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

const CONTACT_KEYWORDS = {
  whatsapp: ['whatsapp', 'wsp', 'wapp', 'watsap', 'guasap', 'whats'],
  email: ['correo', 'email', 'mail', 'correos', 'emails', 'mails'],
  phone: ['telefono', 'fono', 'llamar', 'celular', 'movil', 'llamada', 'marcar'],
  instagram: ['instagram', 'ig', 'insta'],
  tiktok: ['tiktok', 'tik tok', 'tiktoks'],
  facebook: ['facebook', 'fb'],
  website: ['web', 'sitio', 'pagina'],
  schedule: ['agendar', 'agenda', 'cita', 'citas', 'reservar', 'reserva', 'hora', 'horas'],
  location: ['ubicacion', 'direccion', 'llegar', 'mapa', 'donde'],
  social: ['redes', 'social', 'siguenos'],
  general: ['contacto', 'contactar', 'contact', 'contactanos', 'comunicar', 'comunicacion', 'hablar'],
} as const

function matchesKeyword(q: string, keywords: readonly string[]): boolean {
  return keywords.some((k) => {
    if (k === q) return true
    if (q.length >= 4 && (k.startsWith(q) || q.startsWith(k))) return true
    return false
  })
}

function buildContactHits(
  rawQuery: string,
  organization: Organization,
  social: Social,
  organizationName: string,
): SearchHit[] {
  const q = normalizeText(rawQuery)
  if (q.length < 3) return []
  const hits: SearchHit[] = []
  const isGeneral = matchesKeyword(q, CONTACT_KEYWORDS.general)

  if (organization.whatsapp && digitsOnly(organization.whatsapp).length >= 8) {
    if (isGeneral || matchesKeyword(q, CONTACT_KEYWORDS.whatsapp)) {
      hits.push({
        type: 'contact',
        title: 'WhatsApp',
        subtitle: `Escribinos al ${organization.whatsapp}`,
        href: whatsappUrl(organization.whatsapp, `Hola ${organizationName}, `),
        score: isGeneral ? 85 : 95,
        external: true,
      })
    }
  }

  if (organization.email && (isGeneral || matchesKeyword(q, CONTACT_KEYWORDS.email))) {
    hits.push({
      type: 'contact',
      title: 'Correo electrónico',
      subtitle: organization.email,
      href: `mailto:${organization.email}`,
      score: isGeneral ? 85 : 95,
    })
  }

  if (organization.phone && (isGeneral || matchesKeyword(q, CONTACT_KEYWORDS.phone))) {
    hits.push({
      type: 'contact',
      title: 'Teléfono',
      subtitle: organization.phone,
      href: `tel:${digitsOnly(organization.phone)}`,
      score: isGeneral ? 85 : 95,
    })
  }

  if (social.instagram && (isGeneral || matchesKeyword(q, CONTACT_KEYWORDS.instagram) || matchesKeyword(q, CONTACT_KEYWORDS.social))) {
    hits.push({
      type: 'contact',
      title: 'Instagram',
      subtitle: 'Seguinos en Instagram',
      href: social.instagram,
      score: isGeneral ? 78 : 90,
      external: true,
    })
  }

  if (social.tiktok && (isGeneral || matchesKeyword(q, CONTACT_KEYWORDS.tiktok) || matchesKeyword(q, CONTACT_KEYWORDS.social))) {
    hits.push({
      type: 'contact',
      title: 'TikTok',
      subtitle: 'Seguinos en TikTok',
      href: social.tiktok,
      score: isGeneral ? 78 : 90,
      external: true,
    })
  }

  if (social.facebook && (isGeneral || matchesKeyword(q, CONTACT_KEYWORDS.facebook) || matchesKeyword(q, CONTACT_KEYWORDS.social))) {
    hits.push({
      type: 'contact',
      title: 'Facebook',
      subtitle: 'Seguinos en Facebook',
      href: social.facebook,
      score: isGeneral ? 78 : 90,
      external: true,
    })
  }

  if (social.website && (isGeneral || matchesKeyword(q, CONTACT_KEYWORDS.website))) {
    hits.push({
      type: 'contact',
      title: 'Sitio web',
      subtitle: social.website.replace(/^https?:\/\//, ''),
      href: social.website,
      score: isGeneral ? 78 : 90,
      external: true,
    })
  }

  if ((organization.address || organization.mapsUrl) && matchesKeyword(q, CONTACT_KEYWORDS.location)) {
    hits.push({
      type: 'contact',
      title: 'Ubicación',
      subtitle: [organization.address, organization.city].filter(Boolean).join(', ') || 'Ver en el mapa',
      href: organization.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(organization.address)}`,
      score: 90,
      external: true,
    })
  }

  if (matchesKeyword(q, CONTACT_KEYWORDS.schedule)) {
    hits.push({
      type: 'contact',
      title: 'Agendar una cita',
      subtitle: 'Elegí un profesional para reservar tu hora',
      href: '/equipo',
      score: 88,
    })
  }

  return hits
}

/** Full-height mobile navigation (focus trapped, Esc to close). */
export function MobileMenu({
  items,
  organizationName,
  social,
  organization,
  logo,
}: {
  items: NavItem[]
  organizationName: string
  social: Social
  organization: Organization
  logo: Logo
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (pathname === href || pathname.startsWith(href + '/')) return true
    if (href === '/equipo' && /^\/[^/]+$/.test(pathname) && !items.some((i) => i.href === pathname)) {
      return true
    }
    return false
  }

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const controller = new AbortController()
    const t = setTimeout(() => {
      setLoading(true)
      const contactHits = buildContactHits(q, organization, social, organizationName)
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data: { results?: SearchHit[] }) => {
          setResults([...contactHits, ...(data.results ?? [])])
          setLoading(false)
          setTouched(true)
        })
        .catch(() => {
          setResults(contactHits)
          setLoading(false)
          setTouched(true)
        })
    }, 300)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query, organization, social, organizationName])

  const contactItems: ContactItem[] = []
  if (organization.whatsapp && digitsOnly(organization.whatsapp).length >= 8) {
    contactItems.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      href: whatsappUrl(organization.whatsapp, `Hola ${organizationName}, `),
      Icon: WhatsAppIcon,
      external: true,
    })
  }
  if (social.instagram) {
    contactItems.push({ key: 'instagram', label: 'Instagram', href: social.instagram, Icon: InstagramIcon, external: true })
  }
  if (social.tiktok) {
    contactItems.push({ key: 'tiktok', label: 'TikTok', href: social.tiktok, Icon: TikTokIcon, external: true })
  }
  if (organization.email) {
    contactItems.push({ key: 'email', label: 'Email', href: `mailto:${organization.email}`, Icon: Mail, external: false })
  }
  if (social.website) {
    contactItems.push({ key: 'website', label: 'Sitio web', href: social.website, Icon: Globe, external: true })
  }

  const showResults = touched && query.trim().length >= 2
  const hasResults = results.length > 0

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setQuery('')
          setResults([])
          setTouched(false)
          setLoading(false)
        }
      }}
    >
      <Dialog.Trigger
        className="-mr-2 grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-brand-mist md:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={24} aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-[#502e82] to-[#2a1a4d] text-on-brand data-[state=open]:animate-[fade-in_200ms_ease-out] md:hidden">
          <Dialog.Close
            className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full hover:bg-on-brand/10"
            aria-label="Cerrar menú"
          >
            <X size={24} aria-hidden="true" />
          </Dialog.Close>

          <div className="flex h-[20%] shrink-0 items-center justify-center">
            <Dialog.Title asChild>
              <a href="/" aria-label={organizationName} className="flex items-center justify-center">
                {logo ? (
                  <Image
                    src={logo.url}
                    alt={organizationName}
                    width={logo.width}
                    height={logo.height}
                    sizes="180px"
                    className="h-16 w-auto sm:h-20 [filter:drop-shadow(2.5px_0_0_white)_drop-shadow(-2.5px_0_0_white)_drop-shadow(0_2.5px_0_white)_drop-shadow(0_-2.5px_0_white)]"
                    priority
                  />
                ) : (
                  <span className="script text-4xl text-brand-soft">{organizationName}</span>
                )}
              </a>
            </Dialog.Title>
          </div>
          <Dialog.Description className="sr-only">Navegación principal</Dialog.Description>

          <nav aria-label="Principal" className="flex flex-1 items-center justify-center px-6">
            <ul className="flex flex-col items-center space-y-2">
              {items.map((item, i) => {
                const active = isActive(item.href)
                return (
                  <li
                    key={item.id}
                    className="motion-safe:animate-[rise_var(--dur-slow)_var(--ease-out)_both]"
                    style={{ animationDelay: `${60 + i * 60}ms` }}
                  >
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className="flex min-h-12 items-center justify-center gap-3 text-[1.15rem] leading-none font-black tracking-[0.12em] uppercase"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'block shrink-0 rounded-full transition-all duration-300',
                          active ? 'size-3 bg-[#b7ace5]' : 'size-3 bg-transparent',
                        )}
                      />
                      <span
                        className={cn(
                          'transition-all duration-300',
                          active
                            ? 'not-italic text-[#b7ace5] motion-safe:animate-[float_4s_ease-in-out_infinite]'
                            : 'italic text-on-brand',
                        )}
                      >
                        {item.label}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 flex-col items-center gap-4 px-6 pb-[40vh]">
            {contactItems.length > 0 ? (
              <ul
                className="flex flex-wrap items-center justify-center gap-2"
                aria-label={`Contacto y redes de ${organizationName}`}
              >
                {contactItems.map((item) => (
                  <li key={item.key}>
                    <TrackedLink
                      href={item.href}
                      event="social_click"
                      eventProps={{ network: item.key }}
                      external={item.external}
                      aria-label={`${item.label} de ${organizationName}`}
                      className="grid size-13 place-items-center rounded-full text-on-brand/90 transition-[transform,background-color,color] duration-200 ease-out-expo hover:-translate-y-0.5 hover:bg-on-brand/12 hover:text-on-brand active:scale-95"
                    >
                      <item.Icon size={28} />
                    </TrackedLink>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="relative w-full max-w-xs">
              <label className="flex items-center gap-3 rounded-full bg-white/95 px-5 py-3 text-[#4d2a80] shadow-soft">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                  const val = e.target.value
                  setQuery(val)
                  if (val.trim().length < 2) {
                    setResults([])
                    setLoading(false)
                    setTouched(false)
                  }
                }}
                  placeholder="Buscar"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-base font-medium placeholder:text-[#4d2a80]/60 focus:outline-none"
                  aria-label="Buscar en el sitio"
                  aria-controls="search-results"
                />
                <Search size={20} aria-hidden="true" className="shrink-0" />
              </label>

              {showResults ? (
                <div
                  id="search-results"
                  className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-[#8777b5]/25 bg-gradient-to-b from-[#f4f1fa] to-[#ece7f3] shadow-lifted"
                >
                  {loading ? (
                    <p className="px-4 py-3 text-sm text-[#4d2a80]/70">Buscando…</p>
                  ) : hasResults ? (
                    <ul className="divide-y divide-[#8777b5]/15">
                      {results.map((hit, i) => (
                        <li key={`${hit.type}-${hit.href}-${i}`}>
                          <a
                            href={hit.href}
                            target={hit.external ? '_blank' : undefined}
                            rel={hit.external ? 'noopener noreferrer' : undefined}
                            onClick={() => setOpen(false)}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#8777b5]/10"
                          >
                            <span className="mt-0.5 shrink-0 rounded-full bg-[#8777b5]/20 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-[#4d2a80]">
                              {TYPE_LABEL[hit.type]}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-[#4d2a80]">
                                {hit.title}
                              </span>
                              {hit.subtitle ? (
                                <span className="block truncate text-xs text-[#3c3c3b]/70">
                                  {hit.subtitle}
                                </span>
                              ) : null}
                              {hit.snippet ? (
                                <span className="mt-0.5 block line-clamp-2 text-xs text-[#3c3c3b]/60">
                                  {hit.snippet}
                                </span>
                              ) : null}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-[#4d2a80]/70">
                      Sin resultados para «{query.trim()}»
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
