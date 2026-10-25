import type { Metadata } from 'next'
import Link from 'next/link'
import { getFormResponseCounts } from '@repo/data-access'
import { Card } from '@repo/ui/components/card'
import { ArrowRight, HeartHandshake, ClipboardList } from 'lucide-react'
import { FormCardActions } from '@/components/parent-club/form-card-actions'
import { MarkAsReadTrigger } from '@/components/parent-club/mark-as-read-trigger'

export const metadata: Metadata = {
  title: 'Formularios y respuestas',
}

const AVAILABLE_FORMS = [
  {
    type: 'invitacion-especial',
    name: 'Invitación Especial',
    description: 'Formulario de confirmación de asistencia a la sesión gratuita del Club de Padres.',
    publicUrl: '/invitacion-especial',
    icon: HeartHandshake,
    available: true,
  },
  {
    type: 'suscripcion-club',
    name: 'Suscripción al Club de Padres',
    description: 'Formulario de inscripción formal a la membresía del Club de Padres.',
    publicUrl: null,
    icon: ClipboardList,
    available: false,
  },
]

export default async function FormulariosPage() {
  const counts = await getFormResponseCounts()
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000'

  return (
    <div className="flex flex-col gap-6 p-6">
      <MarkAsReadTrigger />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Formularios y respuestas</h1>
        <p className="text-muted-foreground">
          Gestiona los formularios activos del sitio y consulta las respuestas recibidas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AVAILABLE_FORMS.map((form) => {
          const Icon = form.icon
          const count = counts[form.type] || 0

          if (!form.available) {
            return (
              <Card key={form.type} className="relative flex flex-col overflow-hidden p-6 opacity-60">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                    Próximamente
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold">{form.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="rounded-full bg-muted px-2.5 py-1">En desarrollo</span>
                </div>
              </Card>
            )
          }

          return (
            <Card key={form.type} className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <FormCardActions publicUrl={form.publicUrl} publicBaseUrl={publicBaseUrl} />
              </div>
              <h3 className="mt-4 text-base font-bold">{form.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">{count}</span>
                  <span className="text-xs text-muted-foreground">
                    {count === 1 ? 'respuesta' : 'respuestas'}
                  </span>
                </div>
              </div>
              <Link
                href={`/formularios/${form.type}`}
                className="mt-4 inline-flex items-center justify-between rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Ver respuestas
                <ArrowRight className="size-4" />
              </Link>
            </Card>
          )
        })}
      </div>

      <Card className="p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <strong>Nota:</strong> Los formularios se definen por código. Si necesitás agregar un nuevo formulario, contactá al desarrollador.
        </p>
      </Card>
    </div>
  )
}
