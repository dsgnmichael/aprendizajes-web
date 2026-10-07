import type { Section, SectionStyle } from '@repo/domain'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Stable anchors so navigation items like "#servicios" work on every profile. */
export const SECTION_ANCHORS: Partial<Record<string, string>> = {
  about: 'sobre-mi',
  services: 'servicios',
  specialties: 'especialidades',
  testimonialCarousel: 'testimonios',
  professionalSwitcher: 'equipo',
  contact: 'contacto',
  location: 'ubicacion',
  experience: 'trayectoria',
  gallery: 'galeria',
  // Landing
  servicesOverview: 'servicios',
  teamShowcase: 'equipo',
  testimonialsWall: 'testimonios',
  process: 'como-trabajamos',
  plans: 'planes',
  faq: 'preguntas',
  contactBlock: 'contacto',
  values: 'compromiso',
}

/** Minimal shape shared by profile and landing sections. */
export interface ShellSection {
  id: string
  type: string
  style: SectionStyle
  responsive: Section['responsive']
}

const backgrounds: Record<SectionStyle['background'], string> = {
  canvas: 'bg-canvas text-ink',
  surface: 'bg-surface text-ink',
  mist: 'bg-brand-mist text-ink',
  brand: 'bg-brand text-on-brand',
}

const spacing: Record<SectionStyle['spacing'], string> = {
  compact: 'py-10 md:py-14',
  normal: 'py-16 md:py-24',
  relaxed: 'py-20 md:py-32',
}

/** Applies the style/responsive options every section shares. */
export function SectionShell({
  section,
  children,
  className,
  labelledBy,
  bleed = false,
}: {
  section: ShellSection
  children: ReactNode
  className?: string
  labelledBy?: string
  bleed?: boolean
}) {
  return (
    <section
      id={SECTION_ANCHORS[section.type] ?? `s-${section.id}`}
      aria-labelledby={labelledBy}
      data-section={section.type}
      className={cn(
        'relative',
        backgrounds[section.style.background],
        !bleed && spacing[section.style.spacing],
        section.style.align === 'center' && 'text-center',
        section.responsive.hideOnMobile && 'max-md:hidden',
        section.responsive.hideOnDesktop && 'md:hidden',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function SectionHeading({
  id,
  title,
  kicker,
  intro,
  align = 'start',
  tone = 'ink',
}: {
  id: string
  title: string
  kicker?: string
  intro?: string
  align?: 'start' | 'center'
  tone?: 'ink' | 'onBrand'
}) {
  return (
    <header className={cn('mb-10 max-w-2xl md:mb-14', align === 'center' && 'mx-auto text-center')}>
      {kicker ? (
        <p className={cn('script text-[2rem] md:text-[2.6rem]', tone === 'onBrand' ? 'text-brand-soft' : 'text-brand')}>{kicker}</p>
      ) : null}
      <h2 id={id} className="text-[clamp(1.9rem,4.5vw,3.1rem)] leading-[1.02] font-black tracking-[-0.02em] text-balance">
        {title}
      </h2>
      {intro ? (
        <p className={cn('mt-4 text-lg leading-relaxed text-pretty', tone === 'onBrand' ? 'text-on-brand/80' : 'text-ink-muted')}>{intro}</p>
      ) : null}
    </header>
  )
}
