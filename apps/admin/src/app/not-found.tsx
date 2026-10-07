import Link from 'next/link'
import { Button } from '@repo/ui/components/button'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="mt-2 text-xl font-semibold">No encontramos esta página</h1>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">Volver al panel</Link>
        </Button>
      </div>
    </main>
  )
}
