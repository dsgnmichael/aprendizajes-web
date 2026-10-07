import { listMedia } from '@repo/data-access'
import { MediaLibrary } from '@/components/media/media-library'
import { PublicBaseProvider } from '@/components/media/media-url'
import { Pagination } from '@/components/pagination'
import { PageHeader } from '@/components/shell/page-header'
import { requirePermission } from '@/lib/auth'
import { publicBaseUrl } from '@/lib/urls'

export const metadata = { title: 'Media' }

export default async function MediaPage({ searchParams }: PageProps<'/media'>) {
  await requirePermission('media:write')
  const params = await searchParams
  const page = Math.max(1, Number(typeof params.page === 'string' ? params.page : 1) || 1)
  const result = await listMedia({ page, pageSize: 40 })
  return (
    <PublicBaseProvider value={publicBaseUrl()}>
      <PageHeader
        title="Media"
        description="Las imágenes se validan y optimizan en el servidor (sin metadatos EXIF). En la base de datos solo se guardan metadatos y URL."
      />
      <MediaLibrary
        items={result.items.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      />
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        params={{}}
        basePath="/media"
      />
    </PublicBaseProvider>
  )
}
