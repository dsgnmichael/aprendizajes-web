'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X, Megaphone, Pause, Play } from 'lucide-react'
import type { PopupDocument } from '@repo/domain'

export function PopupManager() {
  const pathname = usePathname()
  const [activePopup, setActivePopup] = useState<PopupDocument | null>(null)
  const [popups, setPopups] = useState<PopupDocument[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMinimizing, setIsMinimizing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  // Cargar popups
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

  // Evaluar ruta
  useEffect(() => {
    if (loading) return
    const match = popups.find((p) => p.active && (p.targetPath === '*' || p.targetPath === pathname))
    
    if (match) {
      setActivePopup(match)
      setIsMinimized(false)
      setIsMinimizing(false)
      setIsPaused(false)
      setTimeLeft(match.autoCloseSeconds)
    } else {
      setActivePopup(null)
    }
  }, [pathname, popups, loading])

  // Temporizador (se detiene si isPaused es true)
  useEffect(() => {
    if (!activePopup || isMinimized || isMinimizing || isPaused || activePopup.autoCloseSeconds <= 0 || timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsMinimizing(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [activePopup, isMinimized, isMinimizing, isPaused, timeLeft])

  // Efecto para finalizar la animación
  useEffect(() => {
    if (isMinimizing) {
      const timer = setTimeout(() => {
        setIsMinimized(true)
        setIsMinimizing(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isMinimizing])

  const handleRestore = () => {
    setIsMinimized(false)
    setIsPaused(false)
    if (activePopup) {
      setTimeLeft(activePopup.autoCloseSeconds)
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

  if (!activePopup || !activePopup.image?.url) return null

  // Vista Minimizada
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300">
        {/* Efecto de onda expansiva detrás del botón */}
        
        <button
          onClick={handleRestore}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all font-medium ${getButtonClass(activePopup.floatingButtonStyle)}`}
        >
          <Megaphone className="size-5 animate-pulse" />
          ) : (
            <div className="p-10 text-center bg-gray-100 rounded-lg">Imagen no válida en producción (fue subida en local). Por favor, actualízala en el admin.</div>
          )}
          <span className="text-sm font-medium">Ver Publicidad</span>
        </button>
      </div>
    )
  }

  const progressPercent = activePopup.autoCloseSeconds > 0 
    ? ((activePopup.autoCloseSeconds - timeLeft) / activePopup.autoCloseSeconds) * 100 
    : 100

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-500 ${
        isMinimizing 
          ? 'bg-transparent pointer-events-none backdrop-blur-none' 
          : 'bg-black/60 backdrop-blur-sm animate-in fade-in'
      }`}
    >
      <div 
        className={`relative w-full max-w-2xl transition-all duration-500 ease-in-out origin-bottom-right ${
          isMinimizing 
            ? 'scale-0 opacity-0 translate-x-1/4 translate-y-1/4' 
            : 'scale-100 opacity-100'
        }`}
      >
        {/* Controles Superiores */}
        <div className="absolute -top-12 right-0 flex items-center gap-2">
          {/* Botón de Pausa (solo si hay tiempo de autocierre) */}
          {activePopup.autoCloseSeconds > 0 && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors cursor-pointer"
              aria-label={isPaused ? "Reanudar tiempo" : "Pausar tiempo"}
            >
              {isPaused ? <Play className="size-5 fill-current" /> : <Pause className="size-5 fill-current" />}
            </button>
          )}
          
          {/* Botón Cerrar */}
          <button
            onClick={() => setIsMinimizing(true)}
            className="rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors cursor-pointer"
            aria-label="Minimizar publicidad"
          >
            <X className="size-6" />
          </button>
        </div>
        
        <div className="relative overflow-hidden rounded-xl bg-white shadow-2xl inline-block w-full text-center">
          <img
            src={activePopup.image.url}
            alt={activePopup.name}
            className="max-h-[80vh] w-auto max-w-full object-contain mx-auto block min-h-[200px]"
          />
          
          {activePopup.buttons.map((btn) => (
            <a
              key={btn.id}
              href={btn.url}
              target="_blank"
              rel="noopener noreferrer"
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

          {/* Barra de progreso */}
          {activePopup.autoCloseSeconds > 0 && (
            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-black/20">
              <div 
                className={`h-full transition-all duration-1000 ease-linear ${isPaused ? 'bg-amber-500' : 'bg-purple-600'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
