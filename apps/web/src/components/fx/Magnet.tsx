'use client'

import { useRef, type ReactNode } from 'react'

/**
 * Magnetic hover, adapted from React Bits "Magnet". Only active for precise
 * pointers (mouse/trackpad) and when the user allows motion; transform-only.
 */
export function Magnet({ children, strength = 0.25, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)

  const reset = () => {
    cancelAnimationFrame(frame.current)
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-flex', transition: 'transform 360ms cubic-bezier(0.16,1,0.3,1)' }}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const x = (event.clientX - rect.left - rect.width / 2) * strength
        const y = (event.clientY - rect.top - rect.height / 2) * strength
        cancelAnimationFrame(frame.current)
        frame.current = requestAnimationFrame(() => {
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        })
      }}
      onPointerLeave={reset}
    >
      {children}
    </span>
  )
}
