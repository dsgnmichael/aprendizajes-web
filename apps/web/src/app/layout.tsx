import { themeToCssVars } from '@repo/domain'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import type { CSSProperties, ReactNode } from 'react'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { getCurrentYear, getSite } from '@/lib/data'
import { lato, loverine } from '@/lib/fonts'
import { siteUrl } from '@/lib/site-url'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  const icon = site.favicon?.url ?? site.logo?.url
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: site.seo.defaultTitle, template: site.seo.titleTemplate },
    description: site.seo.description || site.tagline || undefined,
    applicationName: site.organizationName,
    openGraph: {
      type: 'website',
      siteName: site.organizationName,
      locale: site.seo.locale,
      images: site.seo.ogImage ? [{ url: site.seo.ogImage.url, width: site.seo.ogImage.width, height: site.seo.ogImage.height }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
    icons: icon ? { icon: [{ url: icon }], apple: [{ url: icon }] } : undefined,
    formatDetection: { telephone: false, email: false, address: false },
  }
}

const SPECULATION_RULES = JSON.stringify({
  prefetch: [
    {
      where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/(api|media|preview|_next)/*' } }] },
      eagerness: 'moderate',
    },
  ],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f4f0',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [site, year] = await Promise.all([getSite(), getCurrentYear()])
  const ga = site.analytics.ga4MeasurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  return (
    <html lang="es" className={`${lato.variable} ${loverine.variable}`}>
      <body
        style={themeToCssVars(site.theme) as CSSProperties}
        data-motion={site.theme.motion === 'off' ? 'off' : undefined}
        className="min-h-svh overflow-x-clip"
      >
        <Header site={site} />
        <main id="contenido">{children}</main>
        <Footer site={site} year={year} />
        <script
          type="speculationrules"
          // Static JSON: prefetch public pages on hover/press (never APIs, media or previews).
          dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }}
        />
        {ga && /^G-[A-Z0-9]{4,20}$/.test(ga) ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="lazyOnload" />
            <Script id="ga4" strategy="lazyOnload">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  )
}
