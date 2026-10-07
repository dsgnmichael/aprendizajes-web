import { listAuditLogs } from '@repo/data-access'
import { AUDIT_ACTIONS } from '@repo/domain'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'
import { ListFilters } from '@/components/list-filters'
import { Pagination } from '@/components/pagination'
import { PageHeader } from '@/components/shell/page-header'
import { requirePermission } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'

export const metadata = { title: 'Auditoría' }

const ENTITY_TYPES = [
  'professional',
  'testimonial',
  'appointmentRequest',
  'integration',
  'media',
  'siteSettings',
  'user',
]

export default async function AuditPage({ searchParams }: PageProps<'/audit'>) {
  await requirePermission('audit:read')
  const params = await searchParams
  const action =
    typeof params.action === 'string' &&
    (AUDIT_ACTIONS as readonly string[]).includes(params.action)
      ? params.action
      : undefined
  const entityType =
    typeof params.entity === 'string' && ENTITY_TYPES.includes(params.entity)
      ? params.entity
      : undefined
  const page = Math.max(1, Number(typeof params.page === 'string' ? params.page : 1) || 1)
  const result = await listAuditLogs({ action, entityType, page, pageSize: 50 })

  return (
    <>
      <PageHeader
        title="Auditoría"
        description="Registro de operaciones administrativas. Nunca incluye contraseñas, tokens ni secretos."
      />
      <ListFilters
        selects={[
          {
            name: 'action',
            label: 'Acción',
            options: AUDIT_ACTIONS.map((a) => ({ value: a, label: a })),
          },
          {
            name: 'entity',
            label: 'Entidad',
            options: ENTITY_TYPES.map((e) => ({ value: e, label: e })),
          },
        ]}
      />
      <div className="bg-card overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Fecha</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead className="hidden md:table-cell">Entidad</TableHead>
              <TableHead className="hidden lg:table-cell">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center text-sm">
                  Sin registros.
                </TableCell>
              </TableRow>
            )}
            {result.items.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatDateTime(log.timestamp)}
                </TableCell>
                <TableCell className="text-sm">
                  {log.actor.email}
                  <span className="text-muted-foreground block text-xs">{log.actor.role}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">{log.action}</TableCell>
                <TableCell className="hidden text-xs md:table-cell">
                  {log.entityType}
                  {log.entityId && (
                    <span className="text-muted-foreground block font-mono">{log.entityId}</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground hidden max-w-xs truncate font-mono text-xs lg:table-cell">
                  {Object.entries(log.metadata)
                    .map(([k, v]) => `${k}=${String(v)}`)
                    .join(' · ')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        params={{ action, entity: entityType }}
        basePath="/audit"
      />
    </>
  )
}
