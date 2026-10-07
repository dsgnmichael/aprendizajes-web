import { UsersRound } from 'lucide-react'
import { getSiteSettings, listProfessionals } from '@repo/data-access'
import {
  can,
  hasUnpublishedChanges,
  PROFESSIONAL_STATUSES,
  type ProfessionalStatus,
} from '@repo/domain'
import { ListFilters } from '@/components/list-filters'
import { NewProfessionalDialog } from '@/components/professionals/new-professional-dialog'
import {
  ProfessionalsTable,
  type ProfessionalRow,
} from '@/components/professionals/professionals-table'
import { EmptyState } from '@/components/shell/empty-state'
import { PageHeader } from '@/components/shell/page-header'
import { requirePermission } from '@/lib/auth'
import { formatDateTime, initials } from '@/lib/format'
import { PROFESSIONAL_STATUS_LABEL } from '@/lib/labels'
import { absoluteMediaUrl, profileUrls, publicBaseUrl } from '@/lib/urls'

export const metadata = { title: 'Profesionales' }

export default async function ProfessionalsPage({ searchParams }: PageProps<'/professionals'>) {
  const user = await requirePermission('professionals:read')
  const params = await searchParams
  const statusParam = typeof params.status === 'string' ? params.status : undefined
  const status = (PROFESSIONAL_STATUSES as readonly string[]).includes(statusParam ?? '')
    ? (statusParam as ProfessionalStatus)
    : statusParam === 'all'
      ? 'all'
      : undefined
  const q = typeof params.q === 'string' ? params.q.slice(0, 100) : ''
  const [list, settings] = await Promise.all([
    listProfessionals({ status, search: q }),
    getSiteSettings(),
  ])

  const rows: ProfessionalRow[] = list.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    professionalTitle: p.professionalTitle,
    status: p.status,
    hasUnpublished: hasUnpublishedChanges(p),
    isDemo: p.isDemo,
    updatedAtLabel: formatDateTime(p.updatedAt),
    avatarUrl: absoluteMediaUrl(p.avatar?.url),
    initials: initials(p.name),
    ...profileUrls(p.slug),
  }))

  return (
    <>
      <PageHeader
        title="Profesionales"
        description="Cada profesional publicado tiene su URL pública y su QR. Arrastra para definir el orden del selector."
        actions={
          can(user.role, 'professionals:write') ? (
            <NewProfessionalDialog publicBaseUrl={publicBaseUrl()} />
          ) : undefined
        }
      />
      <ListFilters
        searchPlaceholder="Buscar por nombre, slug o especialidad"
        selects={[
          {
            name: 'status',
            label: 'Estado',
            options: [
              ...PROFESSIONAL_STATUSES.map((s) => ({
                value: s,
                label: PROFESSIONAL_STATUS_LABEL[s],
              })),
              { value: 'all', label: 'Incluir archivados' },
            ],
          },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title={q || status ? 'Sin resultados' : 'Aún no hay profesionales'}
          description={
            q || status ? 'Prueba con otros filtros.' : 'Crea el primer perfil para empezar.'
          }
        />
      ) : (
        <ProfessionalsTable
          rows={rows}
          canReorder={!q && !status}
          logoUrl={absoluteMediaUrl(settings.logo?.url)}
          permissions={{
            write: can(user.role, 'professionals:write'),
            publish: can(user.role, 'professionals:publish'),
            archive: can(user.role, 'professionals:archive'),
            remove: can(user.role, 'professionals:delete'),
          }}
        />
      )}
    </>
  )
}
