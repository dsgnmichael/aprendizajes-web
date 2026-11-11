'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { X, Megaphone, Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { m, LazyMotion } from 'motion/react'
import { loadMotionFeatures } from '@/lib/motion'
import type { PopupDocument, PopupSlide } from '@repo/domain'

const MOCK_POPUPS: any[] = [
  {
    id: 'test-popup',
    name: 'Test Popup',
    active: true,
    targetPath: '*',
    autoCloseSeconds: 5,
    slides: [
      { id: 's1', image: { url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1000&auto=format&fit=crop' }, buttons: [{ id: 'b1', label: 'Postúlate (Diapo 1)', url: '/', style: 'dark', x: 50, y: 70 }] },
      { id: 's2', image: { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop' }, buttons: [] },
      { id: 's3', image: { url: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=1000&auto=format&fit=crop' }, buttons: [] }
    ],
    buttons: [{ id: 'bg1', label: 'Botón Global', url: '/', style: 'white', x: 50, y: 90 }],
    createdAt: new Date(), updatedAt: new Date()
  }
];

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
  const [currentSlide, setCurrentSlide] = useState(0)
  const [openedManually, setOpenedManually] = useState(false)

  const slides: PopupSlide[] = useMemo(() => {
    if (!activePopup) return []
    return activePopup.slides || []
  }, [activePopup])

  const activeSlide = slides[currentSlide]
  const durationPerSlide = activePopup?.autoCloseSeconds || 0

  const handleClose = useCallback(() => {
    setIsMinimizing(true)
    if (activePopup) {
      sessionStorage.setItem('dismissed_popup_' + activePopup.id, 'true')
    }
  }, [activePopup])

  // 1. Cargar Popups
  useEffect(() => {
    if (pathname === '/test-popup') {
      setPopups(MOCK_POPUPS)
      setLoading(false)
      return
    }
    fetch('/api/popups')
      .then(res => res.ok ? res.json() : [])
      .then(data => setPopups(data))
      .finally(() => setLoading(false))
  }, [pathname])

  // 2. Detectar Popup
  useEffect(() => {
    if (loading) return
    const searchParams = new URLSearchParams(window.location.search)
    const forcedId = searchParams.get('popup')
    const match = forcedId ? popups.find(p => p.id === forcedId) : popups.find(p => p.active && (p.targetPath === '*' || p.targetPath === pathname))
    
    if (match) {
      if (sessionStorage.getItem('dismissed_popup_' + match.id) && !forcedId) {
        setActivePopup(match)
        setIsMinimized(true)
        setShouldShow(false)
        setCountdown(0)
      } else {
        if (!forcedId) setOpenedManually(false)
        else setOpenedManually(true)
        
        setActivePopup(match)
        setShouldShow(!!forcedId)
        setIsMinimized(false)
        setCountdown(forcedId ? 0 : 3)
        setCurrentSlide(0)
        setIsPaused(false)
      }
    }
  }, [pathname, popups, loading])

  // 3. Contador
  useEffect(() => {
    if (countdown <= 0 || !activePopup) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, activePopup])

  // 4. Mostrar
  useEffect(() => {
    if (countdown === 0 && activePopup && !shouldShow && !isMinimized) {
      setShouldShow(true)
      setCurrentSlide(0)
      setIsPaused(false)
    }
  }, [countdown, activePopup, shouldShow, isMinimized])

  // 5. Avance de diapositivas
  useEffect(() => {
    if (!shouldShow || !activePopup || isMinimized || isMinimizing || isPaused || durationPerSlide <= 0) return
    const timer = setTimeout(() => {
      if (currentSlide === slides.length - 1) {
        if (openedManually) {
          setCurrentSlide(0)
        } else {
          handleClose()
        }
      } else {
        setCurrentSlide(prev => prev + 1)
      }
    }, durationPerSlide * 1000)
    return () => clearTimeout(timer)
  }, [shouldShow, activePopup, isMinimized, isMinimizing, isPaused, currentSlide, slides.length, durationPerSlide, handleClose, openedManually])

  // 6. Minimizar
  useEffect(() => {
    if (isMinimizing) {
      const timer = setTimeout(() => { setIsMinimized(true); setIsMinimizing(false) }, 500)
      return () => clearTimeout(timer)
    }
  }, [isMinimizing])

  const handleRestore = () => {
    setIsMinimized(false)
    setIsPaused(false)
    setShouldShow(true)
    setOpenedManually(true)
    setCurrentSlide(0)
  }

  const handleDragEnd = (e: any, { offset }: any) => {
    if (offset.x < -50 && currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else if (offset.x > 50 && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }
  }

  const imageSrc = activeSlide?.image ? (typeof activeSlide.image === 'string' ? activeSlide.image : (activeSlide.image as any)?.url) : ''

  return (
    <LazyMotion features={loadMotionFeatures}>
      {countdown > 0 && !shouldShow && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-white/95 text-brand font-bold px-5 py-3.5 rounded-2xl shadow-lg border-2 border-brand/20 flex items-center gap-2.5 animate-bounce">
          <Megaphone className="size-5" /> <span>Anuncio en {countdown}</span>
        </div>
      )}

      {shouldShow && !isMinimized && activePopup && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: isMinimizing ? 0 : 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <div className="relative flex flex-col items-center max-w-[340px] sm:max-w-[420px] w-full z-10">
            
            <m.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
              
              <div className="absolute top-4 right-4 z-30 flex gap-2">
                {durationPerSlide > 0 && (
                  <button onClick={() => setIsPaused(!isPaused)} className="grid size-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md">
                    {isPaused ? <Play className="size-4 ml-0.5" /> : <Pause className="size-4" />}
                  </button>
                )}
                <button onClick={handleClose} className="grid size-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md">
                  <X className="size-5" />
                </button>
              </div>

              <m.div 
                className="relative w-full aspect-[4/5] sm:aspect-[3/4] bg-gray-100 cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
              >
                {imageSrc ? <img src={imageSrc} alt="Popup" className="w-full h-full object-cover pointer-events-none" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400">Imagen no disponible</div>}

                {slides.length > 1 && (
                  <>
                    <button onClick={() => setCurrentSlide(p => Math.max(0, p - 1))} disabled={currentSlide === 0} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 rounded-full p-2 shadow-md hover:bg-white disabled:opacity-30 pointer-events-auto">
                      <ChevronLeft className="size-5 text-brand" />
                    </button>
                    <button onClick={() => setCurrentSlide(p => Math.min(slides.length - 1, p + 1))} disabled={currentSlide === slides.length - 1} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 rounded-full p-2 shadow-md hover:bg-white disabled:opacity-30 pointer-events-auto">
                      <ChevronRight className="size-5 text-brand" />
                    </button>
                  </>
                )}

                {(() => {
                  const persistentButtons = slides[0]?.buttons || [];
                  const globalButtons = activePopup?.buttons || [];
                  const allButtons = [...persistentButtons, ...globalButtons];

                  return allButtons.map((btn, i) => (
                    <a key={`btn-${i}`} href={btn.url} className="absolute -translate-x-1/2 -translate-y-1/2 px-6 py-2.5 rounded-full font-bold shadow-lg hover:scale-105 transition-transform z-20 text-sm whitespace-nowrap pointer-events-auto"
                      style={{ 
                        left: `${btn.x}%`, 
                        top: `${btn.y}%`, 
                        backgroundColor: btn.style === 'white' ? '#fff' : btn.style === 'light' ? '#ece7f3' : '#4d2a80', 
                        color: btn.style === 'white' ? '#4d2a80' : btn.style === 'light' ? '#4d2a80' : '#fff' 
                      }}>
                      {btn.label}
                    </a>
                  ));
                })()}

                {slides.length > 0 && durationPerSlide > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 z-30">
                     <m.div key={currentSlide} initial={{ width: 0 }} animate={{ width: isPaused ? '0%' : '100%' }} transition={{ duration: durationPerSlide, ease: 'linear' }} className="h-full bg-brand" />
                  </div>
                )}
              </m.div>
            </m.div>

            {slides.length > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                {slides.map((_, i) => (
                  <button
                    key={`dot-${i}`}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === currentSlide ? "w-8 bg-brand" : "w-2.5 bg-white/60 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {isMinimized && activePopup && (
        <button onClick={handleRestore} className="fixed bottom-6 right-6 z-40 bg-brand text-white p-4 rounded-full shadow-lg hover:bg-brand-deep transition-transform hover:scale-110">
          <Megaphone className="size-6" />
        </button>
      )}
    </LazyMotion>
  )
}
