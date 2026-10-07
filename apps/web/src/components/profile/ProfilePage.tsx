import { buildProfileJsonLd, publicProfileUrl, serializeJsonLd } from '@repo/domain'
import { notFound } from 'next/navigation'
import { ProfileView } from '@/components/profile/ProfileView'
import { getCachedTestimonialFeed, getProfessionalCards, getProfile, getSite, hasLiveReviews } from '@/lib/data'
import { siteUrl } from '@/lib/site-url'

/** Loads a published profile (all cached) and renders it with JSON-LD. */
export async function ProfilePage({ slug }: { slug: string }) {
  const [profile, site, cards] = await Promise.all([getProfile(slug), getSite(), getProfessionalCards()])
  if (!profile) notFound()
  const feed = await getCachedTestimonialFeed(slug)
  const base = siteUrl()
  const url = profile.seo.canonical || publicProfileUrl(base, profile.slug)
  return (
    <>
      <ProfileView profile={profile} site={site} cards={cards} feed={feed} liveReviews={hasLiveReviews(profile)} />
      <script
        type="application/ld+json"
        // JSON-LD is generated from validated data and `<` is escaped.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildProfileJsonLd(profile, site, url, base)) }}
      />
    </>
  )
}
