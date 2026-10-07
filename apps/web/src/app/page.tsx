import { isValidSlug, publicProfileUrl } from '@repo/domain'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LandingView } from '@/components/landing/LandingView'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { Directory } from '@/components/site/Directory'
import { getLanding, getProfessionalCards, getProfile, getSite } from '@/lib/data'
import { siteUrl } from '@/lib/site-url'

/**
 * Root behaviour is configured in the backoffice (Configuración → Raíz):
 * - LANDING (default): the sales landing edited in "Página de inicio".
 * - DIRECTORY: team directory (same as /equipo).
 * - DEFAULT_PROFESSIONAL: renders (canonical → /slug) or redirects to a profile.
 * Falls back to the directory when the chosen content isn't published.
 */
async function resolveRoot() {
  const site = await getSite()
  if (site.root.mode === 'LANDING') {
    const landing = await getLanding()
    if (landing) return { site, kind: 'landing' as const, landing }
  }
  const slug = site.root.defaultProfessionalSlug
  if (site.root.mode === 'DEFAULT_PROFESSIONAL' && isValidSlug(slug) && (await getProfile(slug))) {
    return { site, kind: 'professional' as const, slug }
  }
  return { site, kind: 'directory' as const }
}

export async function generateMetadata(): Promise<Metadata> {
  const root = await resolveRoot()
  if (root.kind === 'professional') return { alternates: { canonical: publicProfileUrl(siteUrl(), root.slug) } }
  const seo = root.kind === 'landing' ? root.landing.seo : null
  const og = seo?.ogImage ?? root.site.seo.ogImage
  return {
    title: { absolute: seo?.title || root.site.seo.defaultTitle },
    description: seo?.description || root.site.seo.description || undefined,
    alternates: { canonical: siteUrl() },
    openGraph: og ? { images: [{ url: og.url, width: og.width, height: og.height }] } : undefined,
  }
}

export default async function Home() {
  const root = await resolveRoot()
  if (root.kind === 'landing') {
    return <LandingView page={root.landing} site={root.site} cards={await getProfessionalCards()} baseUrl={siteUrl()} />
  }
  if (root.kind === 'professional') {
    if (!root.site.root.renderInPlace) redirect(`/${root.slug}`)
    return <ProfilePage slug={root.slug} />
  }
  return <Directory site={root.site} cards={await getProfessionalCards()} />
}
