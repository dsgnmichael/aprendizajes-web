'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export function PetsCarousel({ stories, duration = 5000 }: { stories: any[], duration?: number }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const count = stories.length

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return
      setDirection(delta)
      setIndex((i) => (i + delta + count) % count)
    },
    [count],
  )

  useEffect(() => {
    if (count < 2 || paused) return
    const t = setTimeout(() => go(1), duration)
    return () => clearTimeout(t)
  }, [count, paused, go, index, duration])

  if (count === 0) return null
  const current = stories[index]!

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 }),
  }

  const handleDragEnd = (e: any, { offset }: any) => {
    if (offset.x < -50) go(1)
    else if (offset.x > 50) go(-1)
  }

  return (
    <div
      className="relative max-w-3xl mx-auto pb-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[450px] md:min-h-[400px] flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute w-full bg-white rounded-[2rem] shadow-soft border border-gray-100 flex flex-col md:flex-row overflow-hidden cursor-grab active:cursor-grabbing"
          >
            <div className="relative w-full md:w-1/2 h-[250px] md:h-auto md:min-h-[400px] bg-gray-100 pointer-events-none">
              <Image src={current.imageUrl} alt="Mascota" fill className="object-cover" unoptimized />
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center pointer-events-none">
              <div className="mb-3">
                <h3 className="text-2xl font-black text-brand">{current.studentName}</h3>
                <p className="text-sm text-gray-400 font-medium mt-1">{formatDate(current.createdAt)}</p>
              </div>
              <p className="text-base md:text-lg text-ink-muted italic leading-relaxed">"{current.story}"</p>
            </div>
            {/* Barra de progreso en el borde inferior de la tarjeta */}
            {count > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100">
                 <motion.div
                   key={index}
                   initial={{ width: 0 }}
                   animate={{ width: '100%' }}
                   transition={{ duration: duration / 1000, ease: 'linear' }}
                   className="h-full bg-brand"
                 />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flechas */}
      {count > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur rounded-full p-2 md:p-3 shadow-md hover:bg-white transition text-brand" aria-label="Anterior">
            <ChevronLeft className="size-5 md:size-6" />
          </button>
          <button onClick={() => go(1)} className="absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur rounded-full p-2 md:p-3 shadow-md hover:bg-white transition text-brand" aria-label="Siguiente">
            <ChevronRight className="size-5 md:size-6" />
          </button>
        </>
      )}

      {/* Indicadores (Puntos) y Barra de progreso */}
      {count > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {stories.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-brand" : "w-2 bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Ir a la historia ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
