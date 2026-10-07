import type { Metadata } from 'next'
import { Directory } from '@/components/site/Directory'
import { getProfessionalCards, getSite } from '@/lib/data'
import { absoluteUrl } from '@/lib/site-url'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return {
    title: site.copy.directoryTitle,
    description: site.copy.directoryIntro || site.seo.description || undefined,
    alternates: { canonical: absoluteUrl('/equipo') },
  }
}

/** Team section: every published professional, linking to their full profile. */
export default async function TeamPage() {
  const [site, cards] = await Promise.all([getSite(), getProfessionalCards()])
  return <Directory site={site} cards={cards} />
}
