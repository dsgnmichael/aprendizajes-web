'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

export function CancelConfirmation({ id }: { id: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleCancel = async () => {
    setState('loading')
    try {
      const res = await fetch('/api/parent-club/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Error')
      setState('done')
      setTimeout(() => router.push('/'), 3000)
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="text-center rounded-[2rem] bg-white p-8 shadow-lifted">
        <CheckCircle2 className="mx-auto size-12 text-green-600" />
        <h1 className="mt-4 text-2xl font-black">Tu lugar fue liberado</h1>
        <p className="mt-2 text-ink-muted">
          Gracias por avisarnos. Si cambiás de opinión, contactanos por WhatsApp.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center rounded-[2rem] bg-white p-8 shadow-lifted">
      <AlertTriangle className="mx-auto size-12 text-amber-500" />
      <h1 className="mt-4 text-2xl font-black">¿Cancelar tu asistencia?</h1>
      <p className="mt-2 text-ink-muted">
        Tu lugar se liberará para otro padre que lo necesite. Esta acción no se puede deshacer.
      </p>
      {state === 'error' && (
        <p className="mt-4 text-sm text-red-600 font-bold">Ocurrió un error. Intentá de nuevo.</p>
      )}
      <button
        type="button"
        onClick={handleCancel}
        disabled={state === 'loading'}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-brand-deep disabled:opacity-50"
      >
        {state === 'loading' ? <Loader2 className="size-4 animate-spin" /> : 'Sí, cancelar mi lugar'}
      </button>
    </div>
  )
}
