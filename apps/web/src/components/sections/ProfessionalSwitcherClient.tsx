'use client'

import type { ProfessionalCard } from '@repo/domain'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { focalPosition, initials } from '@/lib/image'

/**
 * Avatar rail to move between published professionals.
 * - Native horizontal scroll with snap (touch swipe) + arrow buttons that only
 *   appear when the rail overflows.
 * - Roving focus with ←/→/Home/End.
 * - Profiles are static documents: navigation is a regular page load that the
 *   browser animates with cross-document View Transitions (photo and name
 *   morph between professionals) and pre-fetches via Speculation Rules.
 */
export function ProfessionalSwitcherClient({
  cards,
  activeSlug,
  showNames,
  label,
}: {
  cards: ProfessionalCard[]
  activeSlug: string
  showNames: boolean
  label: string
}) {
  const railRef = useRef<HTMLUListElement>(null)
  const [overflow, setOverflow] = useState({ start: false, end: false })

  const measure = useCallback(() => {
    const el = railRef.current
    if (!el) return
    setOverflow({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    measure()
    // Bring the active avatar into view without moving the page.
    const active = el.querySelector<HTMLElement>('[aria-current="page"]')
    if (active) el.scrollTo({ left: active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2 })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, activeSlug])

  const scrollBy = (dir: 1 | -1) => {
    const el = railRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' })
  }

  return (
    <nav aria-label={label} className="relative">
      {overflow.start ? <ArrowButton side="start" onClick={() => scrollBy(-1)} /> : null}
      <ul
        ref={railRef}
        onScroll={measure}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 py-3 sm:gap-5 md:justify-center-safe"
        onKeyDown={(e) => {
          const links = Array.from(railRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])
          const i = links.indexOf(document.activeElement as HTMLAnchorElement)
          if (i < 0) return
          const next =
            e.key === 'ArrowRight' ? links[i + 1] : e.key === 'ArrowLeft' ? links[i - 1] : e.key === 'Home' ? links[0] : e.key === 'End' ? links.at(-1) : undefined
          if (next) {
            e.preventDefault()
            next.focus()
          }
        }}
      >
        {cards.map((card) => {
          const isActive = card.slug === activeSlug
          const avatar = card.avatar ?? card.hero
          return (
            <li key={card.id} className="shrink-0 snap-center">
              <a
                href={`/${card.slug}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${card.name}, ${card.professionalTitle}${isActive ? ' (perfil actual)' : ''}`}
                onClick={() => {
                  if (!isActive) track('professional_switch', { from: activeSlug, to: card.slug })
                }}
                className="group flex w-[76px] flex-col items-center gap-2 rounded-2xl p-1 text-center sm:w-[92px]"
              >
                <span className="relative grid size-[68px] place-items-center sm:size-[80px]">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-0 rounded-full ring-offset-[3px] ring-offset-canvas transition-[box-shadow,transform] duration-500 ease-out-expo',
                      isActive ? 'ring-[3px] ring-brand motion-safe:animate-[pop-ring_600ms_var(--ease-out)_both]' : 'ring-0 group-hover:ring-2 group-hover:ring-brand/40',
                    )}
                  />
                  <span
                    className={cn(
                      'relative size-full overflow-hidden rounded-full bg-brand-soft transition-[transform,filter] duration-300 ease-out-expo group-hover:scale-[1.06] group-active:scale-95',
                      !isActive && 'grayscale-[35%] group-hover:grayscale-0',
                    )}
                  >
                    {avatar ? (
                      <Image
                        src={avatar.url}
                        alt=""
                        width={160}
                        height={160}
                        sizes="80px"
                        className="size-full object-cover"
                        style={{ objectPosition: focalPosition(avatar) }}
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-lg font-black text-brand-deep">{initials(card.name)}</span>
                    )}
                  </span>
                </span>
                {showNames ? (
                  <span className={cn('line-clamp-2 text-[0.72rem] leading-tight font-bold sm:text-xs', isActive ? 'text-brand-deep' : 'text-ink-muted')}>
                    {card.name}
                  </span>
                ) : null}
              </a>
            </li>
          )
        })}
      </ul>
      {overflow.end ? <ArrowButton side="end" onClick={() => scrollBy(1)} /> : null}
    </nav>
  )
}

function ArrowButton({ side, onClick }: { side: 'start' | 'end'; onClick: () => void }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-y-0 z-10 flex items-center',
        side === 'start' ? 'left-0 bg-gradient-to-r from-canvas via-canvas/80 pr-6' : 'right-0 bg-gradient-to-l from-canvas via-canvas/80 pl-6',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={side === 'start' ? 'Ver profesionales anteriores' : 'Ver más profesionales'}
        className="pointer-events-auto grid size-11 place-items-center rounded-full bg-surface text-brand shadow-soft transition-transform hover:scale-105 active:scale-95"
      >
        {side === 'start' ? <ChevronLeft size={20} aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}
      </button>
    </div>
  )
}
