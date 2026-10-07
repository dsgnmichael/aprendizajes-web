import { SectionShell } from '@/components/profile/SectionShell'
import type { SectionProps } from '@/components/profile/types'
import { ProfessionalSwitcherClient } from './ProfessionalSwitcherClient'

/** Previous and next professional: the only documents prefetched in advance (HTML only, never images). */
function neighbours(cards: { slug: string }[], active: string): string[] {
  const i = cards.findIndex((c) => c.slug === active)
  if (i < 0 || cards.length < 2) return []
  return [...new Set([cards[(i + 1) % cards.length]!.slug, cards[(i - 1 + cards.length) % cards.length]!.slug])].filter((s) => s !== active)
}

/** Renders nothing when there is a single published professional. */
export function ProfessionalSwitcher({ section, ctx }: SectionProps<'professionalSwitcher'>) {
  const { cards, site, profile } = ctx
  if (!site.switcher.enabled || cards.length < 2) return null
  const title = section.content.title || site.copy.switcherTitle
  const id = `h-${section.id}`
  return (
    <SectionShell section={section} labelledBy={id} className="switcher">
      <div className="mx-auto w-full max-w-content px-3 sm:px-8">
        <h2 id={id} className="mb-2 text-center text-sm font-bold tracking-[0.22em] text-ink-muted uppercase">
          {title}
        </h2>
        <ProfessionalSwitcherClient cards={cards} activeSlug={profile.slug} showNames={site.switcher.showNames} label={title} />
        {site.switcher.prefetchNeighbours && !ctx.preview
          ? neighbours(cards, profile.slug).map((slug) => <link key={slug} rel="prefetch" href={`/${slug}`} as="document" />)
          : null}
      </div>
    </SectionShell>
  )
}
