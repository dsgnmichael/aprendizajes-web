import Link from 'next/link'
import {
  ArrowUpRight,
  CalendarClock,
  FilePen,
  MessageSquareQuote,
  PanelsTopLeft,
  UsersRound,
} from 'lucide-react'
import { getDashboardStats, getHomePageDraft } from '@repo/data-access'
import { can, type AppointmentStatus } from '@repo/domain'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { PageHeader } from '@/components/shell/page-header'
import { requirePermission } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_VARIANT } from '@/lib/labels'
import { publicBaseUrl } from '@/lib/urls'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await requirePermission('dashboard:read')
  const [stats, home] = await Promise.all([getDashboardStats(), getHomePageDraft()])
  const homePublished = home.publishedRevision !== null
  const homePending = homePublished && home.revision > (home.publishedRevision ?? 0)
  const tiles = [
    {
      label: 'Publicados',
      value: stats.professionals.published,
      hint: `${stats.professionals.draft} en borrador`,
      icon: UsersRound,
      href: '/professionals',
    },
    {
      label: 'Cambios sin publicar',
      value: stats.professionals.pendingChanges,
      hint: 'Perfiles con borrador pendiente',
      icon: FilePen,
      href: '/professionals',
    },
    {
      label: 'Solicitudes nuevas',
      value: stats.appointments.new,
      hint: `${stats.appointments.lastWeek} en los últimos 7 días`,
      icon: CalendarClock,
      href: '/appointments?status=new',
    },
    {
      label: 'Testimonios visibles',
      value: stats.testimonials,
      hint: 'Manuales habilitados',
      icon: MessageSquareQuote,
      href: '/testimonials',
    },
  ] as const

  return (
    <>
      <PageHeader
        title={`Hola, ${user.name.split(' ')[0] || 'equipo'}`}
        description="Resumen del sitio público y la actividad reciente."
        actions={
          <Button asChild variant="outline">
            <a href={publicBaseUrl()} target="_blank" rel="noreferrer">
              Ver sitio público <ArrowUpRight />
            </a>
          </Button>
        }
      />
      {can(user.role, 'landing:write') && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PanelsTopLeft className="text-muted-foreground size-4" aria-hidden />
              Página de inicio
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-1.5">
              Landing de venta del sitio público.
              <Badge variant={homePublished ? 'success' : 'secondary'}>
                {homePublished ? 'Publicada' : 'Sin publicar'}
              </Badge>
              {homePending && <Badge variant="warning">Cambios sin publicar</Badge>}
            </CardDescription>
            <CardAction>
              <Button asChild size="sm">
                <Link href="/home-page">Editar</Link>
              </Button>
            </CardAction>
          </CardHeader>
        </Card>
      )}
      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <CardDescription>{tile.label}</CardDescription>
                <CardAction>
                  <tile.icon className="text-muted-foreground size-4" aria-hidden />
                </CardAction>
                <CardTitle className="text-3xl font-semibold tabular-nums">{tile.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">{tile.hint}</CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Últimas solicitudes de cita</CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/appointments">Ver todas</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {stats.recentAppointments.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Aún no hay solicitudes.
              </p>
            ) : (
              <ul className="divide-y">
                {stats.recentAppointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/appointments?open=${a.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {a.name}
                      </Link>
                      <p className="text-muted-foreground truncate text-xs">
                        {a.professionalName} · {formatDateTime(a.createdAt)}
                      </p>
                    </div>
                    <Badge variant={APPOINTMENT_STATUS_VARIANT[a.status as AppointmentStatus]}>
                      {APPOINTMENT_STATUS_LABEL[a.status as AppointmentStatus]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            {can(user.role, 'audit:read') && (
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/audit">Auditoría</Link>
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Sin actividad registrada.
              </p>
            ) : (
              <ol className="space-y-3">
                {stats.recentActivity.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span
                      className="bg-primary/60 mt-1.5 size-1.5 shrink-0 rounded-full"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="font-mono text-xs">{a.action}</span>
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {a.actor} · {formatDateTime(a.timestamp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
