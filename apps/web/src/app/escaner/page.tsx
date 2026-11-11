'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useRouter } from 'next/navigation'

export default function EscanerPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (scannerRef.current) return
    const html5QrCode = new Html5Qrcode("reader")
    scannerRef.current = html5QrCode

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        html5QrCode.stop().then(() => {
          let code = decodedText
          if (decodedText.includes('/')) {
            const parts = decodedText.split('/')
            code = parts[parts.length - 1] || decodedText
          }
          router.push(`/mascota/${code}`)
        })
      },
      () => {}
    ).catch((err) => {
      setError('No se pudo acceder a la cámara. Verifica los permisos.')
      console.error(err)
    })

    return () => {
      if (html5QrCode.isScanning) html5QrCode.stop().catch(console.error)
    }
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-brand">Escáner del Diario de la Mascota</h1>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-md text-center">{error}</div>}
      <div id="reader" className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-lg border-4 border-brand"></div>
      <p className="text-muted-foreground mt-6 text-center text-lg">Apunta la cámara al código QR del alumno para acceder a su diario.</p>
    </div>
  )
}
