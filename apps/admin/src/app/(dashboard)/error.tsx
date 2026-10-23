'use client'

import { Button } from '@repo/ui/components/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div role="alert" className="bg-card rounded-xl border p-8 text-center max-w-2xl mx-auto mt-10">
      <h2 className="text-xl font-bold text-red-600 mb-4">Error de Aplicación</h2>
      <p className="text-muted-foreground mb-4">
        Ha ocurrido un error en el servidor. Detalle técnico:
      </p>
      <pre className="bg-red-50 text-red-900 p-4 rounded-md overflow-auto text-sm text-left border border-red-200 mb-6">
        {error.message || 'Error desconocido'}
        {error.digest && `\n\nDigest: ${error.digest}`}
      </pre>
      <Button onClick={reset}>
        Reintentar
      </Button>
    </div>
  )
}
