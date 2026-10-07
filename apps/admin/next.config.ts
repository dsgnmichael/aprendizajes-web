import { existsSync } from 'node:fs'
import path from 'node:path'
import type { NextConfig } from 'next'

// The monorepo keeps a single root `.env` shared by both apps and scripts.
const rootEnv = path.resolve(import.meta.dirname, '../../.env')
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)
// Auth.js (next-auth v4) reads NEXTAUTH_URL; derive it from the documented variable.
process.env.NEXTAUTH_URL ??= process.env.ADMIN_BASE_URL

const publicBase = (process.env.PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const publicUrl = new URL(publicBase)
const isProd = process.env.NODE_ENV === 'production'

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; dev needs eval for React Refresh.
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${publicUrl.origin} https://*.public.blob.vercel-storage.com https://lh3.googleusercontent.com https://*.googleusercontent.com`,
  "font-src 'self' data:",
  "connect-src 'self'",
  `frame-src ${publicUrl.origin}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    '@repo/ui',
    '@repo/domain',
    '@repo/config',
    '@repo/database',
    '@repo/data-access',
    '@repo/auth',
    '@repo/integrations',
  ],
  serverExternalPackages: ['mongodb', 'sharp', '@node-rs/argon2'],
  experimental: {
    serverActions: { bodySizeLimit: '9mb' },
  },
  images: {
    remotePatterns: [
      {
        protocol: publicUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: publicUrl.hostname,
        port: publicUrl.port,
        pathname: '/**',
      },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
    // Local dev serves the public app on localhost.
    dangerouslyAllowLocalIP: !isProd,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          ...(isProd
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ]
  },
}

export default nextConfig
