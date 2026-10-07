'use client'

import type { AnalyticsEvent, AnalyticsProps } from '@repo/domain'

/**
 * Provider-agnostic analytics. Events go to `window.dataLayer` (GA4 / GTM
 * pick them up when installed) and to any registered sink. Never throws and
 * never blocks rendering when analytics is absent.
 */
type Sink = (event: AnalyticsEvent, props: AnalyticsProps) => void
const sinks = new Set<Sink>()

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function registerAnalyticsSink(sink: Sink) {
  sinks.add(sink)
  return () => sinks.delete(sink)
}

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
  try {
    if (typeof window === 'undefined') return
    if (typeof window.gtag === 'function') window.gtag('event', event, props)
    else window.dataLayer?.push({ event, ...props })
    for (const sink of sinks) sink(event, props)
  } catch {
    /* analytics must never break the UX */
  }
}
