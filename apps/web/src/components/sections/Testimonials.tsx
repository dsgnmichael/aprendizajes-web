import { SectionShell } from '@/components/profile/SectionShell'
import type { SectionProps } from '@/components/profile/types'
import { TestimonialCarousel } from '@/components/testimonials/TestimonialCarousel'

export function Testimonials({ section, ctx }: SectionProps<'testimonialCarousel'>) {
  const { profile, site, feed, liveReviews } = ctx
  const config = profile.testimonials
  if (!config.enabled) return null
  const initial = feed ?? { items: [], summary: { averageRating: null, totalReviews: null, aggregateOrigin: null }, attributions: [], degraded: false }
  if (initial.items.length === 0 && !liveReviews) return null
  const title = section.content.title || site.copy.testimonialsTitle
  const id = `h-${section.id}`
  const addReviewUrl = section.content.showAddReviewLink ? config.addReviewUrl : ''
  const order = { featured: 'destacadas primero', recent: 'más recientes primero', rating: 'mejor valoradas primero' }[config.ordering]
  const disclosure = `Se muestran hasta ${config.maxReviews} reseñas con ${config.minimumRating}★ o más, ${order}. El texto de las reseñas de Google no se modifica.`
  return (
    <SectionShell section={section} labelledBy={id} className="testimonials">
      <div className="mx-auto grid w-full max-w-content grid-cols-[minmax(0,1fr)] gap-10 px-5 sm:px-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-center">
        <header>
          <p className="script text-4xl text-brand md:text-5xl">testimonios</p>
          <h2 id={id} className="mt-1 text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.02] font-black tracking-[-0.02em] text-balance">
            {title}
          </h2>
          {section.content.subtitle ? <p className="mt-4 max-w-sm text-lg text-ink-muted">{section.content.subtitle}</p> : null}
        </header>
        <TestimonialCarousel
          initialFeed={initial}
          liveSlug={liveReviews && !ctx.preview ? profile.slug : undefined}
          title={title}
          disclosure={disclosure}
          showSourceBadge={config.showSourceBadge}
          showAverage={config.showAverageRating}
          showTotal={config.showTotalReviews}
          addReview={addReviewUrl ? { href: addReviewUrl, label: site.copy.addReviewLabel } : undefined}
        />
      </div>
    </SectionShell>
  )
}
