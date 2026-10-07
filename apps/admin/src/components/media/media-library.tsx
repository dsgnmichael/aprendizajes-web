'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Copy, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { toast } from '@repo/ui/components/sonner'
import { deleteMediaAction, updateMediaAction, type MediaItem } from '@/actions/media'
import { ConfirmDialog, type ConfirmState } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/shell/empty-state'
import { handleResult } from '@/components/use-action-toast'
import { useMediaUrl } from './media-url'
import { UploadButton } from './upload-button'

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter()
  const media = useMediaUrl()
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [alt, setAlt] = useState('')
  const [focal, setFocal] = useState({ x: 50, y: 50 })
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [pending, startTransition] = useTransition()

  function open(item: MediaItem) {
    setSelected(item)
    setAlt(item.alt)
    setFocal({ x: item.focalX, y: item.focalY })
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <UploadButton
          folder="professionals"
          variant="default"
          onUploaded={() => router.refresh()}
        />
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon />}
          title="Sin archivos"
          description="Sube fotos de profesionales (PNG/WebP con transparencia recomendado), logos o imágenes de galería."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Archivos">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => open(item)}
                className="group bg-card focus-visible:ring-ring block w-full overflow-hidden rounded-xl border text-left outline-none focus-visible:ring-2"
              >
                <span className="relative block aspect-square bg-[repeating-conic-gradient(#f2f1ef_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
                  <Image
                    src={media(item.url) ?? ''}
                    alt={item.alt}
                    fill
                    sizes="240px"
                    className="object-contain transition-transform group-hover:scale-105"
                  />
                </span>
                <span className="block truncate px-2.5 pt-2 text-xs font-medium">
                  {item.filename}
                </span>
                <span className="text-muted-foreground flex items-center gap-1 px-2.5 pb-2 text-[11px]">
                  {item.width}×{item.height}
                  {item.hasAlpha && <Badge variant="accent">alpha</Badge>}
                  {item.provider === 'static' && <Badge variant="outline">demo</Badge>}
                  {!item.alt && <Badge variant="warning">sin alt</Badge>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="truncate">{selected.filename}</DialogTitle>
              <DialogDescription>
                {selected.mimeType} · {selected.width}×{selected.height}px ·{' '}
                {Math.round(selected.size / 1024)} KB · {selected.provider}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <button
                type="button"
                className="relative aspect-square cursor-crosshair overflow-hidden rounded-lg border bg-[repeating-conic-gradient(#f2f1ef_0_25%,#fff_0_50%)] bg-[length:16px_16px]"
                aria-label="Haz clic para definir el punto focal"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  setFocal({
                    x: Math.round(((e.clientX - r.left) / r.width) * 100),
                    y: Math.round(((e.clientY - r.top) / r.height) * 100),
                  })
                }}
              >
                <Image
                  src={media(selected.url) ?? ''}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-contain"
                />
                <span
                  className="bg-primary/70 pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                  style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
                  aria-hidden
                />
              </button>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="media-alt">Texto alternativo</Label>
                  <Input
                    id="media-alt"
                    value={alt}
                    maxLength={240}
                    onChange={(e) => setAlt(e.target.value)}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Punto focal: {focal.x}% / {focal.y}%. Se usa al recortar la imagen en distintos
                  formatos. Los cambios aplican a nuevas selecciones de esta imagen.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(media(selected.url) ?? selected.url)
                    toast.success('URL copiada')
                  }}
                >
                  <Copy /> Copiar URL
                </Button>
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={() =>
                  setConfirm({
                    title: '¿Eliminar archivo?',
                    description:
                      'Si está en uso por algún perfil, la imagen dejará de verse (se mostrará un respaldo). Esta acción no se puede deshacer.',
                    confirmLabel: 'Eliminar',
                    destructive: true,
                    onConfirm: () =>
                      startTransition(async () => {
                        handleResult(await deleteMediaAction(selected.id), 'Archivo eliminado')
                        setSelected(null)
                        router.refresh()
                      }),
                  })
                }
              >
                <Trash2 /> Eliminar
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await updateMediaAction(selected.id, {
                      alt,
                      focalX: focal.x,
                      focalY: focal.y,
                    })
                    handleResult(result, 'Guardado')
                    if (result.ok) {
                      setSelected(null)
                      router.refresh()
                    }
                  })
                }
              >
                {pending && <Loader2 className="animate-spin" />} Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </>
  )
}
