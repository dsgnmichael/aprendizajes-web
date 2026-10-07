'use client'

import type { AnalyticsEvent, AnalyticsProps } from '@repo/domain'
import type { AnchorHTMLAttributes } from 'react'
import { track } from '@/lib/analytics'

/** Plain anchor that reports an analytics event on click. */
export function TrackedLink({
  event,
  eventProps,
  external,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  event: AnalyticsEvent
  eventProps?: AnalyticsProps
  external?: boolean
}) {
  return (
    <a
      {...props}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={(e) => {
        track(event, eventProps)
        onClick?.(e)
      }}
    />
  )
}
