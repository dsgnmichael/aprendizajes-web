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

  const slides: PopupSlide[] = useMemo(() => {
    if (!activePopup) return []
    if (activePopup.slides && activePopup.slides.length > 0) {
      return activePopup.slides
    }
    if (activePopup.image) {
      return [{ id: 'legacy', image: activePopup.image, buttons: [] }]
    }
    return []
  }, [activePopup])

  const activeSlide = slides[currentSlide] ?? slides[0]

  // Duración total = tiempo por imagen * cantidad de imágenes
  const totalDuration = activePopup ? activePopup.autoCloseSeconds * slides.length : 0

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
        // Inicializar el tiempo total del carrusel
        setTimeLeft(match.autoCloseSeconds * (match.slides?.length || 1))
        track('popup_shown', { name: match.name, id: match.id })
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setActivePopup(null)
      setShouldShow(false)
    }
  }, [pathname, popups, loading])

  // Manejar la cuenta regresiva y el cambio de slide automático
  useEffect(() => {
    if (!shouldShow || !activePopup || isMinimized || isMinimizing || isPaused || activePopup.autoCloseSeconds <= 0 || timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleClose()
          return 0
        }
        
        const nextTime = prev - 1
        const elapsed = totalDuration - nextTime
        const expectedSlide = Math.floor(elapsed / activePopup.autoCloseSeconds)
        
        // Si el tiempo transcurrido indica que debemos cambiar de slide
        if (expectedSlide > currentSlide && expectedSlide < slides.length) {
          setCurrentSlide(expectedSlide)
        }
        
        return nextTime
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [shouldShow, activePopup, isMinimized, isMinimizing, isPaused, timeLeft, totalDuration, currentSlide, slides.length, handleClose])

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
      setTimeLeft(totalDuration - (currentSlide * activePopup.autoCloseSeconds))
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

  const progressPercent = totalDuration > 0 
    ? ((totalDuration - timeLeft) / totalDuration) * 100 
    : 100

  const hasMultipleSlides = slides.length > 1

  const nextSlide = () => {
    const next = (currentSlide + 1) % slides.length
    setCurrentSlide(next)
    setTimeLeft(totalDuration - (next * activePopup.autoCloseSeconds))
  }

  const prevSlide = () => {
    const prev = (currentSlide - 1 + slides.length) % slides.length
    setCurrentSlide(prev)
    setTimeLeft(totalDuration - (prev * activePopup.autoCloseSeconds))
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
          style={{ aspectRatio: slides[0]?.image?.width && slides[0]?.image?.height ? `${slides[0].image.width} / ${slides[0].image.height}` : '4 / 5' }}
          className={`relative max-h-[85vh] w-auto max-w-[90vw] sm:max-w-[60vw] transition-all duration-500 ease-in-out origin-bottom-right ${
            isMinimizing 
              ? 'scale-0 opacity-0 translate-x-1/4 translate-y-1/4' 
              : 'scale-100 opacity-100'
          }`}
        >
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

          <div className="relative overflow-hidden rounded-xl bg-transparent shadow-2xl h-full w-full">
            <m.div
              className="flex h-full w-full cursor-grab active:cursor-grabbing select-none"
              animate={{ x: `-${currentSlide * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag={hasMultipleSlides ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            >
              {slides.map((slide) => (
                <div key={slide.id} className="relative w-full h-full flex-shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.image.url}
                    alt={activePopup.name}
                    className="w-full h-full object-contain select-none pointer-events-none"
                    draggable={false}
                  />
                  
                  {(activePopup.buttons || []).map((btn) => (
                    <a
                      key={btn.id}
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleButtonClick(btn.label)}
                      className={`absolute rounded-full px-5 py-2 text-[0.8rem] font-bold shadow-lg animate-popup-btn-grow ${getButtonClass(btn.style)}`}
                      style={{
                        left: `${btn.x}%`,
                        top: `${btn.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {btn.label}
                    </a>
                  ))}

                  {slide.buttons?.map((btn) => (
                    <a
                      key={btn.id}
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleButtonClick(btn.label)}
                      className={`absolute rounded-full px-5 py-2 text-[0.8rem] font-bold shadow-lg animate-popup-btn-grow ${getButtonClass(btn.style)}`}
                      style={{
                        left: `${btn.x}%`,
                        top: `${btn.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {btn.label}
                    </a>
                  ))}
                </div>
              ))}
            </m.div>

            {hasMultipleSlides && (
              <>
                <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black p-2 rounded-full shadow-xl z-20 transition-transform hover:scale-110">
                  <ChevronLeft className="size-6" />
                </button>
                <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black p-2 rounded-full shadow-xl z-20 transition-transform hover:scale-110">
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}

            {hasMultipleSlides && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentSlide(i)
                      setTimeLeft(totalDuration - (i * activePopup.autoCloseSeconds))
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-6 bg-[#5b21b6]' : 'w-2 bg-[#5b21b6]/40 hover:bg-[#5b21b6]/60'
                    }`}
                    aria-label={`Ir a la imagen ${i + 1}`}
                  />
                ))}
              </div>
            )}

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
