import { getImageProps } from 'next/image'
import { preload } from 'react-dom'
import { AppointmentButton } from '@/components/appointment/AppointmentButton'
import { RotatingBadge } from '@/components/fx/RotatingBadge'
import type { SectionProps } from '@/components/profile/types'
import { Icon } from '@/components/ui/Icon'
import { SocialLinks } from '@/components/ui/SocialLinks'
import { cn } from '@/lib/cn'
import { Star } from 'lucide-react'
import { focalPosition, initials } from '@/lib/image'

/**
 * Hero. Mobile-first single DOM: on phones the professional stands on top of
 * the violet panel and the copy flows inside it; from `md` the panel becomes a
 * wide stage with copy | photo | modalities and the photo breaks out of the
 * panel's top edge. The photo is the LCP element: it is preloaded with high
 * priority and only ever animated with transforms.
 */
export function Hero({ section, ctx }: SectionProps<'hero'>) {
  const { profile, appointment } = ctx
  const c = section.content
  const variant = section.variant
  const hero = profile.images.hero ?? profile.images.profile
  const mobile = profile.images.heroMobile
  const cutout = hero?.hasAlpha ?? false
  const experienceText = c.experienceText || ''
  const experienceScript = c.experienceScript || ''
  // Solo mostrar el circulo si AMBOS campos estan configurados
  const showBadge = Boolean(experienceText && experienceScript)
  // Extraer numero del texto de experiencia (ej. "Mas de 14 anos" -> "14")
  const experienceNumber = experienceText.match(/\d+/)?.[0] || null
  const badgeValue = experienceNumber ? `+${experienceNumber}` : experienceText
  const headline = c.headline || profile.shortDescription
  const description = c.description && c.description !== headline ? c.description : ''
  const chips = [
    ...(c.showModalities ? profile.modalities : []),
    ...(c.showSpecialties && profile.modalities.length === 0 ? profile.specialties.slice(0, 3) : []),
  ].slice(0, 4)
  const ctaLabel = c.ctaLabel || appointment.label

  // Art direction: optional mobile crop via <picture>, single LCP request.
  const alt = hero?.alt || `${profile.name}, ${profile.professionalTitle}`
  const eager = ctx.index === 0
  const common = {
    alt,
    sizes: '(min-width: 1280px) 520px, (min-width: 768px) 38vw, 82vw',
    quality: 72,
    loading: eager ? ('eager' as const) : ('lazy' as const),
    fetchPriority: eager ? ('high' as const) : ('auto' as const),
  }
  const desktopImg = hero ? getImageProps({ ...common, src: hero.url, width: hero.width, height: hero.height }).props : null
  const mobileImg = mobile ? getImageProps({ ...common, src: mobile.url, width: mobile.width, height: mobile.height }).props : null

  // Hoist the LCP image request into <head> (responsive, high priority).
  if (eager && desktopImg && !mobileImg) {
    preload(desktopImg.src, { as: 'image', fetchPriority: 'high', imageSrcSet: desktopImg.srcSet, imageSizes: desktopImg.sizes })
  }

  return (
    <section
      id="inicio"
      aria-labelledby="hero-name"
      data-section="hero"
      data-variant={variant}
      className={cn(
        'hero relative overflow-x-clip bg-canvas pt-4 pb-8 md:pt-12 md:pb-16',
        section.responsive.hideOnMobile && 'max-md:hidden',
        section.responsive.hideOnDesktop && 'md:hidden',
      )}
    >
      <div className="relative mx-auto w-full max-w-wide px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center gap-4 sm:gap-6 md:gap-10 lg:gap-14">
          {/* LEFT: text column (eyebrow -> button) */}
          <div className="flex flex-col">
            {c.eyebrow ? (
              <p className="mb-3 inline-flex items-center gap-2 text-[0.7rem] font-bold tracking-[0.22em] text-[#4d2a80] uppercase">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#8777b5]" />
                {c.eyebrow}
              </p>
            ) : null}
            <h1
              id="hero-name"
              className="[view-transition-name:hero-name] text-[clamp(1.3rem,4vw,2.5rem)] leading-[1.05] font-black tracking-[-0.02em] break-words text-black uppercase"
            >
              {profile.name}
            </h1>
            <p className="script mt-1 origin-left pb-2 text-[clamp(1.5rem,4.5vw,2.8rem)] leading-[1.2] text-[#4d2a80]">
              {profile.scriptTitle || profile.professionalTitle}
              {profile.scriptTitle ? <span className="sr-only"> · {profile.professionalTitle}</span> : null}
            </p>

            {headline ? (
              <p className="mt-4 text-[clamp(1.1rem,3.5vw,1.8rem)] leading-[1.15] font-bold tracking-[-0.01em] text-[#8777b5]">
                {headline}
              </p>
            ) : null}

            {description ? (
              <>
                <p className="mt-3 max-w-prose text-[0.88rem] leading-relaxed text-[#3c3c3b]">
                  {description}
                </p>
                <a
                  href="#sobre-mi"
                  className="mt-3 inline-block text-sm font-semibold text-[#8777b5] underline underline-offset-4 hover:opacity-80"
                >
                  Leer más...
                </a>
              </>
            ) : null}

            <div className="mt-7 md:mt-auto md:pt-7">
              <div className="inline-block motion-safe:animate-[float_4s_ease-in-out_infinite]">
                <AppointmentButton
                  action={appointment.action}
                  label={ctaLabel}
                  slug={profile.slug}
                  placement="hero"
                  tone="brand"
                  magnetic
                />
              </div>
              {c.showSocialLinks ? (
                <div className="mt-6 flex justify-start">
                  <SocialLinks social={profile.social} owner={profile.name} tone="brand" />
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT: image column (fills entire height of left column) */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-[380px] md:max-w-[420px] lg:max-w-[460px]">
              <div className="motion-safe:animate-[float_5s_ease-in-out_infinite] w-full">
              {hero && desktopImg ? (
                <picture>
                  {mobileImg ? <source media="(max-width: 767px)" srcSet={mobileImg.srcSet} sizes={mobileImg.sizes} /> : null}
                  <img
                    {...desktopImg}
                    alt={alt}
                    className={cn(
                      'h-auto w-full motion-safe:animate-[lift_1s_var(--ease-out)_both]',
                      cutout
                        ? 'object-contain object-center md:object-bottom'
                        : 'rounded-t-[9999px] object-cover object-top',
                    )}
                    style={{ objectPosition: cutout ? undefined : focalPosition(hero) }}
                  />
                </picture>
              ) : (
                <div className="grid h-full w-full place-items-center text-6xl font-black text-[#4d2a80]">
                  {initials(profile.name)}
                </div>
              )}

              </div>
              {showBadge ? (
                <div className="absolute bottom-2 right-2 z-20 rounded-full bg-accent-warm text-brand-deep shadow-lifted">
                  <RotatingBadge
                    value={badgeValue}
                    ring={experienceScript}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Social icons: aligned with left column width (55%) */}
        {/* Chips: full width below */}
        {chips.length > 0 ? (
          <div className="mt-8 grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] items-start gap-4 border-t border-[#4d2a80]/10 pt-6 md:mt-12 md:pt-8">
            {/* Columna izquierda: Modalidades + chips */}
            <div>
              <p className="script mb-4 text-[clamp(1.4rem,4vw,2rem)] leading-[1.2] text-[#8777b5]">
                Modalidades
              </p>
              <ul className="flex flex-wrap gap-4 md:gap-8">
                {chips.map((chip) => (
                  <li key={chip.id} className="flex flex-col items-start gap-2 text-left">
                    <span className="grid size-10 place-items-center rounded-full border-2 border-[#4d2a80]/40 text-[#4d2a80] md:size-12">
                      <Icon name={chip.icon} size={20} />
                    </span>
                    <span className="text-[0.75rem] leading-tight font-medium text-[#4d2a80]">{chip.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna derecha: acciones de reseñas */}
            {profile.testimonials?.addReviewUrl ? (
              <div className="flex flex-col items-end justify-center gap-3 pt-2">
                <a
                  href="#testimonios"
                  className="text-xs font-black tracking-wide text-[#4d2a80] uppercase underline-offset-4 hover:underline sm:text-sm"
                >
                  + Ver testimonios
                </a>
                <a
                  href={profile.testimonials.addReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#b7ace5] px-4 py-2.5 text-xs font-black tracking-wide text-[#4d2a80] uppercase transition-transform duration-300 ease-out-expo hover:scale-105 sm:px-6 sm:py-3 sm:text-sm"
                >
                  <Star size={14} aria-hidden="true" className="fill-[#f5b400] text-[#f5b400]" />
                  Dejar una reseña
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
