import { isValidSlug, publicProfileUrl, richTextToPlain } from '@repo/domain'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'
import { getProfessionalCards, getProfile, getSite } from '@/lib/data'
import { siteUrl } from '@/lib/site-url'

/**
 * Published professionals are prerendered at build time; any slug published
 * later gets an instant App Shell and is upgraded in the background (ISR with
 * Cache Components). Unknown slugs never reach this page: `proxy.ts` answers
 * them with a real 404 status.
 */
export async function generateStaticParams() {
  const cards = await getProfessionalCards()
  // Cache Components requires at least one param; the placeholder 404s.
  return cards.length > 0 ? cards.map((c) => ({ slug: c.slug })) : [{ slug: '__placeholder__' }]
}

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  if (!isValidSlug(slug)) return {}
  const [profile, site] = await Promise.all([getProfile(slug), getSite()])
  if (!profile) return { title: 'Perfil no encontrado', robots: { index: false } }
  const title = profile.seo.title || `${profile.name} · ${profile.professionalTitle}`
  const description =
    profile.seo.description || profile.shortDescription || richTextToPlain(profile.biography).slice(0, 160) || site.seo.description
  const canonical = profile.seo.canonical || publicProfileUrl(siteUrl(), profile.slug)
  const og = profile.seo.ogImage ?? profile.images.hero ?? site.seo.ogImage
  return {
    title: { absolute: profile.seo.title ? profile.seo.title : site.seo.titleTemplate.replace('%s', title) },
    description,
    alternates: { canonical },
    robots: profile.seo.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'profile',
      url: canonical,
      title: profile.seo.ogTitle || title,
      description: profile.seo.ogDescription || description,
      images: og ? [{ url: og.url, width: og.width, height: og.height, alt: og.alt || profile.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.seo.ogTitle || title,
      description: profile.seo.ogDescription || description,
      images: og ? [og.url] : undefined,
    },
  }
}

async function ProfileRoute({ params }: { params: PageProps<'/[slug]'>['params'] }) {
  const { slug } = await params
  if (!isValidSlug(slug)) notFound()
  return <ProfilePage slug={slug} />
}

export default function Page({ params }: PageProps<'/[slug]'>) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileRoute params={params} />
    </Suspense>
  )
}
