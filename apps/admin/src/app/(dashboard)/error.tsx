'use client'

import { Button } from '@repo/ui/components/button'

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div role="alert" className="bg-card rounded-xl border p-8 text-center">
      <h2 className="text-lg font-semibold">No pudimos cargar esta sección</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Puede ser un problema temporal de conexión con la base de datos. Intenta nuevamente.
      </p>
      <Button className="mt-4" onClick={reset}>
        Reintentar
      </Button>
    </div>
  )
}
