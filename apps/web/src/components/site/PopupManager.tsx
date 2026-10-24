'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { X, Megaphone, Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { m, LazyMotion, type PanInfo } from 'motion/react'
import { loadMotionFeatures } from '@/lib/motion'
import type { PopupDocument, PopupSlide } from '@repo/domain'
import { track } from '@/lib/analytics'

export function PopupManager() {
  const pathname = usePathname()
  const [activePopup, setActivePopup] = useState<PopupDocument | null>(null)
  const [popups, setPopups] = useState<PopupDocument[]>([])
  const [loading, setLoading] = useState(true)
  
  const [shouldShow, setShouldShow] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMinimizing, setIsMinimizing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1)

  // Normalizar las diapositivas (slides)
  const slides: PopupSlide[] = useMemo(() => {
    if (!activePopup) return []
    // Si tiene la nueva estructura (varias imágenes), la usamos
    if (activePopup.slides && activePopup.slides.length > 0) {
      return activePopup.slides
    }
    // Si es un popup viejo (solo una imagen), la adaptamos a slide
    if (activePopup.image) {
      return [{ id: 'legacy', image: activePopup.image, buttons: activePopup.buttons || [] }]
    }
    return []
  }, [activePopup])

  const activeSlide = slides[currentSlide] ?? slides[0]

  const handleClose = useCallback(() => {
    setIsMinimizing(true)
    if (activePopup) {
      sessionStorage.setItem('dismissed_popup_' + activePopup.id, 'true')
      track('popup_closed', { name: activePopup.name, id: activePopup.id })
    }
  }, [activePopup])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/popups')
        if (res.ok) {
          const data = await res.json()
          setPopups(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (loading) return
    const match = popups.find((p) => p.active && (p.targetPath === '*' || p.targetPath === pathname))
    
    if (match) {
      const dismissedKey = 'dismissed_popup_' + match.id
      if (sessionStorage.getItem(dismissedKey)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActivePopup(match)
        setIsMinimized(true)
        setShouldShow(false)
        return
      }

      const timer = setTimeout(() => {
        setActivePopup(match)
        setShouldShow(true)
        setIsMinimized(false)
        setIsMinimizing(false)
        setIsPaused(false)
        setCurrentSlide(0)
        setTimeLeft(match.autoCloseSeconds)
        track('popup_shown', { name: match.name, id: match.id })
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setActivePopup(null)
      setShouldShow(false)
    }
  }, [pathname, popups, loading])

  // Temporizador y avance de carrusel
  useEffect(() => {
    if (!shouldShow || !activePopup || isMinimized || isMinimizing || isPaused || activePopup.autoCloseSeconds <= 0 || timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Si hay más de una imagen, pasamos a la siguiente
          if (slides.length > 1) {
            setDirection(1)
            setCurrentSlide((s) => (s + 1) % slides.length)
            return activePopup.autoCloseSeconds // Reiniciar tiempo
          } else {
            handleClose()
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [shouldShow, activePopup, isMinimized, isMinimizing, isPaused, timeLeft, slides.length, handleClose])

  useEffect(() => {
    if (isMinimizing) {
      const timer = setTimeout(() => {
        setIsMinimized(true)
        setIsMinimizing(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isMinimizing])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shouldShow && !isMinimized && !isMinimizing) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shouldShow, isMinimized, isMinimizing, handleClose])

  const handleRestore = () => {
    setIsMinimized(false)
    setIsPaused(false)
    setShouldShow(true)
    if (activePopup) {
      setTimeLeft(activePopup.autoCloseSeconds)
      track('popup_restored', { name: activePopup.name, id: activePopup.id })
    }
  }

  const handleButtonClick = (label: string) => {
    if (activePopup) {
      track('popup_cta_click', { name: activePopup.name, id: activePopup.id, button: label })
    }
  }

  const getButtonClass = (style: string | undefined) => {
    switch (style) {
      case 'light': return 'bg-[#c4b5fd] text-[#4c1d95]'
      case 'white': return 'bg-white text-[#4c1d95] border border-gray-100'
      case 'dark':
      default: return 'bg-[#5b21b6] text-white'
    }
  }

  if (!activePopup || slides.length === 0 || !activeSlide) return null

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300">
        <button
          onClick={handleRestore}
          className={`flex items-center justify-center size-12 rounded-full shadow-lg hover:scale-110 transition-all opacity-70 hover:opacity-100 ${getButtonClass(activePopup.floatingButtonStyle)}`}
          aria-label="Ver publicidad"
        >
          <Megaphone className="size-5 animate-pulse" />
        </button>
      </div>
    )
  }

  if (!shouldShow) return null

  const progressPercent = activePopup.autoCloseSeconds > 0 
    ? ((activePopup.autoCloseSeconds - timeLeft) / activePopup.autoCloseSeconds) * 100 
    : 100

  const hasMultipleSlides = slides.length > 1

  const nextSlide = () => {
    setDirection(1)
    setCurrentSlide((s) => (s + 1) % slides.length)
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentSlide((s) => (s - 1 + slides.length) % slides.length)
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50 || info.velocity.x < -400) nextSlide()
    else if (info.offset.x > 50 || info.velocity.x > 400) prevSlide()
  }

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <div 
        onClick={handleClose}
        className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-500 ${
          isMinimizing 
            ? 'bg-transparent pointer-events-none backdrop-blur-none' 
            : 'bg-black/60 backdrop-blur-sm animate-in fade-in'
        }`}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-2xl transition-all duration-500 ease-in-out origin-bottom-right ${
            isMinimizing 
              ? 'scale-0 opacity-0 translate-x-1/4 translate-y-1/4' 
              : 'scale-100 opacity-100'
          }`}
        >
          {/* Controles Superiores */}
          <div className="absolute -top-12 right-0 flex items-center gap-2 z-50">
            {activePopup.autoCloseSeconds > 0 && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors cursor-pointer"
                aria-label={isPaused ? "Reanudar tiempo" : "Pausar tiempo"}
              >
                {isPaused ? <Play className="size-5 fill-current" /> : <Pause className="size-5 fill-current" />}
              </button>
            )}
            <button
              onClick={handleClose}
              className="rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors cursor-pointer"
              aria-label="Cerrar publicidad"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Contenedor del Carrusel */}
          <div className="relative overflow-hidden rounded-xl bg-white shadow-2xl w-full text-center">
            
            <m.div
              key={currentSlide}
              drag={hasMultipleSlides ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full cursor-grab active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeSlide.image.url}
                alt={activePopup.name}
                className="max-h-[80vh] w-auto max-w-full object-contain mx-auto block min-h-[200px] select-none"
                draggable={false}
              />
              
              {(activePopup.buttons || []).map((btn) => (
                <a
                  key={btn.id}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleButtonClick(btn.label)}
                  className={`absolute rounded-full px-6 py-2.5 text-sm font-bold shadow-lg animate-popup-btn-grow ${getButtonClass(btn.style)}`}
                  style={{
                    left: `${btn.x}%`,
                    top: `${btn.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {btn.label}
                </a>
              ))}
              {activeSlide.buttons?.map((btn) => (
                <a
                  key={btn.id}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleButtonClick(btn.label)}
                  className={`absolute rounded-full px-6 py-2.5 text-sm font-bold shadow-lg animate-popup-btn-grow ${getButtonClass(btn.style)}`}
                  style={{
                    left: `${btn.x}%`,
                    top: `${btn.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {btn.label}
                </a>
              ))}
            </m.div>

            {/* Flechas de navegación (solo si hay más de 1) */}
            {hasMultipleSlides && (
              <>
                <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-md z-10 transition-transform hover:scale-110">
                  <ChevronLeft className="size-6" />
                </button>
                <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-md z-10 transition-transform hover:scale-110">
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}

            {/* Indicadores (Puntos) */}
            {hasMultipleSlides && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDirection(i > currentSlide ? 1 : -1)
                      setCurrentSlide(i)
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-6 bg-[#5b21b6]' : 'w-2 bg-[#5b21b6]/40 hover:bg-[#5b21b6]/60'
                    }`}
                    aria-label={`Ir a la imagen ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Barra de progreso (temporizador) */}
            {activePopup.autoCloseSeconds > 0 && (
              <div className="absolute bottom-0 left-0 h-1.5 w-full bg-black/10 z-0">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${isPaused ? 'bg-amber-500' : 'bg-purple-600'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </LazyMotion>
  )
}
