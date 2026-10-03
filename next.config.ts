import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/img/**',
        search: '',
      },
    ],
  },
}

export default withPayload(nextConfig)