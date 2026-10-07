import { CheckCircle2, CircleAlert, CircleDashed } from 'lucide-react'
import { features } from '@repo/config'
import { getIntegration } from '@repo/data-access'
import { can } from '@repo/domain'
import { Badge } from '@repo/ui/components/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { GbpControls, PlacesControls } from '@/components/integrations/integration-controls'
import { PageHeader } from '@/components/shell/page-header'
import { requirePermission } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'

export const metadata = { title: 'Integraciones' }

const GBP_MESSAGES: Record<string, { tone: 'success' | 'error'; text: string }> = {
  connected: {
    tone: 'success',
    text: 'Cuenta de Google conectada. Ahora asigna una ubicación a cada profesional.',
  },
  denied: { tone: 'error', text: 'Se canceló la autorización en Google.' },
  invalid_state: {
    tone: 'error',
    text: 'La solicitud de autorización expiró o no es válida. Inténtalo de nuevo.',
  },
  error: { tone: 'error', text: 'Google rechazó la conexión. Revisa la configuración OAuth.' },
  forbidden: { tone: 'error', text: 'Solo un super admin puede conectar integraciones.' },
  not_configured: {
    tone: 'error',
    text: 'Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o INTEGRATION_ENCRYPTION_KEY.',
  },
  rate_limited: { tone: 'error', text: 'Demasiados intentos. Espera unos minutos.' },
}

function Status({ ok, label }: { ok: boolean | null; label: string }) {
  if (ok === null)
    return (
      <Badge variant="secondary">
        <CircleDashed /> {label}
      </Badge>
    )
  return ok ? (
    <Badge variant="success">
      <CheckCircle2 /> {label}
    </Badge>
  ) : (
    <Badge variant="destructive">
      <CircleAlert /> {label}
    </Badge>
  )
}

export default async function IntegrationsPage({ searchParams }: PageProps<'/integrations'>) {
  const user = await requirePermission('integrations:configure')
  const params = await searchParams
  const flash = typeof params.gbp === 'string' ? GBP_MESSAGES[params.gbp] : undefined
  const [places, gbp] = await Promise.all([
    getIntegration('google_places'),
    getIntegration('google_business_profile'),
  ])
  const placesConfigured = features.googlePlaces()
  const gbpConfigured = features.googleBusinessProfile()
  const gbpConnected = Boolean(gbp.refreshToken)

  return (
    <>
      <PageHeader
        title="Integraciones"
        description="Opcionales. Sin credenciales el sitio funciona con testimonios manuales. Los secretos viven solo en variables de entorno del servidor."
      />
      {flash && (
        <p
          role="status"
          className={`mb-4 rounded-lg p-3 text-sm ${flash.tone === 'success' ? 'bg-success/15' : 'bg-destructive/10 text-destructive'}`}
        >
          {flash.text}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Google Places API (New)</CardTitle>
            <CardDescription>
              Reseñas públicas de un lugar (máx. 5) y valoración global, consultadas en vivo y sin
              almacenar su contenido.
            </CardDescription>
            <CardAction>
              <Status
                ok={placesConfigured ? places.enabled : null}
                label={
                  !placesConfigured ? 'Sin API key' : places.enabled ? 'Activa' : 'Desactivada'
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!placesConfigured && (
              <p className="bg-muted rounded-lg p-3">
                Define <code>GOOGLE_MAPS_API_KEY</code> en el entorno del servidor (restringida a
                Places API). La clave nunca se envía al navegador.
              </p>
            )}
            <PlacesControls enabled={places.enabled} configured={placesConfigured} />
            <p className="text-muted-foreground text-xs">
              Última prueba: {formatDateTime(places.lastTestedAt)}
              {places.lastError ? ` · Error: ${places.lastError}` : ''}
            </p>
            <p className="text-muted-foreground text-xs">
              El Place ID se asigna por profesional en su editor (pestaña Testimonios).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Business Profile</CardTitle>
            <CardDescription>
              Para ubicaciones verificadas que la organización administra. OAuth 2.0; el refresh
              token se guarda cifrado (AES-256-GCM).
            </CardDescription>
            <CardAction>
              <Status
                ok={
                  !gbpConfigured
                    ? null
                    : gbp.lastSyncStatus === 'reauth_required'
                      ? false
                      : gbpConnected
                }
                label={
                  !gbpConfigured
                    ? 'Sin credenciales'
                    : gbp.lastSyncStatus === 'reauth_required'
                      ? 'Requiere reautorizar'
                      : gbpConnected
                        ? 'Conectada'
                        : 'No conectada'
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!gbpConfigured && (
              <p className="bg-muted rounded-lg p-3">
                Define <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> e{' '}
                <code>INTEGRATION_ENCRYPTION_KEY</code>. URI de redirección:{' '}
                <code>/api/integrations/google/callback</code> en el dominio del backoffice.
              </p>
            )}
            {gbpConnected && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">Cuenta</dt>
                <dd>{gbp.accountLabel ?? '—'}</dd>
                <dt className="text-muted-foreground">Conectada</dt>
                <dd>{formatDateTime(gbp.connectedAt)}</dd>
                <dt className="text-muted-foreground">Última sincronización</dt>
                <dd>
                  {formatDateTime(gbp.lastSyncAt)}{' '}
                  {gbp.lastSyncStatus && (
                    <Badge variant={gbp.lastSyncStatus === 'ok' ? 'success' : 'destructive'}>
                      {gbp.lastSyncStatus}
                    </Badge>
                  )}
                </dd>
                {gbp.lastError && (
                  <>
                    <dt className="text-muted-foreground">Último error</dt>
                    <dd className="text-destructive">{gbp.lastError}</dd>
                  </>
                )}
              </dl>
            )}
            <GbpControls
              configured={gbpConfigured}
              connected={gbpConnected}
              canConnect={can(user.role, 'integrations:connect')}
            />
            <p className="text-muted-foreground text-xs">
              Sincronización programada diaria: <code>GET /api/cron/sync-reviews</code> con{' '}
              <code>Authorization: Bearer $CRON_SECRET</code>
              {features.cron() ? ' (CRON_SECRET configurado).' : ' (falta CRON_SECRET).'}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
