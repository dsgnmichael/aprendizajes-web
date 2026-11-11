'use client'
import { PopupManager } from '@/components/site/PopupManager'

export default function TestPopupPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-black text-brand mb-4">Prueba de Popup (Aislada)</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">El popup aparecerá automáticamente en 3 segundos.</p>
      <PopupManager />
    </div>
  )
}
