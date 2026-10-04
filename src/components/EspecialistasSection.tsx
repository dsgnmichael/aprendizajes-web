'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

type MediaDoc = { url?: string | null; alt?: string | null }
type FotoField = MediaDoc | number | null | undefined
type EspecialidadItem = { texto: string }

export interface Especialista {
  id: number | string
  nombre: string
  slug: string
  profesion: string
  foto: FotoField
  foto_circular?: FotoField
  frase?: string | null
  bio?: string | null
  especialidades?: EspecialidadItem[] | null
  orden?: number | null
}

interface Props {
  especialistas: Especialista[]
  selectedSlug: string
  onSelect: (slug: string) => void
}

const getUrl = (f: FotoField): string | null => {
  if (!f) return null
  if (typeof f === 'object' && 'url' in f && f.url) return f.url
  return null
}

export default function EspecialistasSection({ especialistas, selectedSlug, onSelect }: Props) {
  const [popKey, setPopKey] = useState(0)

  if (!especialistas.length) return null

  const selected = especialistas.find((e) => e.slug === selectedSlug) || especialistas[0]
  const total = especialistas.length
  const selectedIndex = especialistas.findIndex((e) => e.slug === selected.slug)
  const centerIdx = Math.floor(total / 2)

  const visible: { esp: Especialista; isCenter: boolean; offset: number }[] = []
  for (let i = 0; i < total; i++) {
    const sourceIdx = (selectedIndex + (i - centerIdx) + total) % total
    visible.push({
      esp: especialistas[sourceIdx],
      isCenter: i === centerIdx,
      offset: i - centerIdx,
    })
  }

  const goPrev = () => {
    const newIdx = (selectedIndex - 1 + total) % total
    setPopKey((k) => k + 1)
    onSelect(especialistas[newIdx].slug)
  }
  const goNext = () => {
    const newIdx = (selectedIndex + 1) % total
    setPopKey((k) => k + 1)
    onSelect(especialistas[newIdx].slug)
  }

  const handleCircleClick = (slug: string) => {
    if (slug === selected.slug) return
    setPopKey((k) => k + 1)
    onSelect(slug)
  }

  const circleClass = (isCenter: boolean, isOuter: boolean): string => {
    if (isCenter) {
      return 'w-20 h-20 md:w-36 md:h-36 ring-4 ring-[#4d2a80] shadow-2xl animate-circle-reveal'
    }
    const base = 'w-12 h-12 md:w-20 md:h-20 hover:scale-110 active:scale-95 transition-transform duration-300'
    if (isOuter) return 'w-8 h-8 md:w-20 md:h-20 hover:scale-110 active:scale-95 transition-transform duration-300'
    return base
  }

  return (
    <section className="relative z-20 -mt-16 md:-mt-24 pb-12 md:pb-16" id="especialistas">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">

        <div className="relative flex items-center justify-center gap-1 md:gap-6">

          <button
            onClick={goPrev}
            type="button"
            aria-label="Anterior"
            className="shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#cfc4e0] hover:scale-110 active:scale-90 transition-all duration-300 z-10"
          >
            <ChevronLeft size={22} className="text-[#4d2a80]" />
          </button>

          <div className="flex items-center justify-center gap-1.5 md:gap-5">
            {visible.map(({ esp, isCenter, offset }) => {
              const img = getUrl(esp.foto_circular)
              const isOuter = Math.abs(offset) === 2
              const classNameCircle =
                'relative rounded-full overflow-hidden shrink-0 ' +
                circleClass(isCenter, isOuter)

              return (
                <button
                  key={esp.id}
                  onClick={() => handleCircleClick(esp.slug)}
                  type="button"
                  aria-label={'Ver a ' + esp.nombre}
                  className={classNameCircle}
                >
                  {img ? (
                    <>
                      <Image
                        src={img}
                        alt={esp.nombre}
                        fill
                        className={isCenter ? 'object-cover' : 'object-cover grayscale'}
                      />
                      {!isCenter && (
                        <div className="absolute inset-0 bg-[#4d2a80] mix-blend-color opacity-70 pointer-events-none" />
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-neutral-300 flex items-center justify-center text-neutral-500 text-[10px] md:text-xs font-bold text-center px-1">
                      Sube la<br />foto circular
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={goNext}
            type="button"
            aria-label="Siguiente"
            className="shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#cfc4e0] hover:scale-110 active:scale-90 transition-all duration-300 z-10"
          >
            <ChevronRight size={22} className="text-[#4d2a80]" />
          </button>

        </div>

      </div>
    </section>
  )
}