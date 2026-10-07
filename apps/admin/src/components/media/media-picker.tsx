'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import type { MediaRef } from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { listMediaAction, type MediaItem } from '@/actions/media'
import { handleResult } from '@/components/use-action-toast'
import { useMediaUrl } from './media-url'
import { UploadButton } from './upload-button'

export function toMediaRef(item: MediaItem): MediaRef {
  return {
    mediaId: item.id,
    url: item.url,
    alt: item.alt,
    width: item.width,
    height: item.height,
    focalX: item.focalX,
    focalY: item.focalY,
    hasAlpha: item.hasAlpha,
  }
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  folder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (ref: MediaRef) => void
  folder?: 'professionals' | 'testimonials' | 'site' | 'gallery'
}) {
  const media = useMediaUrl()
  const [items, setItems] = useState<MediaItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    startTransition(async () => {
      const data = handleResult(await listMediaAction(page))
      if (data) {
        setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]))
        setTotal(data.total)
      }
    })
  }, [open, page])

  function choose(item: MediaItem) {
    onSelect(toMediaRef(item))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Biblioteca de medios</DialogTitle>
          <DialogDescription>
            PNG/WebP con transparencia funcionan mejor para recortes del profesional.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <UploadButton folder={folder} onUploaded={choose} variant="default" />
        </div>
        <div className="grid max-h-[55dvh] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => choose(item)}
              className="group focus-visible:ring-ring relative aspect-square overflow-hidden rounded-lg border bg-[repeating-conic-gradient(#f2f1ef_0_25%,#fff_0_50%)] bg-[length:16px_16px] text-left outline-none focus-visible:ring-2"
              aria-label={`Elegir ${item.alt || item.filename}`}
            >
              <Image
                src={media(item.url) ?? ''}
                alt=""
                fill
                sizes="200px"
                className="object-contain transition-transform group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-[11px] text-white">
                {item.width}×{item.height}
                {item.hasAlpha ? ' · alpha' : ''}
              </span>
            </button>
          ))}
        </div>
        {pending && <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin" />}
        {!pending && items.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-sm">
            La biblioteca está vacía. Sube la primera imagen.
          </p>
        )}
        {items.length < total && (
          <Button variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={pending}>
            Cargar más
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
