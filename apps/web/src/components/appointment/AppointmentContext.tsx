'use client'

import dynamic from 'next/dynamic'
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AppointmentFormConfig } from './types'

const AppointmentDialog = dynamic(() => import('./AppointmentDialog'), { ssr: false })

interface Ctx {
  open: (source: string) => void
  enabled: boolean
}

const AppointmentCtx = createContext<Ctx>({ open: () => undefined, enabled: false })

export function useAppointment() {
  return use(AppointmentCtx)
}

/**
 * Holds the internal appointment form state for a profile. The dialog code
 * (form library, validation) is only downloaded when someone opens it.
 */
export function AppointmentProvider({ config, children }: { config: AppointmentFormConfig | null; children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const open = useCallback(() => {
    setMounted(true)
    setOpen(true)
  }, [])
  const value = useMemo(() => ({ open, enabled: config !== null }), [open, config])
  return (
    <AppointmentCtx value={value}>
      {children}
      {config && mounted ? <AppointmentDialog config={config} open={isOpen} onOpenChange={setOpen} /> : null}
    </AppointmentCtx>
  )
}
