'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { X, KeyRound, ScanLine, Loader2 } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

export function PetsActions({ showFormButton, showInfoButton }: { showFormButton?: boolean, showInfoButton?: boolean }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'scan' | 'manual'>('scan')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('open') === 'true') {
      setIsOpen(true)
      setTimeout(() => {
        document.getElementById('diario-mascotas')?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [])

  // Bloqueo total del scroll y del layout shift
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      // Forzamos que el body no se mueva si hay un scroll interno
      document.body.style.paddingRight = '0px'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null

    const startScanner = async () => {
      try {
        html5Qrcode = new Html5Qrcode("qr-reader")
        scannerRef.current = html5Qrcode
        await html5Qrcode.start(
          { facingMode: "environment" },
          { 
            fps: 10, 
            qrbox: { width: 200, height: 200 }
          },
          async (decodedText) => {
            if (html5Qrcode?.isScanning) {
              await html5Qrcode.stop()
              const extractedCode = decodedText.split('/').pop() || decodedText
              await verifyAndNavigate(extractedCode)
            }
          },
          () => {}
        )
      } catch (err) {
        setCameraError('No se pudo acceder a la cámara.')
      }
    }

    if (isOpen && mode === 'scan') {
      setTimeout(startScanner, 150)
    }

    return () => {
      if (html5Qrcode && html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(console.error)
      }
    }
  }, [isOpen, mode])

  const verifyAndNavigate = async (inputCode: string) => {
    const cleanCode = inputCode.trim()
    if (!cleanCode) return
    
    setIsChecking(true)
    setError('')
    
    try {
      const res = await fetch(`/api/escaner/check?code=${cleanCode}`)
      const data = await res.json()
      
      if (data.exists) {
        router.push(`/mascota/${cleanCode}`)
      } else {
        setError('Código inválido. Verifica e intenta de nuevo.')
        setMode('manual')
      }
    } catch (e) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsChecking(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyAndNavigate(code)
  }

  const cameraStyles = `
    #qr-reader {
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      border-radius: 12px;
      overflow: hidden;
    }
    #qr-reader video {
      object-fit: cover !important;
      width: 100% !important;
      height: 100% !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 12px;
    }
    #qr-reader__scan_region {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
      {showFormButton !== false && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto rounded-full bg-brand text-white font-black uppercase px-8 py-4 shadow-glow hover:bg-brand-deep transition-all text-center"
        >
          Llenar diario
        </button>
      )}
      
      {showInfoButton && (
        <button 
          disabled
          title="Próximamente"
          className="w-full sm:w-auto rounded-full bg-white border-2 border-gray-200 text-gray-400 font-black uppercase px-8 py-4 cursor-not-allowed text-center"
        >
          Conoce a las mascotas
        </button>
      )}

      {/* Usamos createPortal y posicionamiento absoluto para evitar cualquier temblor */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen bg-black/60 backdrop-blur-md overflow-hidden">
          <style dangerouslySetInnerHTML={{ __html: cameraStyles }} />
          
          {/* Contenedor interno con posición absoluta y transform para centrado inmune a cambios */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
            <div className="bg-white rounded-[2rem] w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition-colors z-10"
              >
                <X className="size-5" />
              </button>

              <div className="text-center mb-6 mt-2">
                <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[#ece7f3] text-brand">
                  <KeyRound className="size-8" />
                </div>
                <h2 className="text-2xl font-black text-brand">Accede a tu Diario</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Escanea tu QR o ingresa tu código para llenar el diario de la mascota.
                </p>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-full mb-6">
                <button
                  onClick={() => { setMode('scan'); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-full transition-all ${mode === 'scan' ? 'bg-white shadow-sm text-brand' : 'text-gray-500'}`}
                >
                  <ScanLine className="size-4" /> Escanear QR
                </button>
                <button
                  onClick={() => { setMode('manual'); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-full transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-brand' : 'text-gray-500'}`}
                >
                  <KeyRound className="size-4" /> Escribir Código
                </button>
              </div>

              <div className={`overflow-hidden rounded-2xl border-2 border-dashed border-brand/30 p-2 relative flex-col justify-center items-center mx-auto w-full max-w-[280px] aspect-square ${mode === 'scan' ? 'flex' : 'hidden'}`}>
                <div id="qr-reader" className="w-full h-full"></div>
                {cameraError && <p className="text-red-500 text-xs text-center mt-2">{cameraError}</p>}
              </div>

              {mode === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <label className="block text-sm font-bold mb-1">Tu Código</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ej: e4dcab29d0"
                      className="w-full rounded-full border-2 p-3.5 px-6 text-base transition-colors focus:outline-none focus:border-brand focus:bg-white bg-gray-50"
                      maxLength={20}
                      disabled={isChecking}
                    />
                    {error && <p className="text-red-500 text-xs font-bold mt-1.5 pl-4">{error}</p>}
                  </div>

                  <button type="submit" disabled={isChecking} className="w-full flex items-center justify-center rounded-full bg-brand text-white font-black uppercase py-4 hover:bg-brand-deep transition-colors disabled:opacity-50">
                    {isChecking ? <Loader2 className="size-5 animate-spin" /> : 'Ingresar'}
                  </button>
                </form>
              )}
              
              {mode === 'scan' && (
                 <p className="text-center text-xs text-gray-500 pt-4">Apunta la cámara hacia el código QR del alumno.</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
