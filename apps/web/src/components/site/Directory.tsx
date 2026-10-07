import type { ProfessionalCard, SiteSettings } from '@repo/domain'
import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import { focalPosition, initials } from '@/lib/image'

/** Team directory for the root URL when the site is set to DIRECTORY mode. */
export function Directory({ site, cards }: { site: SiteSettings; cards: ProfessionalCard[] }) {
  return (
    <div className="relative overflow-x-clip">
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

        {cards.length === 0 ? (
          <p className="mt-16 rounded-card bg-surface p-10 text-center text-ink-muted shadow-soft">Muy pronto conocerás a nuestro equipo.</p>
        ) : (
          <ul id="equipo" className="mt-14 grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, i) => (
              <li key={card.id} className="reveal">
                <a href={`/${card.slug}`} className="group block rounded-panel focus-visible:outline-offset-8">
                  <div className="relative">
                    <div aria-hidden="true" className="grain absolute inset-x-0 bottom-0 top-[22%] overflow-hidden rounded-panel bg-brand transition-[background-color] duration-500 group-hover:bg-brand-deep">
                      <div className="orbits absolute -top-1/3 left-1/2 aspect-square w-[130%] -translate-x-1/2 opacity-70" />
                    </div>
                    <div className="relative mx-auto aspect-[3/4] w-[78%]">
                      {card.hero ? (
                        <Image
                          src={card.hero.url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 26vw, (min-width: 640px) 38vw, 78vw"
                          loading={i < 3 ? 'eager' : 'lazy'}
                          className="object-contain object-bottom drop-shadow-[0_24px_30px_rgb(20_8_40/0.35)] transition-transform duration-700 ease-out-expo group-hover:-translate-y-2 group-hover:scale-[1.02]"
                          style={card.hero.hasAlpha ? undefined : { objectFit: 'cover', objectPosition: focalPosition(card.hero), borderRadius: '999px 999px 0 0' }}
                        />
                      ) : (
                        <span className="absolute inset-x-[10%] bottom-0 grid aspect-square place-items-center rounded-full bg-brand-soft text-5xl font-black text-brand-deep">
                          {initials(card.name)}
                        </span>
                      )}
                    </div>
                    <span className="absolute right-5 bottom-5 grid size-12 place-items-center rounded-full bg-surface text-brand shadow-soft transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </span>
                  </div>
                  <h2 className="mt-5 text-2xl leading-none font-black tracking-tight uppercase italic">{card.name}</h2>
                  <p className="script mt-1 text-3xl text-brand">{card.scriptTitle || card.professionalTitle}</p>
                  {card.shortDescription ? <p className="mt-2 line-clamp-2 text-ink-muted">{card.shortDescription}</p> : null}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
