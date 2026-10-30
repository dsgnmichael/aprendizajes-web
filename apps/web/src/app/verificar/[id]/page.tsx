import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@repo/database'
import { SUPPORT_AREA_LABELS } from '@repo/domain'

async function getRegistration(id: string) {
  await connection()
  try {
    const c = await collections()
    const _id = new ObjectId(id)
    const doc = await c.parentClubRegistrations.findOne({ _id })
    return doc
  } catch {
    return null
  }
}

async function VerificarContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const registration = await getRegistration(id)
  if (!registration) notFound()

  const statusConfig = {
    nuevo: { label: 'Pendiente', color: 'bg-blue-100 text-blue-800' },
    contactado: { label: 'Contactado', color: 'bg-amber-100 text-amber-800' },
    integrado: { label: 'Integrado', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Canceló', color: 'bg-red-100 text-red-800' },
  }
  const status = statusConfig[registration.status as keyof typeof statusConfig] || statusConfig.nuevo

  return (
    <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-lifted">
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[#ece7f3] text-brand text-2xl">✓</div>
        <h1 className="text-2xl font-black text-brand">Credencial verificada</h1>
        <p className="mt-2 text-sm text-ink-muted">Club de Padres Aprendizajess</p>
      </div>
      <div className="mt-8 space-y-3">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase">Nombre</p>
          <p className="font-bold">{registration.fullName}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase">Email</p>
          <p className="font-bold">{registration.email}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase">Estado</p>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${status.color}`}>{status.label}</span>
        </div>
        {registration.supportAreas && registration.supportAreas.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Áreas de interés</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {registration.supportAreas.map((area: string) => (
                <span key={area} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {SUPPORT_AREA_LABELS[area as keyof typeof SUPPORT_AREA_LABELS] || area}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="border-t pt-3 mt-3">
          <p className="text-xs text-muted-foreground">Fecha de registro: {new Date(registration.createdAt).toLocaleDateString('es-CL')}</p>
        </div>
      </div>
</div>
  )
}

export default function VerificarPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="min-h-screen bg-canvas py-16 px-4">
      <Suspense fallback={
        <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-lifted text-center">
          <p className="text-muted-foreground">Cargando credencial...</p>
        </div>
      }>
        <VerificarContent params={params} />
      </Suspense>
    </main>
  )
}
