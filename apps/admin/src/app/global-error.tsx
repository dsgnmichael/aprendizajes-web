'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: 'system-ui',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100dvh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1>Algo salió mal</h1>
          <button type="button" onClick={reset}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
