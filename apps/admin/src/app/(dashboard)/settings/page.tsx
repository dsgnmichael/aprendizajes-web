import { getSiteSettings, listPublishedCards } from '@repo/data-access'
import { PublicBaseProvider } from '@/components/media/media-url'
import { SettingsForm } from '@/components/settings/settings-form'
import { PageHeader } from '@/components/shell/page-header'
import { requirePermission } from '@/lib/auth'
import { publicBaseUrl } from '@/lib/urls'

export const metadata = { title: 'Configuración del sitio' }

export default async function SettingsPage() {
  await requirePermission('settings:write')
  const [settings, cards] = await Promise.all([getSiteSettings(), listPublishedCards()])
  return (
    <PublicBaseProvider value={publicBaseUrl()}>
      <PageHeader
        title="Configuración del sitio"
        description="Identidad, tema, navegación y comportamiento global del sitio público."
      />
      <SettingsForm
        initial={settings}
        professionals={cards.map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </PublicBaseProvider>
  )
}
