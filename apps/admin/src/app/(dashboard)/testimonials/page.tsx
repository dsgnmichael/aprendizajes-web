import { listProfessionals, listTestimonials } from '@repo/data-access'
import { ListFilters } from '@/components/list-filters'
import { PageHeader } from '@/components/shell/page-header'
import {
  TestimonialsManager,
  type TestimonialRow,
} from '@/components/testimonials/testimonials-manager'
import { requirePermission } from '@/lib/auth'
import { publicBaseUrl } from '@/lib/urls'

export const metadata = { title: 'Testimonios' }

export default async function TestimonialsPage({ searchParams }: PageProps<'/testimonials'>) {
  await requirePermission('testimonials:write')
  const params = await searchParams
  const professional = typeof params.professional === 'string' ? params.professional : undefined
  const q = typeof params.q === 'string' ? params.q.slice(0, 100) : undefined
  const [professionals, testimonials] = await Promise.all([
    listProfessionals({ status: 'all' }),
    listTestimonials({ professionalId: professional, search: q }),
  ])
  const names = new Map(professionals.map((p) => [p.id, p.name]))
  const rows: TestimonialRow[] = testimonials.map(({ createdAt: _c, updatedAt: _u, ...t }) => ({
    ...t,
    professionalName: t.professionalId
      ? (names.get(t.professionalId) ?? 'Profesional eliminado')
      : null,
  }))

  return (
    <>
      <PageHeader
        title="Testimonios"
        description="Testimonios manuales. Las reseñas de Google se configuran por profesional (pestaña Testimonios del editor) y no se pueden editar."
      />
      <ListFilters
        searchPlaceholder="Buscar por autor o texto"
        selects={[
          {
            name: 'professional',
            label: 'Profesional',
            options: [
              { value: 'global', label: 'Generales (todos)' },
              ...professionals.map((p) => ({ value: p.id, label: p.name })),
            ],
          },
        ]}
      />
      <TestimonialsManager
        rows={rows}
        professionals={professionals.map((p) => ({ id: p.id, name: p.name }))}
        filterProfessionalId={professional && professional !== 'global' ? professional : null}
        publicBaseUrl={publicBaseUrl()}
      />
    </>
  )
}
