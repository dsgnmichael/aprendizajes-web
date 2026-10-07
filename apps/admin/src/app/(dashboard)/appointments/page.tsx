import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import {
  getAppointmentRequest,
  listAppointmentRequests,
  listProfessionals,
} from '@repo/data-access'
import { APPOINTMENT_STATUSES, can, type AppointmentStatus } from '@repo/domain'
import { Badge } from '@repo/ui/components/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'
import { AppointmentSheet } from '@/components/appointments/appointment-sheet'
import { ListFilters } from '@/components/list-filters'
import { Pagination } from '@/components/pagination'
import { EmptyState } from '@/components/shell/empty-state'
import { PageHeader } from '@/components/shell/page-header'
import { requirePermission } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_VARIANT } from '@/lib/labels'

export const metadata = { title: 'Solicitudes de cita' }

const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)

export default async function AppointmentsPage({ searchParams }: PageProps<'/appointments'>) {
  const user = await requirePermission('appointments:read')
  const params = await searchParams
  const status = APPOINTMENT_STATUSES.includes(str(params.status) as AppointmentStatus)
    ? (str(params.status) as AppointmentStatus)
    : undefined
  const professionalId = str(params.professional)
  const q = str(params.q)?.slice(0, 100)
  const page = Math.max(1, Number(str(params.page) ?? 1) || 1)
  const openId = str(params.open)

  const [result, professionals, open] = await Promise.all([
    listAppointmentRequests({ status, professionalId, search: q, page }),
    listProfessionals({ status: 'all' }),
    openId ? getAppointmentRequest(openId) : Promise.resolve(null),
  ])
  const linkParams = { status, professional: professionalId, q, page: String(page) }
  const openHref = (id: string) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(linkParams)) if (v) sp.set(k, v)
    sp.set('open', id)
    return `/appointments?${sp}`
  }

  return (
    <>
      <PageHeader
        title="Solicitudes de cita"
        description="Recibidas desde el formulario interno de cada profesional."
      />
      <ListFilters
        searchPlaceholder="Buscar por nombre, email o teléfono"
        selects={[
          {
            name: 'status',
            label: 'Estado',
            options: APPOINTMENT_STATUSES.map((s) => ({
              value: s,
              label: APPOINTMENT_STATUS_LABEL[s],
            })),
          },
          {
            name: 'professional',
            label: 'Profesional',
            options: professionals.map((p) => ({ value: p.id, label: p.name })),
          },
        ]}
      />
      {result.items.length === 0 ? (
        <EmptyState
          icon={<CalendarClock />}
          title="Sin solicitudes"
          description="Cuando alguien solicite una cita desde el sitio aparecerá aquí."
        />
      ) : (
        <div className="bg-card overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Persona</TableHead>
                <TableHead className="hidden md:table-cell">Profesional</TableHead>
                <TableHead className="hidden lg:table-cell">Preferencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Recibida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link
                      href={openHref(a.id)}
                      scroll={false}
                      className="font-medium hover:underline"
                    >
                      {`${a.firstName} ${a.lastName}`.trim()}
                    </Link>
                    <p className="text-muted-foreground text-xs">{a.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{a.professionalName}</TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                    {[a.preferredDate, a.preferredTime, a.modality].filter(Boolean).join(' · ') ||
                      '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={APPOINTMENT_STATUS_VARIANT[a.status]}>
                      {APPOINTMENT_STATUS_LABEL[a.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                    {formatDateTime(a.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        params={{ status, professional: professionalId, q }}
        basePath="/appointments"
      />
      {open && (
        <AppointmentSheet
          key={open.id}
          canWrite={can(user.role, 'appointments:write')}
          detail={{
            id: open.id,
            name: `${open.firstName} ${open.lastName}`.trim(),
            email: open.email,
            phone: open.phone,
            professionalName: open.professionalName,
            modality: open.modality,
            service: open.service,
            preferredDate: open.preferredDate,
            preferredTime: open.preferredTime,
            message: open.message,
            consentText: open.consentText,
            entry: open.entry,
            status: open.status,
            notes: open.notes,
            createdAtLabel: formatDateTime(open.createdAt),
          }}
        />
      )}
    </>
  )
}
