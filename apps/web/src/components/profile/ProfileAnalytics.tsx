'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

/** Emits `profile_view` (and `qr_entry` when the visit comes from a printed QR). */
export function ProfileAnalytics({ slug }: { slug: string }) {
  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get('src')
    track('profile_view', { slug, entry: src ?? 'direct' })
    if (src) {
      try {
        sessionStorage.setItem('entry', src)
      } catch {
        /* storage may be unavailable */
      }
    }
    if (src === 'qr') {
      track('qr_entry', { slug })
      // Clean the URL so shares/bookmarks don't carry the QR marker.
      const url = new URL(window.location.href)
      url.searchParams.delete('src')
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    }
  }, [slug])
  return null
}
