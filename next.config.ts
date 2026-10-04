import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Patrones de rutas locales permitidas para <Image />
    localPatterns: [
      {
        pathname: '/img/**',
        search: '',
      },
      {
        pathname: '/api/media/file/**',
      },
    ],
    // Dominios remotos permitidos (por si Payload sirve directo desde Supabase)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default withPayload(nextConfig)