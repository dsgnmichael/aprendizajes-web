import Image from 'next/image'
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { digitsOnly, whatsappUrl } from '@repo/domain'
import { AppointmentButton } from '@/components/appointment/AppointmentButton'
import { SectionHeading, SectionShell } from '@/components/profile/SectionShell'
import type { SectionProps } from '@/components/profile/types'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { Icon } from '@/components/ui/Icon'
import { RichText } from '@/components/ui/RichText'
import { SocialLinks, activeSocials } from '@/components/ui/SocialLinks'
import { TrackedLink } from '@/components/ui/TrackedLink'
import { cn } from '@/lib/cn'
import { focalPosition } from '@/lib/image'

const container = 'mx-auto w-full max-w-content px-5 sm:px-8'

export function About({ section, ctx }: SectionProps<'about'>) {
  const { profile, site } = ctx
  const body = section.content.body || profile.biography
  if (!body && profile.credentials.length === 0) return null
  const id = `h-${section.id}`
  const portrait = profile.images.profile ?? profile.images.avatar
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={cn(container, section.variant === 'split' ? 'grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:items-start' : 'max-w-prose text-center')}>
        <div className="reveal">
          <SectionHeading id={id} kicker={profile.scriptTitle || undefined} title={section.content.title || site.copy.aboutTitle} align={section.variant === 'centered' ? 'center' : 'start'} />
          {portrait && section.variant === 'split' ? (
            <div className="relative hidden aspect-square w-48 overflow-hidden rounded-full border-4 border-surface shadow-lifted md:block">
              <Image src={portrait.url} alt={portrait.alt || profile.name} fill sizes="192px" className="object-cover" style={{ objectPosition: focalPosition(portrait) }} />
            </div>
          ) : null}
        </div>
        <div className="reveal">
          {body ? <RichText value={body} /> : null}
          {profile.credentials.length > 0 ? (
            <ul className={cn('mt-8 flex flex-wrap gap-2', section.variant === 'centered' && 'justify-center')} aria-label="Formación y credenciales">
              {profile.credentials.map((credential) => (
                <li key={credential} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-ink">
                  {credential}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </SectionShell>
  )
}

export function Experience({ section }: SectionProps<'experience'>) {
  const { items, title } = section.content
  if (items.length === 0) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <SectionHeading id={id} title={title || 'Trayectoria'} />
        <ol className={cn(section.variant === 'timeline' ? 'relative space-y-8 border-l-2 border-brand/20 pl-8' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3')}>
          {items.map((item) => (
            <li key={item.id} className={cn('reveal relative', section.variant === 'cards' && 'rounded-card bg-surface p-6 shadow-soft')}>
              {section.variant === 'timeline' ? (
                <span aria-hidden="true" className="absolute top-1.5 -left-[41px] size-4 rounded-full border-4 border-canvas bg-brand" />
              ) : null}
              {item.period ? <p className="script text-3xl text-brand">{item.period}</p> : null}
              <h3 className="text-xl font-black">{item.title}</h3>
              {item.description ? <p className="mt-1 text-ink-muted">{item.description}</p> : null}
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  )
}

export function Specialties({ section, ctx }: SectionProps<'specialties'>) {
  const { profile, site } = ctx
  if (profile.specialties.length === 0) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <SectionHeading id={id} title={section.content.title || site.copy.specialtiesTitle} intro={section.content.intro || undefined} align={section.style.align} />
        <ul className={cn(section.variant === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4' : 'flex flex-wrap gap-3', section.style.align === 'center' && 'justify-center')}>
          {profile.specialties.map((s) => (
            <li
              key={s.id}
              className={cn(
                'reveal flex items-center gap-3 font-bold',
                section.variant === 'grid' ? 'rounded-card bg-surface p-5 shadow-soft' : 'rounded-full border border-line bg-surface py-2.5 pr-5 pl-2.5',
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-mist text-brand">
                <Icon name={s.icon} size={20} />
              </span>
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

export function Services({ section, ctx }: SectionProps<'services'>) {
  const { profile, site, appointment } = ctx
  if (profile.services.length === 0) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <SectionHeading id={id} kicker="servicios" title={section.content.title || site.copy.servicesTitle} intro={section.content.intro || undefined} align={section.style.align} />
        <ul className={cn(section.variant === 'cards' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'divide-y divide-line rounded-card bg-surface shadow-soft')}>
          {profile.services.map((service, i) => (
            <li
              key={service.id}
              className={cn(
                'reveal group relative',
                section.variant === 'cards'
                  ? 'flex flex-col overflow-hidden rounded-card bg-surface p-7 shadow-soft transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-lifted'
                  : 'flex items-start gap-5 p-6',
              )}
            >
              <span className={cn('grid shrink-0 place-items-center rounded-2xl bg-brand text-on-brand', section.variant === 'cards' ? 'mb-6 size-14' : 'size-12')}>
                <Icon name={service.icon} size={24} />
              </span>
              <div className="flex flex-1 flex-col">
                <h3 className="text-xl leading-tight font-black">{service.name}</h3>
                {service.description ? <p className="mt-2 leading-relaxed text-ink-muted">{service.description}</p> : null}
                {service.duration ? (
                  <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
                    <Clock size={16} aria-hidden="true" /> {service.duration}
                  </p>
                ) : null}
              </div>
              {section.variant === 'cards' ? (
                <span aria-hidden="true" className="script pointer-events-none absolute -right-2 -bottom-6 text-[7rem] leading-none text-brand/[0.06]">
                  {String(i + 1).padStart(2, '0')}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        {appointment.action.kind !== 'disabled' ? (
          <div className="mt-10 flex justify-center">
            <AppointmentButton action={appointment.action} label={appointment.label} slug={profile.slug} placement="services" />
          </div>
        ) : null}
      </div>
    </SectionShell>
  )
}

export function Modalities({ section, ctx }: SectionProps<'modalities'>) {
  const { profile } = ctx
  const items = [...profile.modalities, ...(section.content.showTargetAudience ? profile.targetAudience : [])]
  if (items.length === 0) return null
  const id = `h-${section.id}`
  const band = section.variant === 'band'
  return (
    <SectionShell section={section} labelledBy={id} className={band ? 'bg-brand text-on-brand' : undefined}>
      <div className={container}>
        <h2 id={id} className={cn('mb-8 text-center text-2xl font-black', !section.content.title && 'sr-only')}>
          {section.content.title || 'Modalidades de atención'}
        </h2>
        <ul className="flex flex-wrap justify-center gap-x-10 gap-y-6">
          {items.map((m) => (
            <li key={m.id} className="flex flex-col items-center gap-3 text-center">
              <span className={cn('grid size-16 place-items-center rounded-full border-2', band ? 'border-on-brand/60' : 'border-brand/30 text-brand')}>
                <Icon name={m.icon} size={26} />
              </span>
              <span className="max-w-[9rem] text-sm font-bold">{m.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

export function SocialSection({ section, ctx }: SectionProps<'socialLinks'>) {
  const { profile } = ctx
  if (activeSocials(profile.social).length === 0) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={cn(container, 'flex flex-col items-center gap-4 text-center')}>
        <h2 id={id} className="text-2xl font-black">
          {section.content.title || `Sigue a ${profile.name.split(' ')[0]}`}
        </h2>
        <SocialLinks social={profile.social} owner={profile.name} tone={section.style.background === 'brand' ? 'onBrand' : 'brand'} />
      </div>
    </SectionShell>
  )
}

export function AppointmentCta({ section, ctx }: SectionProps<'appointmentCTA'>) {
  const { profile, appointment } = ctx
  if (appointment.action.kind === 'disabled') return null
  const id = `h-${section.id}`
  const onBrand = section.style.background === 'brand'
  const label = section.content.buttonLabel || appointment.label
  return (
    <SectionShell section={section} labelledBy={id} bleed className="py-10 md:py-16">
      <div className={container}>
        <div
          className={cn(
            'grain relative overflow-hidden rounded-panel px-6 py-12 text-center sm:px-12 md:py-16',
            onBrand ? 'bg-brand-deep text-on-brand' : 'bg-surface text-ink shadow-lifted',
          )}
        >
          <div aria-hidden="true" className="orbits absolute top-1/2 left-1/2 aspect-square w-[140%] -translate-x-1/2 -translate-y-1/2 opacity-60 md:w-[80%]" />
          <p className={cn('script relative text-4xl md:text-5xl', onBrand ? 'text-brand-soft' : 'text-brand')}>{profile.name.split(' ')[0]}</p>
          <h2 id={id} className="relative mx-auto mt-2 max-w-2xl text-[clamp(1.8rem,4.6vw,3rem)] leading-[1.05] font-black tracking-[-0.02em] text-balance">
            {section.content.title || '¿Conversamos?'}
          </h2>
          {section.content.description ? (
            <p className={cn('relative mx-auto mt-4 max-w-xl text-lg', onBrand ? 'text-on-brand/80' : 'text-ink-muted')}>{section.content.description}</p>
          ) : null}
          <div className="relative mt-8 flex justify-center">
            <AppointmentButton action={appointment.action} label={label} slug={profile.slug} placement="cta-section" tone={onBrand ? 'light' : 'brand'} magnetic className="max-sm:w-full" />
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

export function Gallery({ section }: SectionProps<'gallery'>) {
  const { images, title } = section.content
  if (images.length === 0) return null
  const id = `h-${section.id}`
  const strip = section.variant === 'strip'
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <SectionHeading id={id} title={title || 'Galería'} />
        <ul className={cn(strip ? 'no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5' : 'columns-2 gap-4 md:columns-3 [&>li]:mb-4')}>
          {images.map((image, i) => (
            <li key={`${image.url}-${i}`} className={cn('reveal overflow-hidden rounded-card bg-brand-mist', strip && 'w-[78%] shrink-0 snap-center sm:w-[40%]')}>
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes={strip ? '(min-width: 640px) 40vw, 78vw' : '(min-width: 768px) 33vw, 50vw'}
                className="h-auto w-full object-cover"
                style={{ objectPosition: focalPosition(image) }}
              />
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

export function Contact({ section, ctx }: SectionProps<'contact'>) {
  const { profile, site } = ctx
  const { email, phone, whatsapp } = profile.contact
  const c = section.content
  const items = [
    c.showWhatsapp && digitsOnly(whatsapp).length >= 8
      ? { key: 'wa', label: 'WhatsApp', value: whatsapp, href: whatsappUrl(whatsapp, `Hola ${profile.name}, `), icon: <WhatsAppIcon size={22} />, external: true }
      : null,
    c.showPhone && phone ? { key: 'tel', label: 'Teléfono', value: phone, href: `tel:${digitsOnly(phone)}`, icon: <Phone size={22} aria-hidden="true" />, external: false } : null,
    c.showEmail && email ? { key: 'mail', label: 'Email', value: email, href: `mailto:${email}`, icon: <Mail size={22} aria-hidden="true" />, external: false } : null,
  ].filter((x) => x !== null)
  if (items.length === 0) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <SectionHeading id={id} kicker="contacto" title={c.title || site.copy.contactTitle} align={section.style.align} />
        <ul className={cn('grid gap-4', section.variant === 'cards' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'max-w-lg')}>
          {items.map((item) => (
            <li key={item.key} className="reveal">
              <TrackedLink
                href={item.href}
                event="social_click"
                eventProps={{ network: item.key }}
                external={item.external}
                className="group flex min-h-16 items-center gap-4 rounded-card bg-surface p-5 shadow-soft transition-[transform,box-shadow] duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-lifted"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-mist text-brand">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ink-muted">{item.label}</span>
                  <span className="block truncate font-black">{item.value}</span>
                </span>
                <ArrowUpRight size={18} aria-hidden="true" className="text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </TrackedLink>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

export function Location({ section, ctx }: SectionProps<'location'>) {
  const { location } = ctx.profile
  if (!location.address && !location.city && !location.label) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <div className="reveal flex flex-col gap-6 rounded-panel bg-surface p-8 shadow-soft md:flex-row md:items-center md:p-12">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
            <MapPin size={28} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 id={id} className="text-2xl font-black">
              {section.content.title || location.label || 'Dónde atiendo'}
            </h2>
            <p className="mt-1 text-lg text-ink-muted">{[location.address, location.city, location.region].filter(Boolean).join(', ')}</p>
            {section.content.note ? <p className="mt-3 text-ink-muted">{section.content.note}</p> : null}
          </div>
          {location.mapsUrl ? (
            <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button bg-brand px-6 font-black text-on-brand uppercase">
              Cómo llegar <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </SectionShell>
  )
}

export function RichTextSection({ section }: SectionProps<'richText'>) {
  if (!section.content.body) return null
  const id = `h-${section.id}`
  const highlight = section.variant === 'highlight'
  return (
    <SectionShell section={section} labelledBy={section.content.title ? id : undefined}>
      <div className={cn('mx-auto w-full max-w-prose px-5 sm:px-8', highlight && 'rounded-panel bg-brand-mist p-8 md:p-12')}>
        {section.content.title ? (
          <h2 id={id} className="mb-6 text-3xl font-black tracking-tight">
            {section.content.title}
          </h2>
        ) : null}
        <RichText value={section.content.body} />
      </div>
    </SectionShell>
  )
}

export function CustomCta({ section }: SectionProps<'customCTA'>) {
  const { title, description, cta } = section.content
  if (!title || !cta.href || !cta.label) return null
  const id = `h-${section.id}`
  const external = /^https?:/.test(cta.href)
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={cn(container, 'reveal flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between', section.variant === 'card' && 'rounded-panel bg-surface p-8 shadow-soft md:p-12')}>
        <div>
          <h2 id={id} className="text-3xl font-black tracking-tight text-balance">
            {title}
          </h2>
          {description ? <p className="mt-2 max-w-xl text-lg opacity-80">{description}</p> : null}
        </div>
        <a
          href={cta.href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-button bg-brand px-7 font-black tracking-wide text-on-brand uppercase transition-colors hover:bg-brand-deep"
        >
          {cta.label} <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
    </SectionShell>
  )
}
