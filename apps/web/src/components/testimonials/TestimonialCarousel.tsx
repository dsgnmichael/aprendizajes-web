'use client'

import type { TestimonialDTO, TestimonialFeed } from '@repo/domain'
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'
import { AnimatePresence, LazyMotion, m, useReducedMotion, type PanInfo } from 'motion/react'
import Image from 'next/image'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { GoogleIcon } from '@/components/ui/BrandIcons'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { loadMotionFeatures } from '@/lib/motion'
import { initials } from '@/lib/image'

const ORIGIN_LABEL: Record<TestimonialDTO['origin'], string> = {
  manual: 'Testimonio',
  google_places: 'Reseña de Google',
  google_business_profile: 'Reseña de Google',
}

const CLAMP_CHARS = 260

/**
 * Testimonial carousel. Keyboard (←/→), swipe, buttons and dots; long texts
 * expand in place instead of being cut. Google reviews keep their original
 * text plus the attribution required by Google (author name/photo/link and
 * the Google mark). When `liveSlug` is set, the feed upgrades itself with
 * live Google Places reviews once the section scrolls into view.
 */
export function TestimonialCarousel({
  initialFeed,
  liveSlug,
  showSourceBadge,
  showAverage,
  showTotal,
  addReview,
  title,
  disclosure,
}: {
  initialFeed: TestimonialFeed
  liveSlug?: string
  showSourceBadge: boolean
  showAverage: boolean
  showTotal: boolean
  addReview?: { href: string; label: string }
  title: string
  /** How Google reviews are ordered/filtered (required by Google policies). */
  disclosure: string
}) {
  const [feed, setFeed] = useState(initialFeed)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [expanded, setExpanded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const regionId = useId()
  const items = feed.items
  const count = items.length

  // Lazy upgrade with live Google Places reviews (not cached server-side).
  useEffect(() => {
    if (!liveSlug || !rootRef.current) return
    const el = rootRef.current
    const controller = new AbortController()
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        observer.disconnect()
        fetch(`/api/reviews/${encodeURIComponent(liveSlug)}`, { signal: controller.signal })
          .then((res) => (res.ok ? (res.json() as Promise<TestimonialFeed>) : null))
          .then((live) => {
            if (live && live.items.length > 0) setFeed(live)
          })
          .catch(() => undefined)
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      controller.abort()
    }
  }, [liveSlug])

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return
      setDirection(delta)
      setExpanded(false)
      setIndex((i) => (i + delta + count) % count)
      track('testimonial_interaction', { action: delta > 0 ? 'next' : 'prev' })
    },
    [count],
  )

  if (count === 0) return null
  const current = items[Math.min(index, count - 1)]!
  const long = current.content.length > CLAMP_CHARS
  const isGoogle = current.origin !== 'manual'
  const offset = reduce ? 0 : 40

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <div
        ref={rootRef}
        role="region"
        aria-roledescription="carrusel"
        aria-label={title}
        className="relative"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
      >
        {(showAverage && feed.summary.averageRating != null) || (showTotal && feed.summary.totalReviews != null) ? (
          <Summary feed={feed} showAverage={showAverage} showTotal={showTotal} />
        ) : null}

        <div className="relative">
          {/* Decorative stacked cards behind the active one */}
          {count > 1 ? (
            <>
              <div aria-hidden="true" className="absolute inset-x-6 -bottom-3 top-6 rounded-card bg-surface/60 shadow-soft md:inset-x-10" />
              <div aria-hidden="true" className="absolute inset-x-3 -bottom-1.5 top-3 rounded-card bg-surface/80 shadow-soft md:inset-x-5" />
            </>
          ) : null}

          <div id={regionId} aria-live="polite" className="relative min-h-[260px] overflow-hidden rounded-card bg-surface shadow-lifted">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <m.figure
                key={current.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * offset }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -offset }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                drag={count > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info: PanInfo) => {
                  if (info.offset.x < -60 || info.velocity.x < -400) go(1)
                  else if (info.offset.x > 60 || info.velocity.x > 400) go(-1)
                }}
                className="relative flex h-full cursor-grab flex-col gap-5 p-6 select-text active:cursor-grabbing sm:p-9"
                aria-roledescription="testimonio"
                aria-label={`${index + 1} de ${count}`}
              >
                <Quote aria-hidden="true" className="absolute top-5 right-6 size-14 text-brand/10 sm:size-20" strokeWidth={1.2} />
                {current.rating != null ? <Stars rating={current.rating} /> : null}
                <blockquote
                  className={cn(
                    'relative text-[1.08rem] leading-relaxed text-pretty text-ink sm:text-[1.2rem]',
                    long && !expanded && 'line-clamp-5',
                  )}
                  lang={undefined}
                >
                  “{current.content}”
                </blockquote>
                {long ? (
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded((v) => !v)
                      track('testimonial_interaction', { action: 'expand' })
                    }}
                    aria-expanded={expanded}
                    className="-mt-2 self-start rounded-full py-2 text-sm font-bold text-brand underline-offset-4 hover:underline"
                  >
                    {expanded ? 'Ver menos' : 'Leer completo'}
                  </button>
                ) : null}
                <figcaption className="mt-auto flex items-center gap-3 border-t border-line pt-5">
                  <Avatar item={current} />
                  <div className="min-w-0 flex-1">
                    {current.authorUrl ? (
                      <a href={current.authorUrl} target="_blank" rel="noopener noreferrer" className="block truncate font-black text-brand-deep hover:underline">
                        {current.authorName}
                      </a>
                    ) : (
                      <p className="truncate font-black text-brand-deep">{current.authorName}</p>
                    )}
                    <p className="truncate text-sm text-ink-muted">
                      {[current.authorDetail, current.relativeTime ?? formatDate(current.date)].filter(Boolean).join(' · ')}
                      {current.translated ? ' · Traducido por Google' : ''}
                    </p>
                  </div>
                  {showSourceBadge || isGoogle ? (
                    current.sourceUrl ? (
                      <a
                        href={current.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink"
                      >
                        {isGoogle ? <GoogleIcon size={14} /> : null}
                        {isGoogle ? 'Ver en Google' : (current.sourceLabel ?? ORIGIN_LABEL[current.origin])}
                      </a>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink-muted">
                        {isGoogle ? <GoogleIcon size={14} /> : null}
                        {current.sourceLabel ?? ORIGIN_LABEL[current.origin]}
                      </span>
                    )
                  ) : null}
                </figcaption>
              </m.figure>
            </AnimatePresence>
          </div>
        </div>

        {count > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Elegir testimonio">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDirection(i > index ? 1 : -1)
                    setExpanded(false)
                    setIndex(i)
                  }}
                  aria-label={`Testimonio ${i + 1} de ${count}: ${item.authorName}`}
                  aria-current={i === index ? 'true' : undefined}
                  aria-controls={regionId}
                  className="group grid size-8 place-items-center rounded-full"
                >
                  <span
                    className={cn(
                      'block h-2 rounded-full transition-all duration-300 ease-out-expo',
                      i === index ? 'w-6 bg-brand' : 'w-2 bg-brand/25 group-hover:bg-brand/50',
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <NavButton label="Testimonio anterior" onClick={() => go(-1)} controls={regionId}>
                <ChevronLeft size={20} aria-hidden="true" />
              </NavButton>
              <NavButton label="Siguiente testimonio" onClick={() => go(1)} controls={regionId}>
                <ChevronRight size={20} aria-hidden="true" />
              </NavButton>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
          {feed.attributions.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="inline-flex items-center gap-1.5">
                <GoogleIcon size={14} />
                {/* Google Maps text attribution: Roboto/Arial, #5E5E5E, unmodified capitalization. */}
                <span style={{ fontFamily: 'Roboto, Arial, sans-serif', color: '#5E5E5E', fontSize: 13 }}>Google Maps</span>
              </p>
              <p>{disclosure}</p>
            </div>
          ) : (
            <span />
          )}
          {addReview ? (
            <a href={addReview.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-bold tracking-wide text-brand uppercase hover:underline">
              + {addReview.label}
            </a>
          ) : null}
        </div>
      </div>
    </LazyMotion>
  )
}

function NavButton({ label, onClick, controls, children }: { label: string; onClick: () => void; controls: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls={controls}
      onClick={onClick}
      className="grid size-12 place-items-center rounded-full bg-brand text-on-brand shadow-soft transition-[transform,background-color] duration-200 hover:bg-brand-deep active:scale-90"
    >
      {children}
    </button>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <p className="flex items-center gap-0.5" role="img" aria-label={`Calificación: ${rating} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          size={20}
          strokeWidth={1.5}
          className={i < Math.round(rating) ? 'fill-accent-warm text-accent-warm' : 'text-line'}
        />
      ))}
    </p>
  )
}

function Avatar({ item }: { item: TestimonialDTO }) {
  if (item.authorPhotoUrl) {
    return (
      <Image
        src={item.authorPhotoUrl}
        alt=""
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-mist text-sm font-black text-brand">
      {initials(item.authorName)}
    </span>
  )
}

function Summary({ feed, showAverage, showTotal }: { feed: TestimonialFeed; showAverage: boolean; showTotal: boolean }) {
  const { averageRating, totalReviews, placeUrl } = feed.summary
  return (
    <div className="mb-6 flex items-center gap-3">
      {showAverage && averageRating != null ? (
        <p className="text-4xl leading-none font-black tracking-tight text-brand-deep">{averageRating.toFixed(1)}</p>
      ) : null}
      <div className="text-sm leading-tight">
        {showAverage && averageRating != null ? <Stars rating={averageRating} /> : null}
        {showTotal && totalReviews != null ? (
          placeUrl ? (
            <a href={placeUrl} target="_blank" rel="noopener noreferrer" className="text-ink-muted underline-offset-2 hover:underline">
              {totalReviews} reseñas en Google
            </a>
          ) : (
            <span className="text-ink-muted">{totalReviews} reseñas en Google</span>
          )
        ) : null}
      </div>
    </div>
  )
}

function formatDate(date?: string) {
  if (!date) return ''
  const d = new Date(`${date}T12:00:00`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}
