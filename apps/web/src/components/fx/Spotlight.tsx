'use client'

import { useRef, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Pointer-following light + micro parallax, adapted from React Bits
 * "SpotlightCard". Writes two CSS variables (no re-renders); children use
 * them via `--spot-x/--spot-y` and `--px/--py`. Inert on touch devices.
 */
export function Spotlight({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  return (
    <div
      ref={ref}
      className={cn('group/spot', className)}
      style={style}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width
        const y = (event.clientY - rect.top) / rect.height
        cancelAnimationFrame(frame.current)
        frame.current = requestAnimationFrame(() => {
          el.style.setProperty('--spot-x', `${(x * 100).toFixed(1)}%`)
          el.style.setProperty('--spot-y', `${(y * 100).toFixed(1)}%`)
          el.style.setProperty('--px', (x - 0.5).toFixed(3))
          el.style.setProperty('--py', (y - 0.5).toFixed(3))
        })
      }}
      onPointerLeave={() => {
        const el = ref.current
        if (!el) return
        el.style.setProperty('--px', '0')
        el.style.setProperty('--py', '0')
      }}
    >
      {children}
    </div>
  )
}
