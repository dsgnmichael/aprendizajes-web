'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, Loader2, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { Button } from '@repo/ui/components/button'
import { homePreviewUrlAction } from '@/actions/home-page'
import { previewUrlAction } from '@/actions/professionals'

const DEVICES = {
  desktop: { width: 1440, height: 900, label: 'Escritorio', icon: Monitor },
  tablet: { width: 834, height: 1112, label: 'Tablet', icon: Tablet },
  mobile: { width: 390, height: 844, label: 'Móvil', icon: Smartphone },
} as const
type Device = keyof typeof DEVICES

/**
 * Draft preview: an iframe of the PUBLIC app's /preview/<signed token> route
 * rendered at the real device width and CSS-scaled to fit the panel, so
 * breakpoints behave exactly like on a real device.
 */
export type PreviewTarget = { kind: 'professional'; id: string } | { kind: 'home' }

export function PreviewPanel({ target, reloadKey }: { target: PreviewTarget; reloadKey: number }) {
  const targetId = target.kind === 'home' ? 'home' : target.id
  const [device, setDevice] = useState<Device>('mobile')
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [width, setWidth] = useState(0)
  const frame = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result =
      targetId === 'home' ? await homePreviewUrlAction() : await previewUrlAction(targetId)
    if (result.ok) {
      setUrl(`${result.data.url}${result.data.url.includes('?') ? '&' : '?'}r=${Date.now()}`)
      setError(null)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }, [targetId])

  useEffect(() => {
    // Fetching a fresh signed URL is an external sync with the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh, reloadKey])

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const spec = DEVICES[device]
  const scale = width ? Math.min(1, width / spec.width) : 0.3

  return (
    <div className="bg-muted/40 flex h-full flex-col rounded-xl border">
      <div className="bg-card flex items-center gap-1 border-b px-2 py-1.5">
        <div role="radiogroup" aria-label="Dispositivo de vista previa" className="flex gap-0.5">
          {(Object.keys(DEVICES) as Device[]).map((key) => {
            const Icon = DEVICES[key].icon
            return (
              <Button
                key={key}
                type="button"
                role="radio"
                aria-checked={device === key}
                variant={device === key ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDevice(key)}
              >
                <Icon /> <span className="hidden xl:inline">{DEVICES[key].label}</span>
              </Button>
            )
          })}
        </div>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {spec.width}px · {Math.round(scale * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={refresh}
          aria-label="Recargar vista previa"
        >
          <RefreshCw />
        </Button>
        {url && (
          <Button asChild variant="ghost" size="icon-sm">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir vista previa en otra pestaña"
            >
              <ExternalLink />
            </a>
          </Button>
        )}
      </div>
      <div ref={frame} className="relative flex-1 overflow-auto p-0">
        {error ? (
          <p className="text-muted-foreground p-6 text-center text-sm">{error}</p>
        ) : (
          <div
            className="mx-auto origin-top-left"
            style={{ width: spec.width * scale, height: spec.height * scale }}
          >
            {url && (
              <iframe
                key={url}
                src={url}
                title="Vista previa del borrador"
                onLoad={() => setLoading(false)}
                className={cn(
                  'origin-top-left rounded-b-lg bg-white shadow-sm transition-opacity',
                  loading && 'opacity-40',
                )}
                style={{ width: spec.width, height: spec.height, transform: `scale(${scale})` }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
          </div>
        )}
        {loading && !error && (
          <Loader2
            className="text-muted-foreground absolute top-6 left-1/2 size-5 -translate-x-1/2 animate-spin"
            aria-label="Cargando vista previa"
          />
        )}
      </div>
    </div>
  )
}
