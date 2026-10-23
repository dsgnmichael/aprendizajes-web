import { listPopups, listProfessionals } from '@repo/data-access'
import { PageHeader } from '@/components/shell/page-header'
import { PopupsManager } from '@/components/popups/popups-manager'
import { requirePermission } from '@/lib/auth'

export const metadata = { title: 'Publicidad emergente' }

export default async function PopupsPage() {
  await requirePermission('settings:write')
  const [popups, professionals] = await Promise.all([
    listPopups(),
    listProfessionals({ status: 'all' }),
  ])

  return (
    <>
      <PageHeader
        title="Publicidad emergente"
        description="Configura las ventanas emergentes (popups) que se mostrarán en la web."
      />
      <PopupsManager 
        initialPopups={popups} 
        professionals={professionals.map(p => ({ slug: p.slug, name: p.name, status: p.status }))} 
      />
    </>
  )
}
