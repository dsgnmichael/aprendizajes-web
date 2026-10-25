import type { Metadata } from 'next'
import Link from 'next/link'
import { listParentClubRegistrationsByType } from '@repo/data-access'
import { ArrowLeft } from 'lucide-react'
import { ParentClubTable } from '@/components/parent-club/parent-club-table'

export const metadata: Metadata = {
  title: 'Respuestas - Invitación Especial',
}

export default async function InvitacionEspecialPage() {
  const registrations = await listParentClubRegistrationsByType('invitacion-especial')

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/formularios"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a formularios
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invitación Especial</h1>
          <p className="text-muted-foreground">
            {registrations.length === 0
              ? 'Aún no hay respuestas.'
              : `${registrations.length} ${registrations.length === 1 ? 'persona ha confirmado' : 'personas han confirmado'} su asistencia.`}
          </p>
        </div>
      </div>

      <ParentClubTable registrations={registrations} />
    </div>
  )
}
