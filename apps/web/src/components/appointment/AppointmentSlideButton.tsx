'use client'

import type { AppointmentAction } from '@repo/domain'
import { SlideToConfirm } from '@/components/ui/SlideToConfirm'
import { track } from '@/lib/analytics'
import { useAppointment } from './AppointmentContext'

export function AppointmentSlideButton({
  action,
  label,
  slug,
  placement,
  className,
}: {
  action: AppointmentAction
  label: string
  slug: string
  placement: string
  className?: string
}) {
  const { open } = useAppointment()
  if (action.kind === 'disabled') return null

  const handleConfirm = () => {
    track('appointment_cta_click', { slug, placement, mode: action.kind })
    if (action.kind === 'link') {
      window.open(action.href, '_blank', 'noopener,noreferrer')
    } else {
      open(placement)
    }
  }

  return <SlideToConfirm label={label} onConfirm={handleConfirm} className={className} />
}
