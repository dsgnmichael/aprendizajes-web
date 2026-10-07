import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@repo/ui/components/button'

export const metadata = { title: 'Acceso denegado' }

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-sm text-center">
        <ShieldAlert className="text-muted-foreground mx-auto size-10" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold">Acceso denegado</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Tu rol no tiene permisos para ver esta sección.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">Volver al panel</Link>
        </Button>
      </div>
    </main>
  )
}
