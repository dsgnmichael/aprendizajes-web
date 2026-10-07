import { notFound } from 'next/navigation'
import { features } from '@repo/config'
import {
  getIntegration,
  getProfessionalById,
  getSiteSettings,
  listRevisions,
} from '@repo/data-access'
import { can, professionalInputSchema } from '@repo/domain'
import { ProfessionalEditor } from '@/components/editor/professional-editor'
import { PublicBaseProvider } from '@/components/media/media-url'
import { PageHeader } from '@/components/shell/page-header'
import { requirePermission } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'
import { profileUrls, publicBaseUrl } from '@/lib/urls'

export async function generateMetadata({ params }: PageProps<'/professionals/[id]'>) {
  const { id } = await params
  const professional = await getProfessionalById(id)
  return { title: professional ? `Editar · ${professional.name}` : 'Profesional' }
}

export default async function EditProfessionalPage({ params }: PageProps<'/professionals/[id]'>) {
  const user = await requirePermission('professionals:read')
  const { id } = await params
  const professional = await getProfessionalById(id)
  if (!professional) notFound()
  const [revisions, settings, gbp] = await Promise.all([
    listRevisions(id),
    getSiteSettings(),
    getIntegration('google_business_profile'),
  ])

  // Parse through the schema so drafts written by older versions get new defaults.
  const parsed = professionalInputSchema.safeParse(professional)
  const initial = parsed.success
    ? parsed.data
    : professionalInputSchema.parse({
        name: professional.name,
        slug: professional.slug,
        professionalTitle: professional.professionalTitle,
      })

  return (
    <PublicBaseProvider value={publicBaseUrl()}>
      <PageHeader
        breadcrumbs={[
          { href: '/professionals', label: 'Profesionales' },
          { label: professional.name },
        ]}
      />
      {!parsed.success && (
        <p role="alert" className="bg-warning/15 mb-4 rounded-lg p-3 text-sm">
          El borrador guardado no pasó la validación actual; se cargaron valores base. Revisa y
          guarda.
        </p>
      )}
      <ProfessionalEditor
        initial={initial}
        meta={{
          id,
          status: professional.status,
          revision: professional.revision,
          publishedRevision: professional.publishedRevision,
          publicUrl: profileUrls(professional.slug).publicUrl,
          isDemo: professional.isDemo,
          revisions: revisions.map((r) => ({
            revision: r.revision,
            publishedAt: formatDateTime(r.publishedAt),
            publishedBy: r.publishedBy,
          })),
          siteColors: settings.theme.colors,
          canPublish: can(user.role, 'professionals:publish'),
          canWrite: can(user.role, 'professionals:write'),
        }}
        flags={{
          placesConfigured: features.googlePlaces(),
          gbpConnected: Boolean(gbp.refreshToken) && features.googleBusinessProfile(),
        }}
      />
    </PublicBaseProvider>
  )
}
