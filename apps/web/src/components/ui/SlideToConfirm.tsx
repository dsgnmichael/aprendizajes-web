'use client'

import { MessageCircle } from 'lucide-react'
import { LazyMotion, m, animate, useMotionValue, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { loadMotionFeatures } from '@/lib/motion'
import { cn } from '@/lib/cn'

const PADDING = 8

export function SlideToConfirm({
  label,
  onConfirm,
  className,
  disabled = false,
}: {
  label: string
  onConfirm: () => void
  className?: string
  disabled?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const [maxDrag, setMaxDrag] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const x = useMotionValue(0)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return
    const update = () => {
      setMaxDrag(Math.max(0, track.offsetWidth - thumb.offsetWidth - PADDING * 2))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(track)
    ro.observe(thumb)
    return () => ro.disconnect()
  }, [])

  const spring = reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 480, damping: 34 }

  const finish = () => {
    if (confirmed) return
    setConfirmed(true)
    onConfirm()
  }

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (disabled || maxDrag === 0) return
    const threshold = maxDrag * 0.85
    const shouldConfirm = info.offset.x >= threshold
    if (shouldConfirm) {
      animate(x, maxDrag, spring)
      finish()
    } else {
      animate(x, 0, spring)
    }
  }

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <div
        ref={trackRef}
        className={cn(
          'relative h-20 w-full overflow-hidden rounded-full shadow-glow',
          'bg-gradient-to-r from-[#6b5aae] to-[#a496d8]',
          disabled && 'opacity-50',
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pl-20">
          <span className="text-center text-[0.99rem] leading-tight font-black tracking-[0.08em] text-white uppercase sm:text-[1.1rem]">
            {label.split('\n').map((line, i) => (
              <span key={i} className="block whitespace-nowrap">
                {line}
              </span>
            ))}
          </span>
        </div>

        <m.div
          ref={thumbRef}
          drag={disabled || confirmed ? false : 'x'}
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0}
          dragMomentum={false}
          dragSnapToOrigin={true}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.96 }}
          style={{ x, touchAction: 'none' as const }}
          className="absolute top-2 left-2 z-10 grid size-16 touch-none cursor-grab place-items-center rounded-full bg-white text-[#4d2a80] shadow-[0_4px_16px_rgba(77,42,128,0.35),0_2px_4px_rgba(0,0,0,0.12)] active:cursor-grabbing"
          aria-label={label}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (maxDrag > 0) {
                animate(x, maxDrag, spring)
                finish()
              }
            }
          }}
        >
          <MessageCircle size={26} strokeWidth={2.4} aria-hidden="true" />
        </m.div>
      </div>
    </LazyMotion>
  )
}
