'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { markAsReadAction } from '@/app/(dashboard)/formularios/invitacion-especial/actions'

export function MarkAsReadTrigger() {
  const router = useRouter()
  useEffect(() => {
    let cancelled = false
    markAsReadAction()
      .then(() => {
        if (!cancelled) router.refresh()
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [router])
  return null
}
