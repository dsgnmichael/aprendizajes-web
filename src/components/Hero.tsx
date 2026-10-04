'use client'

import React from 'react'
import Image from 'next/image'
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

const STAR = String.fromCharCode(9733)

const CONTACTO = {
  whatsapp: '+581214452',
  whatsappUrl: 'https://wa.me/581214452',
  instagram: 'https://instagram.com/aprendizajess',
  tiktok: 'https://tiktok.com/@aprendizajess',
  correo: 'mailto:Psicoaprendizajess@gmail.com',
  googleReview: 'https://g.page/r/CasQmX8m6tyyEBM/review',
}

type MediaDoc = { url?: string | null; alt?: string | null }
type FotoField = MediaDoc | number | null | undefined
type EspecialidadItem = { texto: string; icono?: string | null }

export interface HeroEspecialista {
  nombre: string
  profesion: string
  foto: FotoField
  frase?: string | null
  bio?: string | null
  especialidades?: EspecialidadItem[] | null
}

export interface Testimonio {
  id: number | string
  nombre: string
  texto: string
  calificacion?: number | null
  fecha?: string | null
}

interface HeroProps {
  especialista: HeroEspecialista | null
  testimonios: Testimonio[]
}

const getUrl = (f: FotoField): string | null => {
  if (!f) return null
  if (typeof f === 'object' && 'url' in f && f.url) return f.url
  return null
}

const ICONOS: Record<string, (size: number) => React.ReactElement> = {
  nino: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  ),
  cerebro: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v6M12 22v-6M4.93 10.93l4.24 4.24M14.83 4.83l4.24 4.24M2 12h6M22 12h-6M4.93 13.07l4.24-4.24M14.83 19.17l4.24-4.24" />
    </svg>
  ),
  calendario: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M8 2v4M16 2v4M2 10h20" />
    </svg>
  ),
  corazon: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  libro: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  lapiz: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  burbuja: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  mano: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v5M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  ),
  video: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 8-6 4 6 4V8z" />
      <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
    </svg>
  ),
  estrella: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
}

const FALLBACK_ICONOS = ['nino', 'cerebro', 'calendario']

const iconoDe = (item: EspecialidadItem, index: number): string => {
  if (item.icono && ICONOS[item.icono]) return item.icono
  return FALLBACK_ICONOS[index % FALLBACK_ICONOS.length]
}

const socialIcons = (size: number = 16) => (
  <>
    <a href={CONTACTO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[#4d2a80] hover:text-[#3a1d66] transition-colors" aria-label="WhatsApp">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
    <a href={CONTACTO.instagram} target="_blank" rel="noopener noreferrer" className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[#4d2a80] hover:text-[#3a1d66] transition-colors" aria-label="Instagram">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    </a>
    <a href={CONTACTO.tiktok} target="_blank" rel="noopener noreferrer" className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[#4d2a80] hover:text-[#3a1d66] transition-colors" aria-label="TikTok">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    </a>
    <a href={CONTACTO.correo} className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[#4d2a80] hover:text-[#3a1d66] transition-colors" aria-label="Correo">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    </a>
  </>
)

const atributosDesktop = (especialidades: EspecialidadItem[] | null | undefined) => {
  const items = (especialidades || []).slice(0, 3)
  if (!items.length) return null
  return (
    <>
      {items.map((e, i) => {
        const iconFn = ICONOS[iconoDe(e, i)]
        return (
          <div key={i} className="flex flex-col items-center text-center text-white gap-1.5">
            <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-full border-2 border-white/70 flex items-center justify-center">
              {iconFn(18)}
            </div>
            <p className="text-[10px] lg:text-xs leading-tight font-bold">{e.texto}</p>
          </div>
        )
      })}
    </>
  )
}

const atributosMobile = (especialidades: EspecialidadItem[] | null | undefined) => {
  const items = (especialidades || []).slice(0, 3)
  if (!items.length) return null
  return (
    <>
      {items.map((e, i) => {
        const iconFn = ICONOS[iconoDe(e, i)]
        return (
          <div key={i} className="flex flex-col items-center text-center text-white gap-1">
            <div className="w-7 h-7 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
              {iconFn(13)}
            </div>
            <p className="text-[9px] leading-tight font-bold">{e.texto}</p>
          </div>
        )
      })}
    </>
  )
}

// ----------------------------------------------------------------
// CARRUSEL DE TESTIMONIOS (con auto-rotacion cada 5 segundos)
// ----------------------------------------------------------------
function TestimoniosCarrusel({ testimonios }: { testimonios: Testimonio[] }) {
  const [idx, setIdx] = useState(0)
  const [timerKey, setTimerKey] = useState(0)

  useEffect(() => {
    if (!testimonios.length) return
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % testimonios.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [timerKey, testimonios.length])

  if (!testimonios.length) return null

  const t = testimonios[idx]
  const total = testimonios.length

  const goPrev = () => {
    setIdx((i) => (i - 1 + total) % total)
    setTimerKey((k) => k + 1)
  }
  const goNext = () => {
    setIdx((i) => (i + 1) % total)
    setTimerKey((k) => k + 1)
  }

  const calificacion = t.calificacion || 5

  return (
    <div>
      <div key={t.id} className="bg-cream rounded-2xl p-4 md:p-5 shadow-lg hover-lift animate-fade-in-up min-h-[120px]">
        <p className="text-purple-dark font-black text-xs md:text-sm mb-2 uppercase">{t.nombre}</p>
        <p className="text-ink text-[11px] md:text-xs leading-relaxed italic">
          {t.texto}
        </p>
        <div className="flex gap-1 mt-3 text-yellow-500 text-xl md:text-2xl">
          {Array.from({ length: calificacion }).map((_, i) => (
            <span
              key={i}
              className="star-grow"
              style={{ animationDelay: (i * 0.15) + 's' }}
            >
              {STAR}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 w-full flex items-center justify-center gap-3">
        <button
          onClick={goPrev}
          type="button"
          aria-label="Testimonio anterior"
          className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#cfc4e0] hover:scale-110 active:scale-90 transition-all duration-300"
        >
          <ChevronLeft size={16} className="text-[#4d2a80]" />
        </button>

        <div className="flex gap-1 items-center">
          {testimonios.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIdx(i)
                setTimerKey((k) => k + 1)
              }}
              aria-label={'Ver testimonio ' + (i + 1)}
              className={
                'h-1.5 rounded-full transition-all duration-300 ' +
                (i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60')
              }
            />
          ))}
        </div>

        <button
          onClick={goNext}
          type="button"
          aria-label="Testimonio siguiente"
          className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#cfc4e0] hover:scale-110 active:scale-90 transition-all duration-300"
        >
          <ChevronRight size={16} className="text-[#4d2a80]" />
        </button>
      </div>
    </div>
  )
}
const addTestimonialLink = () => (
  <div className="mt-4 w-full flex justify-center">
    <a
      href={CONTACTO.googleReview}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 font-bold text-xs md:text-sm tracking-wider uppercase no-underline animate-link-pulse"
    >
      <Plus size={16} strokeWidth={3} className="text-white group-hover:rotate-90 transition-transform duration-300" />
      <span className="shimmer-text">Agregar testimonio</span>
    </a>
  </div>
)

export default function Hero({ especialista, testimonios }: HeroProps) {
  const nombre = especialista?.nombre || 'Aprendizajes'
  const profesion = especialista?.profesion || ''
  const fotoUrl = getUrl(especialista?.foto)
  const frase = especialista?.frase || 'Aprender puede ser divertido.'
  const bio = especialista?.bio || 'Descubriendo que aprender no tiene por que ser sinonimo de tristeza, sino de juego y descubrimiento.'
  const especialidades = especialista?.especialidades || null

  return (
    <section className="relative bg-cream overflow-hidden pb-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 md:pt-10">

        <div className="hidden md:block">

          <div className="grid grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
            <div className="text-left">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black italic text-ink leading-none tracking-tight">{nombre}</h1>
              <p className="font-script text-3xl lg:text-4xl xl:text-5xl text-purple-dark leading-none mt-1 lg:mt-2">{profesion}</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg lg:text-2xl xl:text-3xl font-black italic text-ink leading-none tracking-tight">NUESTRO EQUIPO</h2>
              <p className="font-script text-3xl lg:text-4xl xl:text-5xl text-purple-dark leading-none mt-1 lg:mt-2">De Experiencia</p>
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-[#8777b5] rounded-[2rem] lg:rounded-[2.5rem]">

              {fotoUrl && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[450px] lg:h-[520px] xl:h-[600px] flex items-end justify-center pointer-events-none z-10">
                  <Image
                    src={fotoUrl}
                    alt={nombre}
                    width={600}
                    height={720}
                    className="h-full w-auto object-contain object-bottom drop-shadow-xl"
                    priority
                  />
                </div>
              )}

              <div className="grid grid-cols-3 relative z-20">
                <div className="p-5 lg:p-8 xl:p-10 space-y-3 lg:space-y-5 flex flex-col justify-center">
                  <h3 className="text-[22px] lg:text-[32px] xl:text-[43px] font-black italic text-white leading-[1.05]">
                    {frase}
                  </h3>
                  <p className="text-white/90 text-xs lg:text-sm xl:text-base leading-relaxed">
                    {bio}
                  </p>
                  <a href={CONTACTO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#4d2a80] text-cream rounded-full px-4 lg:px-5 xl:px-6 py-2 lg:py-2.5 xl:py-3 font-bold text-[11px] lg:text-xs xl:text-sm hover:bg-purple-dark hover:scale-105 active:scale-95 transition-all duration-300 self-start animate-float-button">
                    <Plus size={14} strokeWidth={3} />
                    AGENDAR CITA
                  </a>
                  <div className="inline-flex items-center gap-1 lg:gap-2 bg-[#cfc4e0] rounded-full p-1.5 lg:p-2 self-start">
                    {socialIcons(25)}
                  </div>
                </div>

                <div className="col-span-1"></div>

                <div className="p-5 lg:p-8 xl:p-10 space-y-4 lg:space-y-5 flex flex-col justify-center">
                  <div className="flex items-start justify-around gap-1 lg:gap-2">
                    {atributosDesktop(especialidades)}
                  </div>
                  <div>
                    <p className="text-center text-white/80 text-[10px] lg:text-xs font-bold tracking-widest mb-2 lg:mb-3">TESTIMONIOS</p>
                    <TestimoniosCarrusel testimonios={testimonios} />
                    {addTestimonialLink()}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        <div className="md:hidden">

          <div className="flex justify-center mb-4 relative z-20">
            <div className="inline-flex items-center gap-1.5 bg-[#cfc4e0] rounded-full p-1.5">
              {socialIcons(28)}
            </div>
          </div>

          <div className="text-left mb-4 relative z-20 pl-[5%]">
            <h1 className="text-2xl font-black italic text-ink leading-none tracking-tight">{nombre}</h1>
            <p className="font-script text-4xl text-purple-dark leading-none mt-1">{profesion}</p>
          </div>

          <div className="relative">
            <div className="relative bg-[#8777b5] rounded-[2rem] pt-6 pb-6">

              {fotoUrl && (
                <div className="absolute -top-[18%] right-[2%] bottom-[28%] flex items-end justify-center pointer-events-none z-10">
                  <Image
                    src={fotoUrl}
                    alt={nombre}
                    width={600}
                    height={720}
                    className="h-full w-auto object-contain object-bottom drop-shadow-xl"
                    priority
                  />
                </div>
              )}

              <div className="relative z-20 px-5">

                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-[18px] font-black italic text-white leading-tight">
                      {frase}
                    </h3>
                    <p className="text-white/90 text-xs leading-relaxed max-w-[58%]">
                      {bio}
                    </p>

                    <div className="flex items-start justify-start gap-2 py-2 max-w-[52%]">
                      {atributosMobile(especialidades)}
                    </div>

                    <a href={CONTACTO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#4d2a80] text-cream rounded-full px-4 py-2 font-bold text-[11px] hover:bg-purple-dark hover:scale-105 active:scale-95 transition-all duration-300 self-start animate-float-button">
                      <Plus size={14} strokeWidth={3} />
                      AGENDAR CITA
                    </a>
                  </div>

                  <div className="w-[42%] shrink-0"></div>
                </div>

                <div className="mt-5">
                  <TestimoniosCarrusel testimonios={testimonios} />
                  {addTestimonialLink()}
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}