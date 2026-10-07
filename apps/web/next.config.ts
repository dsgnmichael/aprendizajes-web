import { existsSync } from 'node:fs'
import path from 'node:path'
import type { NextConfig } from 'next'

// Monorepo: a single `.env` lives at the repository root.
const rootEnv = path.resolve(import.meta.dirname, '../../.env')
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

const adminOrigin = (process.env.ADMIN_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '')
const isProd = process.env.NODE_ENV === 'production'

function hostOf(url: string | undefined) {
  try {
    return url ? new URL(url) : null
  } catch {
    return null
  }
}
const publicUrl = hostOf(process.env.PUBLIC_BASE_URL)

const csp = [
  "default-src 'self'",
  // Next.js inlines bootstrap scripts; nonces would force dynamic rendering of
  // every page, so we allow inline scripts but no third-party script origins
  // except Google Analytics (only loaded when configured).
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.public.blob.vercel-storage.com https://maps.gstatic.com https://www.google-analytics.com",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ')

const securityHeaders = [
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@repo/domain', '@repo/config', '@repo/database', '@repo/data-access', '@repo/integrations'],
  serverExternalPackages: ['mongodb', 'sharp'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [48, 64, 96, 128, 192, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    localPatterns: [
      { pathname: '/demo/**' },
      { pathname: '/brand/**' },
      { pathname: '/media/**' },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      ...(publicUrl
        ? [{ protocol: publicUrl.protocol.replace(':', '') as 'http' | 'https', hostname: publicUrl.hostname, port: publicUrl.port, pathname: '/media/**' }]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/((?!preview).*)',
        headers: [...securityHeaders, { key: 'Content-Security-Policy', value: csp }, { key: 'X-Frame-Options', value: 'DENY' }],
      },
      {
        // Draft previews are embedded by the backoffice only.
        source: '/preview/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: csp.replace("frame-ancestors 'none'", `frame-ancestors ${adminOrigin}`) },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ]
  },
}

export default nextConfig
