'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, KeyRound, ScanLine, Loader2 } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

export function PetsActions({ showFormButton, showInfoButton }: { showFormButton?: boolean, showInfoButton?: boolean }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'scan' | 'manual'>('scan')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Abrir automáticamente si la URL tiene ?open=true
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('open') === 'true') {
      setIsOpen(true)
      setTimeout(() => {
        document.getElementById('diario-mascotas')?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [])

  // Bloquear el scroll del fondo cuando el popup está abierto para evitar temblores
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  // Iniciar y detener la cámara correctamente
  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null

    const startScanner = async () => {
      try {
        html5Qrcode = new Html5Qrcode("qr-reader")
        scannerRef.current = html5Qrcode
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
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
      // Pequeño delay para asegurar que el div sea visible antes de iniciar
      setTimeout(startScanner, 100)
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
      // Verificamos si el código existe en la base de datos
      const res = await fetch(`/api/escaner/check?code=${cleanCode}`)
      const data = await res.json()
      
      if (data.exists) {
        router.push(`/mascota/${cleanCode}`)
      } else {
        setError('Código inválido. Verifica e intenta de nuevo.')
        setMode('manual') // Si falló el escaneo, mostramos el manual
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

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
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

            {/* Contenedor de la cámara: IMPORTANTE mantenerlo en el DOM para que la cámara no falle */}
            <div className={`overflow-hidden rounded-2xl border-2 border-dashed border-brand/30 p-2 relative min-h-[250px] flex-col justify-center items-center ${mode === 'scan' ? 'flex' : 'hidden'}`}>
              <div id="qr-reader" className="w-full max-w-[250px] overflow-hidden rounded-xl"></div>
              {cameraError && <p className="text-red-500 text-xs text-center mt-2">{cameraError}</p>}
              <style dangerouslySetInnerHTML={{__html: `
                #qr-reader video { object-fit: cover !important; border-radius: 12px; }
                #qr-reader { border: none !important; }
              `}} />
              <p className="text-center text-xs text-gray-500 pt-2">Apunta la cámara hacia el código QR del alumno.</p>
            </div>

            {/* Formulario manual */}
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
          </div>
        </div>
      )}
    </div>
  )
}
