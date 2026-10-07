import type { CSSProperties } from 'react'
import Image from 'next/image'
import { RotatingBadge } from '@/components/fx/RotatingBadge'
import { Spotlight } from '@/components/fx/Spotlight'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { focalPosition } from '@/lib/image'
import { CtaLink } from './CtaLink'
import type { LandingSectionProps } from './types'

/** Visual order for the skyline: the first professional stands in the middle. */
function skyline<T>(items: T[]): { item: T; height: number; depth: number }[] {
  const heights = [100, 88, 88, 76, 76]
  const slots: { item: T; height: number; depth: number }[] = []
  items.slice(0, 5).forEach((item, i) => {
    const entry = { item, height: heights[i] ?? 70, depth: 5 - i }
    if (i === 0) slots.push(entry)
    else if (i % 2 === 1) slots.unshift(entry)
    else slots.push(entry)
  })
  return slots
}

const ARCHES = ['bg-brand', 'bg-brand-deep', 'bg-brand-soft', 'bg-brand-deep', 'bg-brand']

/**
 * Landing hero. Mobile: headline → CTAs → team skyline. Desktop: editorial
 * split with the skyline breaking the grid. The H1 (likely LCP on mobile) is
 * never hidden by animations; the skyline only animates with transforms.
 */
export function LandingHero({ section, ctx }: LandingSectionProps<'landingHero'>) {
  const c = section.content
  const centered = section.variant === 'centered'
  const people = c.showTeamCollage && !c.image ? ctx.cards.filter((card) => card.hero).slice(0, 5) : []
  const slots = skyline(people)
  const eager = ctx.index === 0

  return (
    <section
      id="inicio"
      aria-labelledby="landing-title"
      data-section="landingHero"
      className={cn(
        'relative overflow-x-clip pt-6 pb-12 md:pt-14 md:pb-20',
        section.responsive.hideOnMobile && 'max-md:hidden',
        section.responsive.hideOnDesktop && 'md:hidden',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_85%_25%,color-mix(in_oklab,var(--t-brand-soft)_50%,transparent),transparent_70%),radial-gradient(35%_35%_at_5%_5%,color-mix(in_oklab,var(--t-accent-warm)_20%,transparent),transparent_70%),radial-gradient(30%_30%_at_50%_100%,color-mix(in_oklab,var(--t-brand)_12%,transparent),transparent_70%)]"
      />
      <div
        className={cn(
          'relative mx-auto grid w-full max-w-wide gap-8 px-5 sm:px-8 md:gap-12 lg:px-10',
          centered ? 'justify-items-center text-center' : 'md:grid-cols-[1.08fr_1fr] md:items-center md:gap-8',
        )}
      >
        <div className={cn('relative z-10', centered && 'max-w-3xl')}>
          {c.eyebrow ? (
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-ink-muted uppercase backdrop-blur">
              <span aria-hidden="true" className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              {c.eyebrow}
            </p>
          ) : null}
          <h1
            id="landing-title"
            className="mt-5 text-[clamp(2.4rem,9vw,5.6rem)] leading-[0.88] font-black tracking-[-0.035em] text-balance text-ink uppercase italic"
          >
            {c.title}
          </h1>
          {c.titleScript ? (
            <p className="script mt-2 text-[clamp(2.4rem,8.5vw,5rem)] text-brand motion-safe:animate-[draw_1.2s_var(--ease-out)_0.2s_both]">
              {c.titleScript}
            </p>
          ) : null}
          {c.subtitle ? (
            <p
              className={cn(
                'mt-5 max-w-xl text-base leading-relaxed sm:text-lg text-pretty text-ink-muted md:text-xl motion-safe:animate-[rise_var(--dur-slow)_var(--ease-out)_0.35s_both]',
                centered && 'mx-auto',
              )}
            >
              {c.subtitle}
            </p>
          ) : null}
          <div
            className={cn(
              'mt-7 flex flex-col gap-3 sm:flex-row md:mt-9 sm:flex-wrap motion-safe:animate-[rise_var(--dur-slow)_var(--ease-out)_0.5s_both]',
              centered && 'sm:justify-center',
            )}
          >
            {c.primaryCta.label && c.primaryCta.href ? (
              <CtaLink href={c.primaryCta.href} placement="landing-hero" magnetic>
                {c.primaryCta.label}
              </CtaLink>
            ) : null}
            {c.secondaryCta.label && c.secondaryCta.href ? (
              <CtaLink href={c.secondaryCta.href} placement="landing-hero-secondary" tone="outline">
                {c.secondaryCta.label}
              </CtaLink>
            ) : null}
          </div>
          <Highlights items={c.highlights} centered={centered} className="max-md:hidden" />
        </div>

        {c.image ? (
          <div className="relative aspect-[4/5] w-full max-w-lg justify-self-center overflow-hidden rounded-panel shadow-lifted md:justify-self-end">
            <Image
              src={c.image.url}
              alt={c.image.alt}
              fill
              sizes="(min-width: 768px) 45vw, 90vw"
              loading={eager ? 'eager' : 'lazy'}
              fetchPriority={eager ? 'high' : 'auto'}
              className="object-cover"
              style={{ objectPosition: focalPosition(c.image) }}
            />
          </div>
        ) : slots.length > 0 ? (
          <Spotlight
            className={cn('relative w-full', centered ? 'max-w-3xl' : 'md:-mr-6')}
            style={{ '--px': '0', '--py': '0' } as CSSProperties}
          >
            <div aria-hidden="true" className="orbits absolute top-[2%] left-1/2 aspect-square w-[120%] -translate-x-1/2 opacity-90 motion-safe:animate-spin-slow [--t-on-brand:var(--t-brand)]" />
            <ul
              aria-label="Nuestro equipo"
              className="relative flex h-[clamp(300px,82vw,440px)] items-end justify-center md:h-[clamp(440px,42vw,600px)]"
            >
              {slots.map(({ item: card, height, depth }, i) => (
                <li
                  key={card.id}
                  className="group relative -mx-[3.5%] h-full w-[27%] max-w-[190px] motion-safe:animate-[lift_1s_var(--ease-out)_both]"
                  style={{ zIndex: depth, animationDelay: `${120 + Math.abs(i - Math.floor(slots.length / 2)) * 110}ms` }}
                >
                  <a
                    href={`/${card.slug}`}
                    aria-label={`Ver perfil de ${card.name}, ${card.professionalTitle}`}
                    className="absolute inset-x-0 bottom-0 block rounded-t-full focus-visible:outline-offset-4"
                    style={{ height: `${height}%` }}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grain absolute inset-x-0 bottom-0 h-[74%] overflow-hidden rounded-t-full shadow-lifted transition-transform duration-500 ease-out-expo group-hover:-translate-y-1.5',
                        ARCHES[i % ARCHES.length],
                      )}
                    />
                    <span className="absolute inset-0 transition-transform duration-500 ease-out-expo group-hover:-translate-y-2 md:[transform:translate3d(calc(var(--px)*var(--d)*-1px),0,0)]" style={{ '--d': String(depth * 3) } as CSSProperties}>
                      <Image
                        src={card.hero!.url}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 14vw, 28vw"
                        loading={eager && i === Math.floor(slots.length / 2) ? 'eager' : 'lazy'}
                        className="object-contain object-bottom drop-shadow-[0_18px_22px_rgb(20_8_40/0.3)]"
                      />
                    </span>
                    <span className="pointer-events-none absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 translate-y-1 rounded-full bg-ink px-3 py-1 text-[0.7rem] font-bold whitespace-nowrap text-canvas opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                      {card.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="absolute top-[6%] right-[2%] z-10 rounded-full bg-accent-warm text-brand-deep shadow-lifted md:top-[10%] md:right-[6%]">
              <RotatingBadge value={String(ctx.cards.length)} ring="especialistas · un equipo" />
            </div>
            <p className="sr-only">{`${ctx.cards.length} especialistas en el equipo`}</p>
          </Spotlight>
        ) : null}
        <Highlights items={c.highlights} centered={centered} className="-mt-4 md:hidden" />
      </div>
    </section>
  )
}

function Highlights({
  items,
  centered,
  className,
}: {
  items: LandingSectionProps<'landingHero'>['section']['content']['highlights']
  centered: boolean
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <ul className={cn('mt-10 flex flex-wrap gap-x-6 gap-y-3', centered && 'justify-center', className)} aria-label="Lo que nos distingue">
      {items.map((h, i) => (
        <li
          key={h.id}
          className="flex items-center gap-2.5 text-sm font-bold text-ink motion-safe:animate-[rise_var(--dur-slow)_var(--ease-out)_both]"
          style={{ animationDelay: `${650 + i * 90}ms` }}
        >
          <span className="grid size-9 place-items-center rounded-full bg-brand-mist text-brand">
            <Icon name={h.icon} size={18} />
          </span>
          {h.label}
        </li>
      ))}
    </ul>
  )
}
