'use client'

import { useState, useEffect } from 'react'
import Hero from '@/components/Hero'
import EspecialistasSection, { Especialista } from '@/components/EspecialistasSection'

export interface Testimonio {
  id: number | string
  nombre: string
  texto: string
  calificacion?: number | null
  fecha?: string | null
}

interface Props {
  especialistas: Especialista[]
  testimonios: Testimonio[]
}

export default function HomeClient({ especialistas, testimonios }: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string>('')

  useEffect(() => {
    if (!especialistas.length) return
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('esp')
    if (fromUrl && especialistas.some((e) => e.slug === fromUrl)) {
      setSelectedSlug(fromUrl)
    } else {
      setSelectedSlug((prev) => prev || especialistas[0].slug)
    }
  }, [especialistas])

  if (!especialistas.length) {
    return (
      <div className="min-h-screen bg-cream">
        <Hero especialista={null} testimonios={testimonios} />
      </div>
    )
  }

  const selected = especialistas.find((e) => e.slug === selectedSlug) || especialistas[0]

  return (
    <div className="min-h-screen bg-cream">
      <Hero
        especialista={{
          nombre: selected.nombre,
          profesion: selected.profesion,
          foto: selected.foto,
          frase: selected.frase ?? null,
          bio: selected.bio ?? null,
          especialidades: selected.especialidades ?? null,
        }}
        testimonios={testimonios}
      />
      <EspecialistasSection
        especialistas={especialistas}
        selectedSlug={selected.slug}
        onSelect={setSelectedSlug}
      />
    </div>
  )
}