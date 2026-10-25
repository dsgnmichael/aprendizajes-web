import type { Metadata } from 'next'
import { ParentClubForm } from '@/components/parent-club/ParentClubForm'
import { getSite } from '@/lib/data'
import { absoluteUrl } from '@/lib/site-url'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return {
    title: 'Invitación especial - ' + site.organizationName,
    description: 'Reserva tu lugar en nuestra primera sesión gratuita. Un espacio pensado para ti.',
    alternates: { canonical: absoluteUrl('/club-de-padres') },
  }
}

export default function ParentClubPage() {
  return (
    <main className="min-h-screen bg-canvas py-16 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <p className="script text-4xl text-brand">Invitación Especial</p>
          <h1 className="mt-4 text-4xl font-black text-ink uppercase tracking-tight">Reserva tu lugar</h1>
          <p className="mt-4 text-lg text-ink-muted">
            Te invitamos a nuestra primera sesión gratuita, un espacio pensado para ti donde compartiremos el corazón de nuestro Club de Padres.
          </p>
        </div>
        
        <ParentClubForm />
      </div>
    </main>
  )
}
