import { digitsOnly, fillStatValue, whatsappUrl } from '@repo/domain'
import { ArrowRight, ArrowUpRight, Check, Clock, Mail, MapPin, Phone, Plus, Star } from 'lucide-react'
import Image from 'next/image'
import { SectionShell } from '@/components/profile/SectionShell'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { Icon } from '@/components/ui/Icon'
import { RichText } from '@/components/ui/RichText'
import { TrackedLink } from '@/components/ui/TrackedLink'
import { getLandingTestimonials } from '@/lib/data'
import { cn } from '@/lib/cn'
import { focalPosition, initials } from '@/lib/image'
import { CtaLink } from './CtaLink'
import type { LandingSectionProps } from './types'

const container = 'mx-auto w-full max-w-content px-5 sm:px-8'

function Heading({
  id,
  kicker,
  title,
  intro,
  align = 'start',
  tone = 'ink',
}: {
  id: string
  kicker?: string
  title?: string
  intro?: string
  align?: 'start' | 'center'
  tone?: 'ink' | 'onBrand'
}) {
  if (!title && !kicker) return null
  return (
    <header className={cn('reveal mb-12 max-w-2xl md:mb-16', align === 'center' && 'mx-auto text-center')}>
      {kicker ? <p className={cn('script text-[2.1rem] md:text-[2.8rem]', tone === 'onBrand' ? 'text-brand-soft' : 'text-brand')}>{kicker}</p> : null}
      {title ? (
        <h2 id={id} className="text-[clamp(2rem,5vw,3.4rem)] leading-[0.98] font-black tracking-[-0.03em] text-balance">
          {title}
        </h2>
      ) : null}
      {intro ? <p className={cn('mt-5 text-lg leading-relaxed text-pretty', tone === 'onBrand' ? 'text-on-brand/80' : 'text-ink-muted')}>{intro}</p> : null}
    </header>
  )
}

/* ---------------------------------- Stats --------------------------------- */

export function Stats({ section, ctx }: LandingSectionProps<'stats'>) {
  const items = section.content.items
  if (items.length === 0) return null
  const id = `h-${section.id}`
  const band = section.variant === 'band'
  return (
    <SectionShell section={section} labelledBy={section.content.title ? id : undefined} bleed className="py-6 md:py-10">
      <div className={container}>
        <div className={cn('relative overflow-hidden rounded-panel', band ? 'grain bg-brand px-6 py-10 text-on-brand shadow-glow md:px-12 md:py-14' : '')}>
          {band ? <div aria-hidden="true" className="orbits absolute -top-1/2 -right-1/4 aspect-square w-[80%] opacity-70" /> : null}
          {section.content.title ? (
            <h2 id={id} className="relative mb-8 text-center text-xl font-black">
              {section.content.title}
            </h2>
          ) : null}
          <dl className={cn('relative grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4', !band && 'gap-4')}>
            {items.map((item, i) => (
              <div
                key={item.id}
                className={cn('reveal flex flex-col-reverse', !band && 'rounded-card bg-surface p-6 shadow-soft', band && i > 0 && 'md:border-l md:border-on-brand/15 md:pl-6')}
              >
                <dt className={cn('mt-2 text-sm leading-snug font-bold', band ? 'text-on-brand/80' : 'text-ink-muted')}>
                  {item.label}
                  {item.note ? <span className="block text-xs font-normal opacity-80">{item.note}</span> : null}
                </dt>
                <dd className={cn('text-[clamp(2.6rem,6vw,4rem)] leading-none font-black tracking-tight italic', !band && 'text-brand')}>
                  {fillStatValue(item.value, { professionals: ctx.cards.length })}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------- Pain points ------------------------------ */

export function PainPoints({ section }: LandingSectionProps<'painPoints'>) {
  const c = section.content
  if (c.items.length === 0) return null
  const id = `h-${section.id}`
  const cards = section.variant === 'cards'
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <Heading id={id} kicker={c.kicker} title={c.title} intro={c.intro} align={section.style.align} />
        <ul className={cn(cards ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-x-10 gap-y-6 md:grid-cols-2')}>
          {c.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                'reveal group flex gap-4',
                cards &&
                  'flex-col rounded-card border border-transparent bg-surface p-7 shadow-soft transition-[transform,border-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:border-brand/25 hover:shadow-lifted',
              )}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-mist text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-on-brand">
                <Icon name={item.icon} size={22} />
              </span>
              <div>
                <h3 className="text-lg leading-tight font-black">{item.title}</h3>
                {item.description ? <p className="mt-2 leading-relaxed text-ink-muted">{item.description}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

/* -------------------------------- Services -------------------------------- */

export function ServicesOverview({ section }: LandingSectionProps<'servicesOverview'>) {
  const c = section.content
  if (c.items.length === 0) return null
  const id = `h-${section.id}`
  const bento = section.variant === 'bento'
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <Heading id={id} kicker={c.kicker} title={c.title} intro={c.intro} align={section.style.align} />
        <ul className={cn('grid gap-4 sm:grid-cols-2', bento ? 'lg:auto-rows-[minmax(220px,auto)] lg:grid-cols-3' : 'lg:grid-cols-3')}>
          {c.items.map((item, i) => {
            const featured = bento && i === 0
            // Bento: after the 2×2 featured card and its two side cards, rows hold 3
            // cards; stretch the last one so the grid never ends with a hole.
            const leftover = bento && c.items.length > 3 ? (c.items.length - 3) % 3 : 0
            const stretch = i === c.items.length - 1 && leftover === 2 ? 'lg:col-span-2' : i === c.items.length - 1 && leftover === 1 ? 'lg:col-span-3' : ''
            const inner = (
              <>
                {featured ? (
                  <>
                    <div aria-hidden="true" className="orbits absolute -right-1/3 -bottom-1/2 aspect-square w-[110%] opacity-70" />
                    <span aria-hidden="true" className="absolute top-1/2 right-[8%] hidden -translate-y-[60%] text-on-brand/[0.13] lg:block">
                      <Icon name={item.icon} size={260} />
                    </span>
                  </>
                ) : null}
                <span
                  className={cn(
                    'relative grid shrink-0 place-items-center rounded-2xl',
                    featured ? 'size-16 bg-on-brand/12 text-on-brand' : 'size-14 bg-brand text-on-brand',
                  )}
                >
                  <Icon name={item.icon} size={featured ? 30 : 26} />
                </span>
                <div className="relative mt-auto pt-10">
                  {item.tag ? (
                    <p className={cn('mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold', featured ? 'bg-on-brand/12 text-on-brand' : 'bg-brand-mist text-brand')}>
                      {item.tag}
                    </p>
                  ) : null}
                  <h3 className={cn('leading-tight font-black tracking-tight', featured ? 'text-[clamp(1.8rem,3.5vw,2.6rem)]' : 'text-2xl')}>{item.title}</h3>
                  {item.description ? (
                    <p className={cn('mt-3 leading-relaxed', featured ? 'max-w-md text-lg text-on-brand/80' : 'text-ink-muted')}>{item.description}</p>
                  ) : null}
                  {item.href ? (
                    <span className={cn('mt-5 inline-flex items-center gap-1.5 text-sm font-black tracking-wide uppercase', featured ? 'text-on-brand' : 'text-brand')}>
                      Conocer más
                      <ArrowRight aria-hidden="true" size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  ) : null}
                </div>
                <span
                  aria-hidden="true"
                  className={cn('script pointer-events-none absolute top-2 right-5 text-[5.5rem] leading-none', featured ? 'text-on-brand/10' : 'text-brand/[0.07]')}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </>
            )
            const classes = cn(
              'group relative flex h-full flex-col overflow-hidden rounded-card p-7 transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 md:p-8',
              featured ? 'grain bg-brand text-on-brand shadow-glow' : 'bg-surface shadow-soft hover:shadow-lifted',
            )
            return (
              <li key={item.id} className={cn('reveal', featured && 'sm:col-span-2 lg:row-span-2', stretch)}>
                {item.href ? (
                  item.href.startsWith('/') ? (
                    <a href={item.href} className={classes}>
                      {inner}
                    </a>
                  ) : (
                    <a href={item.href} className={classes}>
                      {inner}
                    </a>
                  )
                ) : (
                  <div className={classes}>{inner}</div>
                )}
              </li>
            )
          })}
        </ul>
        {c.cta.label && c.cta.href ? (
          <div className="mt-12 flex justify-center">
            <CtaLink href={c.cta.href} placement="landing-services" magnetic>
              {c.cta.label}
            </CtaLink>
          </div>
        ) : null}
      </div>
    </SectionShell>
  )
}

/* --------------------------------- Process -------------------------------- */

export function Process({ section }: LandingSectionProps<'process'>) {
  const c = section.content
  if (c.items.length === 0) return null
  const id = `h-${section.id}`
  const steps = section.variant === 'steps'
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <Heading id={id} kicker={c.kicker} title={c.title} intro={c.intro} align={section.style.align} />
        <ol
          className={cn(
            'relative grid gap-10',
            steps ? 'md:grid-cols-4 md:gap-6' : 'max-w-2xl',
            steps
              ? 'before:absolute before:top-8 before:left-8 before:h-[calc(100%-4rem)] before:border-l-2 before:border-dashed before:border-brand/25 md:before:top-8 md:before:right-8 md:before:left-8 md:before:h-0 md:before:border-t-2 md:before:border-l-0'
              : 'before:absolute before:top-8 before:left-8 before:h-[calc(100%-4rem)] before:border-l-2 before:border-dashed before:border-brand/25',
          )}
        >
          {c.items.map((item, i) => (
            <li key={item.id} className={cn('reveal relative flex gap-5', steps && 'md:flex-col')}>
              <span className="relative grid size-16 shrink-0 place-items-center rounded-full bg-brand text-on-brand shadow-glow ring-8 ring-canvas">
                <span className="script text-4xl leading-none">{i + 1}</span>
              </span>
              <div className="pt-2">
                <h3 className="text-xl leading-tight font-black">{item.title}</h3>
                {item.description ? <p className="mt-2 leading-relaxed text-ink-muted">{item.description}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  )
}

/* ------------------------------ Team showcase ----------------------------- */

export function TeamShowcase({ section, ctx }: LandingSectionProps<'teamShowcase'>) {
  const c = section.content
  const cards = ctx.cards.slice(0, c.maxProfessionals)
  if (cards.length === 0) return null
  const id = `h-${section.id}`
  const rail = section.variant === 'rail'
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Heading id={id} kicker={c.kicker} title={c.title} intro={c.intro} />
          <div className="reveal mb-12 shrink-0 md:mb-16">
            <CtaLink href="/equipo" placement="landing-team" tone="outline">
              {c.ctaLabel || ctx.site.copy.switcherTitle}
            </CtaLink>
          </div>
        </div>
      </div>
      <ul
        className={cn(
          rail
            ? 'no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:px-8 lg:px-[max(2.5rem,calc((100vw-72rem)/2+2rem))]'
            : `${container} grid gap-6 sm:grid-cols-2 lg:grid-cols-4`,
        )}
        aria-label="Profesionales del equipo"
      >
        {cards.map((card, i) => (
          <li key={card.id} className={cn('reveal', rail && 'w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[23%]')}>
            <a href={`/${card.slug}`} className="group block rounded-panel focus-visible:outline-offset-8">
              <div className="relative aspect-[4/5]">
                <div
                  aria-hidden="true"
                  className={cn(
                    'grain absolute inset-x-0 bottom-0 top-[18%] overflow-hidden rounded-t-full rounded-b-card transition-colors duration-500',
                    i % 2 === 0 ? 'bg-brand group-hover:bg-brand-deep' : 'bg-brand-deep group-hover:bg-brand',
                  )}
                >
                  <div className="orbits absolute -top-1/4 left-1/2 aspect-square w-[140%] -translate-x-1/2 opacity-70" />
                </div>
                {card.hero ? (
                  <Image
                    src={card.hero.url}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 44vw, 78vw"
                    className={cn(
                      'object-bottom transition-transform duration-700 ease-out-expo group-hover:-translate-y-2 group-hover:scale-[1.03]',
                      card.hero.hasAlpha ? 'object-contain drop-shadow-[0_24px_30px_rgb(20_8_40/0.35)]' : 'rounded-t-full object-cover',
                    )}
                    style={card.hero.hasAlpha ? undefined : { objectPosition: focalPosition(card.hero) }}
                  />
                ) : (
                  <span className="absolute inset-x-[15%] bottom-[10%] grid aspect-square place-items-center rounded-full bg-brand-soft text-4xl font-black text-brand-deep">
                    {initials(card.name)}
                  </span>
                )}
                <span className="absolute right-4 bottom-4 grid size-11 place-items-center rounded-full bg-surface text-brand shadow-soft transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight size={20} aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-5 text-xl leading-none font-black tracking-tight uppercase italic">{card.name}</h3>
              <p className="script mt-1 text-[1.9rem] leading-tight text-brand">{card.scriptTitle || card.professionalTitle}</p>
            </a>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}

/* ------------------------------ Testimonials ------------------------------ */

export async function TestimonialsWall({ section, ctx }: LandingSectionProps<'testimonialsWall'>) {
  const c = section.content
  const items = await getLandingTestimonials(c.maxItems)
  if (items.length === 0) return null
  const id = `h-${section.id}`
  const marquee = section.variant === 'marquee'
  const card = (t: (typeof items)[number], i: number, decorative = false) => (
    <figure
      key={`${t.id}-${decorative ? 'dup' : 'o'}`}
      aria-hidden={decorative || undefined}
      className={cn(
        'reveal relative mb-5 break-inside-avoid rounded-card p-7 shadow-soft',
        i === 0 && !marquee ? 'grain bg-brand text-on-brand shadow-glow' : 'bg-surface',
        marquee && 'mb-0 w-[min(84vw,380px)] shrink-0',
      )}
    >
      <div className="mb-4 flex min-h-6 items-center justify-between gap-3">
        {t.rating != null ? (
          <p className="flex gap-0.5" role="img" aria-label={`Calificación: ${t.rating} de 5`}>
            {Array.from({ length: 5 }, (_, s) => (
              <Star key={s} size={18} aria-hidden="true" strokeWidth={1.5} className={s < t.rating! ? 'fill-accent-warm text-accent-warm' : 'opacity-25'} />
            ))}
          </p>
        ) : (
          <span />
        )}
        {t.sourceLabel ? (
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-bold', i === 0 && !marquee ? 'bg-on-brand/15 text-on-brand' : 'bg-canvas text-ink-muted')}>
            {t.sourceLabel}
          </span>
        ) : null}
      </div>
      <blockquote className={cn('leading-relaxed text-pretty', i === 0 && !marquee ? 'text-xl' : 'text-[1.05rem]')}>“{t.content}”</blockquote>
      <figcaption className={cn('mt-6 flex items-center gap-3 border-t pt-5', i === 0 && !marquee ? 'border-on-brand/15' : 'border-line')}>
        <span aria-hidden="true" className={cn('grid size-10 shrink-0 place-items-center rounded-full text-sm font-black', i === 0 && !marquee ? 'bg-on-brand/15' : 'bg-brand-mist text-brand')}>
          {initials(t.authorName)}
        </span>
        <span className="min-w-0">
          <span className="block font-black">{t.authorName}</span>
          {t.authorDetail ? <span className="block text-sm opacity-75">{t.authorDetail}</span> : null}
        </span>
      </figcaption>
    </figure>
  )
  return (
    <SectionShell section={section} labelledBy={id} className="overflow-x-clip">
      <div className={container}>
        <Heading id={id} kicker={c.kicker} title={c.title || ctx.site.copy.testimonialsTitle} intro={c.subtitle} align="center" />
      </div>
      {marquee ? (
        <div className="group relative [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max gap-5 motion-safe:animate-[marquee_60s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:overflow-x-auto">
            {items.map((t, i) => card(t, i))}
            {items.map((t, i) => card(t, i, true))}
          </div>
        </div>
      ) : (
        <div className={cn(container, 'columns-1 gap-5 sm:columns-2 lg:columns-3')}>{items.map((t, i) => card(t, i))}</div>
      )}
      {c.addReviewUrl ? (
        <div className="mt-8 flex justify-center">
          <a href={c.addReviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-black tracking-wide text-brand uppercase hover:underline">
            <Plus size={18} aria-hidden="true" /> {ctx.site.copy.addReviewLabel}
          </a>
        </div>
      ) : null}
    </SectionShell>
  )
}

/* --------------------------------- Values --------------------------------- */

export function Values({ section }: LandingSectionProps<'values'>) {
  const c = section.content
  if (c.items.length === 0) return null
  const id = `h-${section.id}`
  const split = section.variant === 'split'
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={cn(container, split && 'grid gap-10 md:grid-cols-[0.9fr_1.1fr]')}>
        <div className={cn(split && 'md:sticky md:top-28 md:self-start')}>
          <Heading id={id} kicker={c.kicker} title={c.title} intro={c.intro} align={split ? 'start' : section.style.align} />
        </div>
        <ul className={cn('grid gap-4', split ? '' : 'sm:grid-cols-2 lg:grid-cols-4')}>
          {c.items.map((item) => (
            <li key={item.id} className="reveal flex gap-4 rounded-card bg-surface/80 p-6 shadow-soft backdrop-blur sm:flex-col">
              <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-brand/30 text-brand">
                <Icon name={item.icon} size={22} />
              </span>
              <div>
                <h3 className="text-lg font-black">{item.title}</h3>
                {item.description ? <p className="mt-1.5 leading-relaxed text-ink-muted">{item.description}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

/* ---------------------------------- Plans --------------------------------- */

export function Plans({ section }: LandingSectionProps<'plans'>) {
  const c = section.content
  if (c.items.length === 0) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={container}>
        <Heading id={id} kicker={c.kicker} title={c.title} intro={c.intro} align="center" />
        <ul className={cn('grid items-stretch gap-5', c.items.length >= 3 ? 'md:grid-cols-3' : 'mx-auto max-w-3xl md:grid-cols-2')}>
          {c.items.map((plan) => {
            const features = plan.features.split('\n').map((f) => f.trim()).filter(Boolean)
            return (
              <li
                key={plan.id}
                className={cn(
                  'reveal relative flex flex-col rounded-panel p-8 md:p-9',
                  plan.highlighted ? 'grain bg-brand text-on-brand shadow-glow md:-my-4 md:py-12' : 'bg-surface shadow-soft',
                )}
              >
                {plan.highlighted ? (
                  <p className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-warm px-4 py-1 text-xs font-black tracking-widest text-brand-deep uppercase shadow-soft">
                    Recomendado
                  </p>
                ) : null}
                <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                {plan.price ? (
                  <p className="mt-4 flex items-baseline gap-2">
                    <span className="text-[2.6rem] leading-none font-black tracking-tight italic">{plan.price}</span>
                    {plan.period ? <span className="text-sm opacity-75">{plan.period}</span> : null}
                  </p>
                ) : null}
                {plan.description ? <p className={cn('mt-4 leading-relaxed', plan.highlighted ? 'text-on-brand/80' : 'text-ink-muted')}>{plan.description}</p> : null}
                {features.length > 0 ? (
                  <ul className="mt-6 space-y-3 border-t border-current/10 pt-6">
                    {features.map((f) => (
                      <li key={f} className="flex gap-3 text-[0.98rem]">
                        <Check aria-hidden="true" size={20} className={cn('shrink-0', plan.highlighted ? 'text-accent-warm' : 'text-brand')} />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {plan.cta.label && plan.cta.href ? (
                  <div className="mt-auto pt-8">
                    <CtaLink href={plan.cta.href} placement={`landing-plan-${plan.id}`} tone={plan.highlighted ? 'light' : 'brand'} className="w-full">
                      {plan.cta.label}
                    </CtaLink>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
        {c.note ? <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-ink-muted">{c.note}</p> : null}
      </div>
    </SectionShell>
  )
}

/* ----------------------------------- FAQ ---------------------------------- */

export function Faq({ section }: LandingSectionProps<'faq'>) {
  const c = section.content
  if (c.items.length === 0) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={cn(container, 'grid gap-10 md:grid-cols-[0.8fr_1.2fr]')}>
        <Heading id={id} kicker={c.kicker} title={c.title || 'Preguntas frecuentes'} />
        <div className="divide-y divide-line rounded-card bg-surface shadow-soft">
          {c.items.map((item) => (
            <details key={item.id} className="group px-6 md:px-8 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-black">
                {item.question}
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-mist text-brand transition-transform duration-300 group-open:rotate-45">
                  <Plus size={18} />
                </span>
              </summary>
              <div className="pb-6 text-ink-muted [&_p]:text-base">
                <RichText value={item.answer} className="text-base" />
              </div>
            </details>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ---------------------------------- Logos --------------------------------- */

export function Logos({ section }: LandingSectionProps<'logos'>) {
  const c = section.content
  if (c.items.length === 0) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={c.title ? id : undefined} className="py-10 md:py-14">
      <div className={container}>
        {c.title ? (
          <h2 id={id} className="mb-8 text-center text-sm font-bold tracking-[0.22em] text-ink-muted uppercase">
            {c.title}
          </h2>
        ) : null}
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {c.items.map((logo) => {
            const content = logo.image ? (
              <Image src={logo.image.url} alt={logo.name} width={logo.image.width} height={logo.image.height} sizes="160px" className="h-12 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0" />
            ) : (
              <span className="text-lg font-black tracking-tight text-ink-muted">{logo.name}</span>
            )
            return (
              <li key={logo.id}>
                {logo.href ? (
                  <a href={logo.href} target="_blank" rel="noopener noreferrer" aria-label={logo.name}>
                    {content}
                  </a>
                ) : (
                  content
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </SectionShell>
  )
}

/* ------------------------------- CTA banner ------------------------------- */

export function CtaBanner({ section }: LandingSectionProps<'ctaBanner'>) {
  const c = section.content
  if (!c.title) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id} bleed className="py-10 md:py-16">
      <div className={container}>
        <div
          className={cn(
            'grain relative overflow-hidden rounded-panel bg-brand-deep px-6 py-14 text-on-brand md:px-14 md:py-20',
            section.variant === 'split' ? 'grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center' : 'text-center',
          )}
        >
          <div aria-hidden="true" className="orbits absolute top-1/2 left-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 opacity-70 motion-safe:animate-spin-slow md:w-[85%]" />
          <div aria-hidden="true" className="absolute -top-24 -right-24 size-72 rounded-full bg-brand blur-3xl" />
          <div className="relative">
            {c.script ? <p className="script text-[2.4rem] text-brand-soft md:text-[3.2rem]">{c.script}</p> : null}
            <h2 id={id} className={cn('mt-1 text-[clamp(2rem,5vw,3.6rem)] leading-[0.98] font-black tracking-[-0.03em] text-balance', section.variant !== 'split' && 'mx-auto max-w-3xl')}>
              {c.title}
            </h2>
            {c.description ? <p className={cn('mt-5 max-w-xl text-lg text-on-brand/80', section.variant !== 'split' && 'mx-auto')}>{c.description}</p> : null}
          </div>
          <div className={cn('relative flex flex-col gap-3 sm:flex-row sm:flex-wrap', section.variant === 'split' ? 'md:justify-end' : 'mt-10 justify-center')}>
            {c.primaryCta.label && c.primaryCta.href ? (
              <CtaLink href={c.primaryCta.href} tone="light" placement="landing-cta" magnetic>
                {c.primaryCta.label}
              </CtaLink>
            ) : null}
            {c.secondaryCta.label && c.secondaryCta.href ? (
              <CtaLink href={c.secondaryCta.href} tone="ghostOnBrand" placement="landing-cta-secondary">
                {c.secondaryCta.label}
              </CtaLink>
            ) : null}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

/* --------------------------------- Contact -------------------------------- */

export function ContactBlock({ section, ctx }: LandingSectionProps<'contactBlock'>) {
  const c = section.content
  const org = ctx.site.organization
  const id = `h-${section.id}`
  const channels = [
    digitsOnly(org.whatsapp).length >= 8
      ? { key: 'whatsapp', label: 'WhatsApp', value: org.whatsapp, href: whatsappUrl(org.whatsapp, c.whatsappMessage || undefined), icon: <WhatsAppIcon size={22} />, external: true, primary: true }
      : null,
    org.email ? { key: 'email', label: 'Email', value: org.email, href: `mailto:${org.email}`, icon: <Mail size={22} aria-hidden="true" />, external: false, primary: false } : null,
    org.phone ? { key: 'phone', label: 'Teléfono', value: org.phone, href: `tel:${digitsOnly(org.phone)}`, icon: <Phone size={22} aria-hidden="true" />, external: false, primary: false } : null,
  ].filter((x) => x !== null)
  const place = [org.address, org.city].filter(Boolean).join(', ')
  if (channels.length === 0 && !place) return null
  return (
    <SectionShell section={section} labelledBy={id}>
      <div className={cn(container, 'grid gap-10 md:grid-cols-[1fr_1fr] md:items-start')}>
        <div>
          <Heading id={id} kicker={c.kicker} title={c.title || ctx.site.copy.contactTitle} intro={c.intro} />
          <ul className="grid gap-3">
            {channels.map((ch) => (
              <li key={ch.key} className="reveal">
                <TrackedLink
                  href={ch.href}
                  event="social_click"
                  eventProps={{ network: ch.key, placement: 'landing-contact' }}
                  external={ch.external}
                  className={cn(
                    'group flex min-h-16 items-center gap-4 rounded-card p-5 transition-[transform,box-shadow,background-color] duration-300 ease-out-expo hover:-translate-y-0.5',
                    ch.primary ? 'bg-brand text-on-brand shadow-glow hover:bg-brand-deep' : 'bg-surface shadow-soft hover:shadow-lifted',
                  )}
                >
                  <span className={cn('grid size-12 shrink-0 place-items-center rounded-full', ch.primary ? 'bg-on-brand/15' : 'bg-brand-mist text-brand')}>{ch.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm opacity-75">{ch.label}</span>
                    <span className="block truncate text-lg font-black">{ch.value}</span>
                  </span>
                  <ArrowUpRight size={20} aria-hidden="true" className="opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </TrackedLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal grain relative overflow-hidden rounded-panel bg-brand-mist p-8 md:mt-24 md:p-10">
          <div aria-hidden="true" className="orbits absolute -right-1/3 -bottom-1/3 aspect-square w-[110%] [--t-on-brand:var(--t-brand)]" />
          <p className="script relative text-4xl text-brand">{ctx.site.organizationName}</p>
          <dl className="relative mt-6 space-y-5">
            {place ? (
              <div className="flex gap-3">
                <dt>
                  <MapPin size={22} aria-label="Dirección" className="text-brand" />
                </dt>
                <dd className="font-bold">{place}</dd>
              </div>
            ) : null}
            {org.hours ? (
              <div className="flex gap-3">
                <dt>
                  <Clock size={22} aria-label="Horario" className="text-brand" />
                </dt>
                <dd className="font-bold">{org.hours}</dd>
              </div>
            ) : null}
          </dl>
          {org.mapsUrl ? (
            <a href={org.mapsUrl} target="_blank" rel="noopener noreferrer" className="relative mt-8 inline-flex min-h-12 items-center gap-2 rounded-button bg-brand px-6 font-black text-on-brand uppercase">
              Cómo llegar <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------- Rich text -------------------------------- */

export function LandingRichText({ section }: LandingSectionProps<'landingRichText'>) {
  if (!section.content.body) return null
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={section.content.title ? id : undefined}>
      <div className={cn('mx-auto w-full max-w-prose px-5 sm:px-8', section.variant === 'highlight' && 'rounded-panel bg-brand-mist p-8 md:p-12')}>
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

/* -------------------------------- Gallery --------------------------------- */

export function LandingGallery({ section }: LandingSectionProps<'landingGallery'>) {
  const { images, title } = section.content
  if (images.length === 0) return null
  const id = `h-${section.id}`
  const strip = section.variant === 'strip'
  return (
    <SectionShell section={section} labelledBy={title ? id : undefined}>
      <div className={container}>
        {title ? (
          <h2 id={id} className="mb-10 text-[clamp(2rem,5vw,3rem)] font-black tracking-tight">
            {title}
          </h2>
        ) : null}
        <ul className={cn(strip ? 'no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5' : 'columns-2 gap-4 md:columns-3 [&>li]:mb-4')}>
          {images.map((image, i) => (
            <li key={`${image.url}-${i}`} className={cn('reveal overflow-hidden rounded-card bg-brand-mist', strip && 'w-[78%] shrink-0 snap-center sm:w-[40%]')}>
              <Image src={image.url} alt={image.alt} width={image.width} height={image.height} sizes={strip ? '(min-width: 640px) 40vw, 78vw' : '(min-width: 768px) 33vw, 50vw'} className="h-auto w-full object-cover" style={{ objectPosition: focalPosition(image) }} />
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}
