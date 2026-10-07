'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, PlugZap, RefreshCw, Unplug } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Switch } from '@repo/ui/components/switch'
import {
  gbpDisconnectAction,
  gbpSyncAction,
  gbpTestAction,
  placesTestAction,
  setPlacesEnabledAction,
} from '@/actions/integrations'
import { ConfirmDialog, type ConfirmState } from '@/components/confirm-dialog'
import { handleResult } from '@/components/use-action-toast'

export function PlacesControls({ enabled, configured }: { enabled: boolean; configured: boolean }) {
  const router = useRouter()
  const [placeId, setPlaceId] = useState('')
  const [pending, startTransition] = useTransition()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="places-enabled" className="font-normal">
          Integración activa
        </Label>
        <Switch
          id="places-enabled"
          checked={enabled}
          disabled={!configured || pending}
          onCheckedChange={(value) =>
            startTransition(async () => {
              handleResult(
                await setPlacesEnabledAction(value),
                value ? 'Google Places activado' : 'Google Places desactivado',
              )
              router.refresh()
            })
          }
        />
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () => {
            const data = handleResult(await placesTestAction(placeId))
            if (data)
              handleResult(
                { ok: true, data },
                `Conexión correcta: ${data.name} (${data.rating ?? '–'}★, ${data.userRatingCount ?? 0} reseñas)`,
              )
            router.refresh()
          })
        }}
      >
        <Input
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="Place ID para probar"
          aria-label="Place ID para probar"
          disabled={!configured}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!configured || pending || placeId.trim().length < 3}
        >
          {pending && <Loader2 className="animate-spin" />} Probar conexión
        </Button>
      </form>
    </div>
  )
}

export function GbpControls({
  configured,
  connected,
  canConnect,
}: {
  configured: boolean
  connected: boolean
  canConnect: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  return (
    <div className="flex flex-wrap gap-2">
      {canConnect && configured && (
        <Button asChild variant={connected ? 'outline' : 'default'}>
          {/* Route handler (not a client fetch): the OAuth flow needs a full-page redirect. */}
          <a href="/api/integrations/google/connect">
            <PlugZap /> {connected ? 'Reconectar' : 'Conectar Google'}
          </a>
        </Button>
      )}
      {connected && (
        <>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const data = handleResult(await gbpTestAction())
                if (data)
                  handleResult({ ok: true, data }, `Conexión correcta: ${data.accounts} cuenta(s)`)
                router.refresh()
              })
            }
          >
            Probar conexión
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const data = handleResult(await gbpSyncAction())
                if (data)
                  handleResult(
                    { ok: true, data },
                    `Sincronizadas ${data.reviews} reseñas de ${data.locations} ubicación(es)`,
                  )
                router.refresh()
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Sincronizar ahora
          </Button>
          {canConnect && (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() =>
                setConfirm({
                  title: '¿Desconectar Google Business Profile?',
                  description:
                    'Se revocará el acceso y se eliminará el token cifrado. Los perfiles que usan esta fuente volverán a los testimonios manuales.',
                  confirmLabel: 'Desconectar',
                  destructive: true,
                  onConfirm: () =>
                    startTransition(async () => {
                      handleResult(await gbpDisconnectAction(), 'Desconectado')
                      router.refresh()
                    }),
                })
              }
            >
              <Unplug /> Desconectar
            </Button>
          )}
        </>
      )}
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}
