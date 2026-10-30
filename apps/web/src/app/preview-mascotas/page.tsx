import { Suspense } from 'react'
import { PetsWall } from '@/components/landing/PetsWall'

export const instant = false

export default function PreviewMascotasPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <Suspense fallback={<div className="p-8 text-center">Cargando historias...</div>}>
        <PetsWall />
      </Suspense>
    </main>
  )
}
