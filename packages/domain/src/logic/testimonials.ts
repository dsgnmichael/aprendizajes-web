import type { TestimonialsConfig } from '../schemas/professional'
import type { TestimonialDTO, TestimonialFeed, TestimonialSummary } from '../schemas/entities'
import type { TestimonialOrigin } from '../constants'

export interface ProviderResult {
  origin: TestimonialOrigin
  items: TestimonialDTO[]
  summary?: Partial<TestimonialSummary>
  /** True when the provider failed; the feed degrades gracefully. */
  failed?: boolean
}

type FeedConfig = Pick<
  TestimonialsConfig,
  'maxReviews' | 'minimumRating' | 'ordering' | 'manualFallback' | 'source'
> & { hiddenReviewIds?: readonly string[] }

const byOrdering: Record<FeedConfig['ordering'], (a: TestimonialDTO, b: TestimonialDTO) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured),
  recent: (a, b) => (b.date ?? '').localeCompare(a.date ?? ''),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
}

/**
 * Merges provider results into the feed rendered publicly:
 * - removes hidden ids and entries below the minimum rating (manual entries
 *   without rating are kept);
 * - orders according to the configuration (stable sort keeps provider order);
 * - falls back to manual testimonials when Google returns nothing or fails;
 * - never alters review text.
 */
export function buildTestimonialFeed(results: ProviderResult[], config: FeedConfig): TestimonialFeed {
  const hidden = new Set(config.hiddenReviewIds ?? [])
  const manual = results.find((r) => r.origin === 'manual')
  const external = results.filter((r) => r.origin !== 'manual')

  const filter = (items: TestimonialDTO[]) =>
    items.filter(
      (item) =>
        !hidden.has(item.id) &&
        item.content.trim().length > 0 &&
        (item.rating === null || item.rating >= config.minimumRating),
    )

  let pool: TestimonialDTO[] = []
  const wantsManual = config.source === 'MANUAL' || config.source === 'MIXED'
  if (wantsManual && manual) pool.push(...filter(manual.items))
  for (const r of external) pool.push(...filter(r.items))

  const externalUsable = external.some((r) => !r.failed && filter(r.items).length > 0)
  if (!wantsManual && !externalUsable && config.manualFallback && manual) {
    pool = filter(manual.items)
  }

  pool = pool.toSorted(byOrdering[config.ordering]).slice(0, config.maxReviews)

  const origins = new Set(pool.map((p) => p.origin))
  const aggregateSource = external.find((r) => !r.failed && r.summary?.averageRating != null)
  const summary: TestimonialSummary = aggregateSource
    ? {
        averageRating: aggregateSource.summary?.averageRating ?? null,
        totalReviews: aggregateSource.summary?.totalReviews ?? null,
        aggregateOrigin: aggregateSource.origin,
        placeUrl: aggregateSource.summary?.placeUrl,
      }
    : { averageRating: null, totalReviews: null, aggregateOrigin: null }

  if (summary.aggregateOrigin) origins.add(summary.aggregateOrigin)

  return {
    items: pool,
    summary,
    attributions: [...origins].filter((o) => o !== 'manual'),
    degraded: results.some((r) => r.failed),
  }
}

/** Average of manual ratings – shown only as "valoración de testimonios", never as Google rating. */
export function manualAverage(items: TestimonialDTO[]): number | null {
  const rated = items.filter((i) => i.rating != null)
  if (rated.length === 0) return null
  return Math.round((rated.reduce((sum, i) => sum + (i.rating ?? 0), 0) / rated.length) * 10) / 10
}
