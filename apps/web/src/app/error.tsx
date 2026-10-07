'use client'

import { useEffect } from 'react'

/** Shown when a server dependency (e.g. the database) is temporarily unavailable. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[web] render error', error.digest ?? '')
  }, [error])
  return (
    <section className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center" role="alert">
      <p className="script text-[4.5rem] leading-none text-brand">un momento</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight uppercase italic">No pudimos cargar esta página</h1>
      <p className="mt-3 text-lg text-ink-muted">Estamos teniendo un problema temporal. Intenta nuevamente en unos segundos.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex min-h-12 items-center rounded-button bg-brand px-7 font-black tracking-wide text-on-brand uppercase hover:bg-brand-deep"
      >
        Reintentar
      </button>
    </section>
  )
}
