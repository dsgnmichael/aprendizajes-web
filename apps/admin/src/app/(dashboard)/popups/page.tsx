import { listPopups, listProfessionals } from '@repo/data-access'
import { PageHeader } from '@/components/shell/page-header'
import { PopupsManager } from '@/components/popups/popups-manager'
import { requirePermission } from '@/lib/auth'

export const metadata = { title: 'Publicidad emergente' }

export default async function PopupsPage() {
  await requirePermission('settings:write')
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let popups: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let professionals: any[] = []
  let errorMsg = ''

  try {
    const [p, prof] = await Promise.all([
      listPopups(),
      listProfessionals({ status: 'all' }),
    ])
    popups = p.map(popup => ({ 
      ...popup, 
      createdAt: popup.createdAt instanceof Date ? popup.createdAt.toISOString() : (popup.createdAt || new Date().toISOString()), 
      updatedAt: popup.updatedAt instanceof Date ? popup.updatedAt.toISOString() : (popup.updatedAt || new Date().toISOString()) 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any[]
    professionals = prof
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error loading popups:", error)
    errorMsg = error?.message || 'Error desconocido al conectar con la base de datos.'
  }

  if (errorMsg) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Base de Datos en Producción</h1>
        <p className="mb-4">Vercel no puede conectarse a MongoDB. Detalle del error:</p>
        <pre className="bg-red-50 text-red-900 p-4 rounded-md overflow-auto text-sm border border-red-200">
          {errorMsg}
        </pre>
        <p className="mt-4 text-sm text-muted-foreground">
          Revisa tus variables de entorno en Vercel (MONGODB_URI, MONGODB_DB_NAME) o asegúrate de que la IP de Vercel esté permitida en MongoDB Atlas.
        </p>
      </div>
    )
  }

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
