import { getHomePageDraft, listHomePageRevisions } from '@repo/data-access'
import { can, homePageInputSchema } from '@repo/domain'
import { HomePageEditor } from '@/components/editor/home-page-editor'
import { PublicBaseProvider } from '@/components/media/media-url'
import { PageHeader } from '@/components/shell/page-header'
import { requirePermission } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'
import { publicBaseUrl } from '@/lib/urls'

export const metadata = { title: 'Página de inicio' }

export default async function HomePageEditorPage() {
  const user = await requirePermission('landing:write')
  const [draft, revisions] = await Promise.all([getHomePageDraft(), listHomePageRevisions()])
  // Parse through the schema so drafts written by older versions get new defaults.
  const initial = homePageInputSchema.parse({ sections: draft.sections, seo: draft.seo })
  return (
    <PublicBaseProvider value={publicBaseUrl()}>
      <PageHeader breadcrumbs={[{ label: 'Página de inicio' }]} />
      <HomePageEditor
        initial={initial}
        meta={{
          revision: draft.revision,
          publishedRevision: draft.publishedRevision,
          publicUrl: publicBaseUrl(),
          revisions: revisions.map((r) => ({
            revision: r.revision,
            publishedAt: formatDateTime(r.publishedAt),
            publishedBy: r.publishedBy,
          })),
          canPublish: can(user.role, 'landing:publish'),
        }}
      />
    </PublicBaseProvider>
  )
}
