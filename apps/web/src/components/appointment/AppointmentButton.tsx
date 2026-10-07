'use client'

import type { AppointmentAction } from '@repo/domain'
import { ArrowUpRight, CalendarHeart } from 'lucide-react'
import { Magnet } from '@/components/fx/Magnet'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { useAppointment } from './AppointmentContext'

const styles = {
  light:
    'bg-surface text-brand-deep shadow-lifted hover:bg-canvas focus-visible:outline-accent-warm',
  brand: 'bg-brand text-on-brand shadow-glow hover:bg-brand-deep',
  ghost: 'bg-transparent text-on-brand ring-1 ring-on-brand/40 hover:bg-on-brand/10',
} as const

/** "Agendar cita" CTA: opens the internal form or follows the configured link. */
export function AppointmentButton({
  action,
  label,
  slug,
  placement,
  tone = 'brand',
  size = 'lg',
  magnetic = false,
  className,
}: {
  action: AppointmentAction
  label: string
  slug: string
  placement: string
  tone?: keyof typeof styles
  size?: 'md' | 'lg'
  magnetic?: boolean
  className?: string
}) {
  const { open } = useAppointment()
  if (action.kind === 'disabled') return null

  const classes = cn(
    'group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-button font-black tracking-wide uppercase transition-[background-color,transform,box-shadow] duration-300 ease-out-expo active:scale-[0.97]',
    size === 'lg' ? 'px-7 py-4 text-[0.95rem]' : 'px-5 py-3 text-sm',
    styles[tone],
    className,
  )
  const onTrack = () => track('appointment_cta_click', { slug, placement, mode: action.kind })

  const inner = (
    <>
      <CalendarHeart aria-hidden="true" size={size === 'lg' ? 20 : 18} strokeWidth={2} />
      <span>{label}</span>
      {action.kind === 'link' ? (
        <ArrowUpRight aria-hidden="true" size={18} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      ) : null}
    </>
  )

  const element =
    action.kind === 'link' ? (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={classes} onClick={onTrack}>
        {inner}
        <span className="sr-only">(se abre en una pestaña nueva)</span>
      </a>
    ) : (
      <button
        type="button"
        className={classes}
        aria-haspopup="dialog"
        onClick={() => {
          onTrack()
          open(placement)
        }}
      >
        {inner}
      </button>
    )

  return magnetic ? <Magnet>{element}</Magnet> : element
}
