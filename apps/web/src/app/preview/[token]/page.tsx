import { env } from '@repo/config'
import { getDraftPreview, getHomePageDraft } from '@repo/data-access'
import { verifyPreviewToken } from '@repo/integrations/signing'
import { getTestimonialFeed, providersFor } from '@repo/integrations/testimonials'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'
import { LandingView } from '@/components/landing/LandingView'
import { ProfileView } from '@/components/profile/ProfileView'
import { getProfessionalCards, getSite } from '@/lib/data'
import { siteUrl } from '@/lib/site-url'

export const metadata: Metadata = { title: 'Vista previa', robots: { index: false, follow: false } }

/**
 * Draft preview embedded by the backoffice. Access requires a short-lived
 * HMAC token minted by the admin (never a public URL); responses are
 * `no-store`, `noindex` and only frameable by ADMIN_BASE_URL (next.config).
 */
async function Preview({ params }: { params: PageProps<'/preview/[token]'>['params'] }) {
  // Previews are always per-request (token expiry uses the current time).
  await connection()
  const { token } = await params
  const secret = env().PREVIEW_SECRET
  const claims = secret ? verifyPreviewToken(secret, decodeURIComponent(token)) : null
  if (!claims) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-black">Vista previa expirada</h1>
        <p className="mt-2 text-ink-muted">Vuelve a abrir la vista previa desde el backoffice.</p>
      </div>
    )
  }
  if (claims.pid === 'home') {
    const [draft, site, cards] = await Promise.all([getHomePageDraft(), getSite(), getProfessionalCards()])
    return (
      <>
        <PreviewBanner label="Vista previa de la página de inicio · no es pública" />
        <LandingView page={draft} site={site} cards={cards} baseUrl={siteUrl()} preview />
      </>
    )
  }
  const [profile, site, cards] = await Promise.all([getDraftPreview(claims.pid), getSite(), getProfessionalCards()])
  if (!profile) {
    return <p className="px-6 py-24 text-center">Profesional no encontrado.</p>
  }
  const feed = await getTestimonialFeed(
    profile,
    [],
    providersFor(profile).filter((p) => p.origin !== 'google_places'),
  )
  // Include the draft in the switcher so the preview looks like the real page.
  const withSelf = cards.some((c) => c.id === profile.id)
    ? cards
    : [...cards, { id: profile.id, slug: profile.slug, name: profile.name, professionalTitle: profile.professionalTitle, scriptTitle: profile.scriptTitle, avatar: profile.images.avatar, hero: profile.images.hero, shortDescription: profile.shortDescription }]
  return (
    <>
      <PreviewBanner label="Vista previa del borrador · no es público" />
      <ProfileView profile={profile} site={site} cards={withSelf} feed={feed} liveReviews={false} preview />
    </>
  )
}

export default function PreviewPage({ params }: PageProps<'/preview/[token]'>) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Preview params={params} />
    </Suspense>
  )
}

function PreviewBanner({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-50 bg-accent-warm px-4 py-1.5 text-center text-xs font-bold tracking-wide text-brand-deep uppercase">
      {label}
    </div>
  )
}
