'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { markMascotasAsReadAction } from '@/app/(dashboard)/mascotas/actions'

export function MarkAsReadTrigger() {
  const router = useRouter()
  useEffect(() => {
    let cancelled = false
    markMascotasAsReadAction()
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
