'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f4f0', color: '#1a1a1a', display: 'grid', placeItems: 'center', minHeight: '100svh', margin: 0 }}>
        <main style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontWeight: 900 }}>El sitio no está disponible en este momento</h1>
          <p>Intenta nuevamente en unos segundos.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 999, border: 0, background: '#4d2a80', color: '#fff', fontWeight: 800 }}>
            Reintentar
          </button>
        </main>
      </body>
    </html>
  )
}
