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
  const [countdown, setCountdown] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMinimizing, setIsMinimizing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides: PopupSlide[] = useMemo(() => {
    if (!activePopup) return []
    if (activePopup.slides && activePopup.slides.length > 0) return activePopup.slides
    if (activePopup.image) return [{ id: 'legacy', image: activePopup.image, buttons: [] }]
    return []
  }, [activePopup])

  const activeSlide = slides[currentSlide] ?? slides[0]
  const totalDuration = activePopup ? activePopup.autoCloseSeconds * slides.length : 0

  const handleClose = useCallback(() => {
    setIsMinimizing(true)
    if (activePopup) {
      sessionStorage.setItem('dismissed_popup_' + activePopup.id, 'true')
      track('popup_closed', { name: activePopup.name, id: activePopup.id })
    }
  }, [activePopup])

  // 1. Cargar Popups
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

  // 2. Detectar qué popup mostrar y encender el contador
  useEffect(() => {
    if (loading) return

    const searchParams = new URLSearchParams(window.location.search)
    const forcedPopupId = searchParams.get('popup')
    
    if (forcedPopupId) {
      const forcedPopup = popups.find((p) => p.id === forcedPopupId)
      if (forcedPopup) {
        sessionStorage.removeItem('dismissed_popup_' + forcedPopup.id)
        setActivePopup(forcedPopup)
        setShouldShow(true)
        setCountdown(0)
        setIsMinimized(false)
        setIsPaused(false)
        setCurrentSlide(0)
        setTimeLeft(forcedPopup.autoCloseSeconds * (forcedPopup.slides?.length || 1))
        track('popup_shown', { name: forcedPopup.name, id: forcedPopup.id })
        return
      }
    }

    const match = popups.find((p) => p.active && (p.targetPath === '*' || p.targetPath === pathname))
    
    if (match) {
      const dismissedKey = 'dismissed_popup_' + match.id
      if (sessionStorage.getItem(dismissedKey)) {
        setActivePopup(match)
        setIsMinimized(true)
        setShouldShow(false)
        setCountdown(0)
      } else {
        setActivePopup((prev) => (prev?.id === match.id ? prev : match))
        setShouldShow(false)
        setIsMinimized(false)
        setCountdown((prev) => (prev > 0 ? prev : 3))
      }
    } else {
      setActivePopup(null)
      setShouldShow(false)
      setCountdown(0)
    }
    // IMPORTANTE: Quitamos 'countdown' de aquí para evitar el bucle infinito
  }, [pathname, popups, loading])

  // 3. Efecto del contador de cuenta regresiva
  useEffect(() => {
    if (countdown <= 0 || !activePopup) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, activePopup])

  // 4. Cuando el contador llega a 0, mostrar el popup
  useEffect(() => {
    if (countdown === 0 && activePopup && !shouldShow && !isMinimized && !sessionStorage.getItem('dismissed_popup_' + activePopup.id)) {
      setShouldShow(true)
      setCurrentSlide(0)
      setTimeLeft(activePopup.autoCloseSeconds * (activePopup.slides?.length || 1))
      track('popup_shown', { name: activePopup.name, id: activePopup.id })
    }
  }, [countdown, activePopup, shouldShow, isMinimized])

  // 5. Manejar el cierre automático del popup
  useEffect(() => {
    if (!shouldShow || !activePopup || isMinimized || isMinimizing || isPaused || (activePopup.autoCloseSeconds ?? 0) <= 0 || timeLeft <= 0) return
    
    if (timeLeft <= 1) {
      handleClose()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => {
        const nextTime = prev - 1
        const elapsed = totalDuration - nextTime
        const expectedSlide = Math.floor(elapsed / activePopup.autoCloseSeconds)
        
        if (expectedSlide > currentSlide && expectedSlide < slides.length) {
          setCurrentSlide(expectedSlide)
        }
        
        return nextTime
      })
    }, 1000)
    
    return () => clearTimeout(timer)
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
      if (e.key === 'Escape' && shouldShow && !isMinimized && !isMinimizing) handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shouldShow, isMinimized, isMinimizing, handleClose])

  const handleRestore = () => {
    setIsMinimized(false)
    setIsPaused(true) // Pausar auto-cierre al restaurar
    setShouldShow(true)
    if (activePopup) {
      // Reiniciar el tiempo por si el usuario decide darle a Play
      setTimeLeft(activePopup.autoCloseSeconds * (activePopup.slides?.length || 1))
      track('popup_restored', { name: activePopup.name, id: activePopup.id })
    }
  }

  return (
    <LazyMotion features={loadMotionFeatures}>
      
      {/* CONTADOR FLOTANTE EN LA ESQUINA */}
      {countdown > 0 && activePopup && !shouldShow && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-white/95 backdrop-blur-md text-brand font-bold px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border-2 border-brand/20 flex items-center gap-2.5 animate-bounce">
          <Megaphone className="size-5" />
          <span>Anuncio en {countdown}</span>
        </div>
      )}

      {shouldShow && !isMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <m.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: isMinimizing ? 0 : 1 }} 
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); }}
          />
          
          <m.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[340px] sm:max-w-[420px] bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              {(activePopup?.autoCloseSeconds ?? 0) > 0 && (
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="grid size-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md"
                >
                  {isPaused ? <Play className="size-4 ml-0.5" /> : <Pause className="size-4" />}
                </button>
              )}
              <button
                onClick={handleClose}
                className="grid size-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md"
              >
                <X className="size-5" />
              </button>
            </div>

            {activeSlide && <PopupSlideView slide={activeSlide} index={currentSlide} total={slides.length} onNavigate={setCurrentSlide} />}
          </m.div>
        </div>
      )}

      {isMinimized && activePopup && (
        <button
          onClick={handleRestore}
          className="fixed bottom-6 right-6 z-40 bg-brand text-white p-4 rounded-full shadow-lg hover:bg-brand-deep transition-transform hover:scale-110"
          title="Ver anuncio"
        >
          <Megaphone className="size-6" />
        </button>
      )}
    </LazyMotion>
  )
}

function PopupSlideView({ slide, index, total, onNavigate }: { slide: PopupSlide; index: number; total: number; onNavigate: (i: number) => void }) {
  return (
    <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] bg-gray-100">
      <img 
        src={typeof slide.image === 'string' ? slide.image : (slide.image as any)?.url} 
        alt="Popup" 
        className="w-full h-full object-cover" 
      />
      {slide.buttons?.map((btn, i) => (
        <a
          key={i}
          href={btn.url}
          target={btn.url.startsWith('http') ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="absolute -translate-x-1/2 -translate-y-1/2 bg-brand text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          style={{ left: `${btn.x}%`, top: `${btn.y}%`, backgroundColor: btn.style === 'white' ? '#fff' : '#4d2a80', color: btn.style === 'white' ? '#4d2a80' : '#fff' }}
        >
          {btn.label}
        </a>
      ))}
      
      {total > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`size-2 rounded-full transition-all ${i === index ? 'bg-brand w-4' : 'bg-brand/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
