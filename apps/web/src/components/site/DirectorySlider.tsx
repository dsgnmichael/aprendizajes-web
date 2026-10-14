'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { LazyMotion, m, animate, useMotionValue, type PanInfo } from 'motion/react'
import { loadMotionFeatures } from '@/lib/motion'

const DRAG_THRESHOLD = 0.15
const VELOCITY_THRESHOLD = 400
const CLICK_PREVENT_MS = 220

export function DirectorySlider({
  children,
  onIndexChange,
}: {
  children: React.ReactNode
  onIndexChange?: (i: number) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const lastDragEnd = useRef(0)
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState(0)
  const [pad, setPad] = useState(0)
  const [count, setCount] = useState(0)
  const [index, setIndex] = useState(0)
  const x = useMotionValue(0)

  useEffect(() => {
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!track || !viewport) return

    const measure = () => {
      const items = Array.from(track.querySelectorAll<HTMLLIElement>(':scope > li'))
      if (items.length === 0) return
      const cardW = items[0]!.offsetWidth
      const cs = window.getComputedStyle(track)
      const gap = parseFloat(cs.gap) || 16
      const viewportW = viewport.offsetWidth
      const p = Math.max(16, (viewportW - cardW) / 2)
      setCount(items.length)
      setStep(cardW + gap)
      setPad(p)
      setReady(true)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    ro.observe(viewport)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    onIndexChange?.(index)
  }, [index, onIndexChange])

  useEffect(() => {
    if (step === 0) return
    const target = -index * step
    const controls = animate(x, target, { type: 'spring', stiffness: 340, damping: 34 })
    return () => controls.stop()
  }, [index, step, x])

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      lastDragEnd.current = Date.now()
      if (step === 0 || count === 0) return
      const th = step * DRAG_THRESHOLD
      let next = index
      if (info.offset.x < -th || info.velocity.x < -VELOCITY_THRESHOLD) {
        next = Math.min(index + 1, count - 1)
      } else if (info.offset.x > th || info.velocity.x > VELOCITY_THRESHOLD) {
        next = Math.max(index - 1, 0)
      }
      setIndex(next)
    },
    [index, step, count],
  )

  const blockClickAfterDrag = useCallback((e: React.MouseEvent) => {
    if (Date.now() - lastDragEnd.current < CLICK_PREVENT_MS) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  const constraints = { left: -(count - 1) * step, right: 0 }

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <div
        ref={viewportRef}
        className="overflow-hidden"
        style={{ visibility: ready ? 'visible' : 'hidden' }}
      >
        <m.ul
          ref={trackRef}
          drag={count > 1 ? 'x' : false}
          dragConstraints={constraints}
          dragElastic={0.06}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onClickCapture={blockClickAfterDrag}
          style={{ x, paddingLeft: pad, paddingRight: pad, touchAction: 'pan-y' }}
          className="flex cursor-grab gap-4 py-6 select-none active:cursor-grabbing"
        >
          {children}
        </m.ul>
      </div>
    </LazyMotion>
  )
}
