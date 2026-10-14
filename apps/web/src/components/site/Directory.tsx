'use client'

import type { ProfessionalCard, SiteSettings } from '@repo/domain'
import Image from 'next/image'
import { useState } from 'react'
import { focalPosition, initials } from '@/lib/image'
import { cn } from '@/lib/cn'
import { DirectorySlider } from './DirectorySlider'

/** Team directory for the root URL when the site is set to DIRECTORY mode. */
export function Directory({ site, cards }: { site: SiteSettings; cards: ProfessionalCard[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(55%_50%_at_70%_20%,color-mix(in_oklab,var(--t-brand-soft)_45%,transparent),transparent_70%)]"
      />
      <section aria-labelledby="directory-title" className="relative mx-auto w-full max-w-wide px-5 pt-10 pb-20 sm:px-8 md:pt-16 lg:px-10">
        <p className="script text-[clamp(2.6rem,7vw,4.5rem)] text-brand">{site.organizationName}</p>
        <h1 id="directory-title" className="max-w-3xl text-[clamp(2.2rem,6vw,4.4rem)] leading-[0.95] font-black tracking-[-0.03em] text-balance uppercase italic">
          {site.copy.directoryTitle}
        </h1>
        {site.copy.directoryIntro ? <p className="mt-5 max-w-xl text-lg text-ink-muted">{site.copy.directoryIntro}</p> : null}
        <p className="mt-4 text-sm font-bold tracking-wide text-brand uppercase">
          Selecciona a un especialista para agendar alguno de nuestros servicios
        </p>

        {cards.length === 0 ? (
          <p className="mt-16 rounded-card bg-surface p-10 text-center text-ink-muted shadow-soft">
            Muy pronto conocerás a nuestro equipo.
          </p>
        ) : (
          <>
            <div className="-mx-5 mt-8 sm:hidden">
              <DirectorySlider onIndexChange={setActiveIndex}>
                {cards.map((card, i) => (
                  <li key={card.id} className="w-[60vw] max-w-[280px] shrink-0">
                    <CardInner card={card} priority={false} isActive={i === activeIndex} />
                  </li>
                ))}
              </DirectorySlider>
            </div>

            <ul className="mt-14 hidden gap-x-6 gap-y-12 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card, i) => (
                <li key={card.id} className="reveal">
                  <CardInner card={card} priority={i < 3} isActive />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}

function CardInner({ card, priority, isActive }: { card: ProfessionalCard; priority: boolean; isActive: boolean }) {
  const photo = card.hero ?? card.avatar
  return (
    <a
      href={`/${card.slug}`}
      draggable={false}
      className={cn(
        'group block overflow-hidden rounded-[1.75rem] bg-[#ece7f3] p-4 shadow-soft transition-[transform,box-shadow,opacity] duration-500 ease-out-expo',
        'focus-visible:outline-offset-8 hover:shadow-lifted',
        isActive ? 'scale-100 opacity-100' : 'scale-[0.82] opacity-80',
      )}
    >
      <div className="relative mx-auto block aspect-square w-full overflow-hidden rounded-2xl bg-brand-soft/25">
        {photo ? (
          <Image
            src={photo.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 32vw, 60vw"
            loading={priority ? 'eager' : 'lazy'}
            draggable={false}
            className={cn(
              'transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]',
              photo.hasAlpha ? 'object-contain object-bottom' : 'object-cover object-center',
            )}
            style={photo.hasAlpha ? undefined : { objectPosition: focalPosition(photo) }}
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-brand-soft text-4xl font-black text-brand-deep">
            {initials(card.name)}
          </span>
        )}
      </div>
      <div className="mt-3 text-center">
        <h2 className="text-sm leading-tight font-black tracking-tight text-[#4d2a80] uppercase sm:text-lg">
          {card.name}
        </h2>
        <p className="script mt-0.5 text-base leading-tight text-[#8777b5] sm:text-xl">
          {card.scriptTitle || card.professionalTitle}
        </p>
        {card.shortDescription ? (
          <p className="mx-auto mt-2 line-clamp-2 max-w-[95%] text-[0.7rem] leading-relaxed text-[#3c3c3b] sm:text-sm">
            {card.shortDescription}
          </p>
        ) : null}
      </div>
    </a>
  )
}
