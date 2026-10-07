import type { CSSProperties } from 'react'
import { getImageProps } from 'next/image'
import { preload } from 'react-dom'
import { AppointmentButton } from '@/components/appointment/AppointmentButton'
import { RotatingBadge } from '@/components/fx/RotatingBadge'
import { SplitReveal } from '@/components/fx/SplitReveal'
import { Spotlight } from '@/components/fx/Spotlight'
import type { SectionProps } from '@/components/profile/types'
import { Icon } from '@/components/ui/Icon'
import { SocialLinks } from '@/components/ui/SocialLinks'
import { cn } from '@/lib/cn'
import { focalPosition, initials } from '@/lib/image'

/**
 * Hero. Mobile-first single DOM: on phones the professional stands on top of
 * the violet panel and the copy flows inside it; from `md` the panel becomes a
 * wide stage with copy | photo | modalities and the photo breaks out of the
 * panel's top edge. The photo is the LCP element: it is preloaded with high
 * priority and only ever animated with transforms.
 */
export function Hero({ section, ctx }: SectionProps<'hero'>) {
  const { profile, appointment, site } = ctx
  const c = section.content
  const variant = section.variant
  const hero = profile.images.hero ?? profile.images.profile
  const mobile = profile.images.heroMobile
  const cutout = hero?.hasAlpha ?? false
  const experience = c.experienceText || (profile.yearsOfExperience ? `Más de ${profile.yearsOfExperience} años` : '')
  const experienceScript = c.experienceScript || (experience ? 'de experiencia' : '')
  const headline = c.headline || profile.shortDescription
  const description = c.description && c.description !== headline ? c.description : ''
  const chips = [
    ...(c.showModalities ? profile.modalities : []),
    ...(c.showSpecialties && profile.modalities.length === 0 ? profile.specialties.slice(0, 3) : []),
  ].slice(0, 4)
  const intensity = profile.theme.visualIntensity ?? site.theme.visualIntensity
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
        'hero relative overflow-x-clip pt-5 pb-6 md:pt-10 md:pb-10',
        section.responsive.hideOnMobile && 'max-md:hidden',
        section.responsive.hideOnDesktop && 'md:hidden',
      )}
    >
      {/* Ambient light on the canvas. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-[640px] bg-[radial-gradient(60%_50%_at_80%_20%,color-mix(in_oklab,var(--t-brand-soft)_45%,transparent),transparent_70%),radial-gradient(40%_40%_at_10%_10%,color-mix(in_oklab,var(--t-accent-warm)_18%,transparent),transparent_70%)]"
      />

      <div className="relative mx-auto w-full max-w-wide px-4 sm:px-6 lg:px-10">
        {/* Identity row */}
        <div className="relative z-20 grid grid-cols-1 items-end gap-2 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          <div className="min-w-0">
            {c.eyebrow ? (
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-ink-muted uppercase">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                {c.eyebrow}
              </p>
            ) : null}
            <h1
              id="hero-name"
              className="[view-transition-name:hero-name] text-[clamp(2.15rem,8.6vw,4.4rem)] leading-[0.9] font-black tracking-[-0.025em] break-words text-ink uppercase italic"
            >
              {profile.name}
            </h1>
            <p className="script mt-1 ml-0.5 origin-left text-[clamp(2.5rem,10vw,5rem)] text-brand motion-safe:animate-[draw_1.1s_var(--ease-out)_0.15s_both]">
              {profile.scriptTitle || profile.professionalTitle}
              {profile.scriptTitle ? <span className="sr-only"> · {profile.professionalTitle}</span> : null}
            </p>
          </div>
          <span aria-hidden="true" className="hidden md:block md:w-[min(30vw,420px)]" />
          {experience ? (
            <p className="hidden text-right md:block">
              <span className="block text-[clamp(1.4rem,2.6vw,2.4rem)] leading-none font-black tracking-tight uppercase italic">
                {experience}
              </span>
              <span className="script mt-1 block text-[clamp(2.2rem,4vw,3.8rem)] text-brand">{experienceScript}</span>
            </p>
          ) : null}
        </div>

        {/* Stage */}
        <Spotlight
          className="hero-stage relative mt-3 [--img-h:clamp(330px,98vw,470px)] md:-mt-[calc(var(--img-h)*0.2)] md:[--img-h:clamp(540px,50vw,700px)]"
          style={{ '--px': '0', '--py': '0' } as CSSProperties}
        >
          {/* Violet panel (decorative layer) */}
          <div
            aria-hidden="true"
            className={cn(
              'grain absolute inset-x-0 bottom-0 overflow-hidden rounded-panel bg-brand shadow-glow',
              'top-[calc(var(--img-h)*0.34)] md:top-[calc(var(--img-h)*0.26)]',
            )}
            style={{ '--grain-opacity': intensity === 'low' ? '0' : intensity === 'high' ? '0.14' : '0.08' } as CSSProperties}
          >
            <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,color-mix(in_oklab,var(--t-brand-soft)_40%,transparent),transparent_70%),linear-gradient(160deg,transparent_40%,var(--t-brand-deep))]" />
            {/* Pointer spotlight (desktop) */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100 bg-[radial-gradient(420px_circle_at_var(--spot-x,50%)_var(--spot-y,30%),color-mix(in_oklab,var(--t-on-brand)_14%,transparent),transparent_60%)]" />
            {intensity !== 'low' ? (
              <div className="orbits absolute top-[-35%] left-1/2 aspect-square w-[150%] -translate-x-1/2 md:top-[-55%] md:w-[70%] motion-safe:animate-spin-slow" />
            ) : null}
            {/* Typographic watermark */}
            <p className="script absolute -bottom-[0.18em] -left-[0.04em] text-[clamp(6rem,24vw,15rem)] whitespace-nowrap text-on-brand/[0.07] select-none">
              {profile.scriptTitle || profile.professionalTitle}
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-[1.05fr_minmax(0,0.85fr)_1fr]">
            {/* Photo */}
            <figure
              className={cn(
                'relative z-10 mx-auto flex h-[var(--img-h)] w-full max-w-[460px] items-end justify-center md:order-2 md:max-w-none md:self-end',
              )}
            >
              <div
                className="relative h-full w-full [view-transition-name:hero-photo] transition-transform duration-700 ease-out-expo md:[transform:translate3d(calc(var(--px)*-14px),calc(var(--py)*-8px),0)]"
              >
                {hero && desktopImg ? (
                  <picture>
                    {mobileImg ? <source media="(max-width: 767px)" srcSet={mobileImg.srcSet} sizes={mobileImg.sizes} /> : null}
                    <img
                      {...desktopImg}
                      alt={alt}
                      className={cn(
                        'absolute inset-0 h-full w-full motion-safe:animate-[lift_1s_var(--ease-out)_both]',
                        cutout
                          ? 'object-contain object-bottom drop-shadow-[0_30px_40px_rgb(20_8_40/0.35)]'
                          : 'rounded-t-full border-[6px] border-surface object-cover shadow-lifted md:inset-x-[8%] md:w-[84%]',
                      )}
                      style={{ objectPosition: cutout ? undefined : focalPosition(hero) }}
                    />
                  </picture>
                ) : (
                  <div className="absolute inset-x-[15%] bottom-0 grid aspect-[3/4] place-items-center rounded-t-full bg-brand-soft text-6xl font-black text-brand-deep">
                    {initials(profile.name)}
                  </div>
                )}
              </div>
              {experience ? (
                <div className="absolute top-[calc(var(--img-h)*0.38)] right-1 z-20 rounded-full bg-accent-warm text-brand-deep shadow-lifted md:top-auto md:right-auto md:bottom-[18%] md:-left-6 md:hidden lg:grid">
                  <RotatingBadge value={profile.yearsOfExperience ? `+${profile.yearsOfExperience}` : '★'} ring={experienceScript || 'experiencia'} />
                </div>
              ) : null}
              {experience ? <figcaption className="sr-only md:hidden">{`${experience} ${experienceScript}`}</figcaption> : null}
            </figure>

            {/* Copy */}
            <div className="relative z-20 flex flex-col justify-center px-5 pt-2 pb-6 text-on-brand sm:px-8 md:order-1 md:pt-[calc(var(--img-h)*0.4)] md:pr-4 md:pb-14 md:pl-12 lg:pl-14">
              {headline ? (
                <SplitReveal
                  as="p"
                  text={headline}
                  delay={250}
                  className="text-[clamp(1.6rem,5.4vw,2.9rem)] leading-[1.05] font-black tracking-[-0.02em] text-balance"
                />
              ) : null}
              {description ? (
                <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-on-brand/80 motion-safe:animate-[rise_var(--dur-slow)_var(--ease-out)_0.55s_both]">
                  {description}
                </p>
              ) : null}
              <div className="mt-7 flex flex-wrap items-center gap-3 motion-safe:animate-[rise_var(--dur-slow)_var(--ease-out)_0.7s_both]">
                <AppointmentButton
                  action={appointment.action}
                  label={ctaLabel}
                  slug={profile.slug}
                  placement="hero"
                  tone="light"
                  magnetic
                  className="max-sm:w-full"
                />
                {c.secondaryCta?.label && c.secondaryCta.href ? (
                  <a
                    href={c.secondaryCta.href}
                    className="inline-flex min-h-12 items-center rounded-button px-5 font-bold text-on-brand underline-offset-4 hover:underline max-sm:w-full max-sm:justify-center"
                  >
                    {c.secondaryCta.label}
                  </a>
                ) : null}
              </div>
              {c.showSocialLinks ? (
                <SocialLinks social={profile.social} owner={profile.name} tone="onBrand" className="mt-5 -ml-3" />
              ) : null}
            </div>

            {/* Modalities */}
            {chips.length > 0 ? (
              <div className="relative z-20 px-5 pb-8 sm:px-8 md:order-3 md:flex md:flex-col md:justify-center md:pt-[calc(var(--img-h)*0.4)] md:pr-12 md:pb-14 md:pl-4 lg:pr-14">
                <ul
                  aria-label="Modalidades y áreas de atención"
                  className="grid grid-cols-3 gap-2 border-t border-on-brand/15 pt-6 md:grid-cols-1 md:gap-5 md:border-t-0 md:pt-0"
                >
                  {chips.map((chip, i) => (
                    <li
                      key={chip.id}
                      className="flex flex-col items-center gap-2 text-center text-on-brand md:flex-row md:gap-4 md:text-left motion-safe:animate-[rise_var(--dur-slow)_var(--ease-out)_both]"
                      style={{ animationDelay: `${650 + i * 90}ms` }}
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-on-brand/60 bg-on-brand/5 md:size-14">
                        <Icon name={chip.icon} size={22} />
                      </span>
                      <span className="text-[0.78rem] leading-tight font-bold md:text-base">{chip.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Spotlight>
      </div>
    </section>
  )
}
