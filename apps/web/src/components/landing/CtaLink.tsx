'use client'

import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Magnet } from '@/components/fx/Magnet'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/cn'

const tones = {
  brand: 'bg-brand text-on-brand shadow-glow hover:bg-brand-deep',
  light: 'bg-surface text-brand-deep shadow-lifted hover:bg-canvas',
  outline: 'bg-transparent text-ink ring-2 ring-ink/80 hover:bg-ink hover:text-canvas',
  ghostOnBrand: 'bg-transparent text-on-brand ring-2 ring-on-brand/50 hover:bg-on-brand/10',
} as const

/**
 * CMS-driven call to action. Public pages navigate as documents (cross-document
 * View Transitions + Speculation Rules); every click is reported to analytics.
 */
export function CtaLink({
  href,
  children,
  tone = 'brand',
  placement,
  magnetic = false,
  className,
  icon,
}: {
  href: string
  children: ReactNode
  tone?: keyof typeof tones
  placement: string
  magnetic?: boolean
  className?: string
  icon?: ReactNode
}) {
  const external = /^https?:\/\//.test(href)
  const classes = cn(
    'group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-button px-7 py-3.5 text-[0.95rem] font-black tracking-wide uppercase transition-[background-color,color,transform,box-shadow] duration-300 ease-out-expo active:scale-[0.97]',
    tones[tone],
    className,
  )
  const onClick = () => track('appointment_cta_click', { placement, href })
  const inner = (
    <>
      {icon}
      <span>{children}</span>
      {external ? (
        <ArrowUpRight aria-hidden="true" size={18} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      ) : null}
    </>
  )
  const element = (
    <a href={href} className={classes} onClick={onClick} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {inner}
      {external ? <span className="sr-only">(se abre en una pestaña nueva)</span> : null}
    </a>
  )
  return magnetic ? <Magnet>{element}</Magnet> : element
}
