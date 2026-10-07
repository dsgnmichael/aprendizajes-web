'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Controller, useFormContext, type FieldValues } from 'react-hook-form'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { MediaRef } from '@repo/domain'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { MediaPickerDialog } from '@/components/media/media-picker'
import { useMediaUrl } from '@/components/media/media-url'

/** Image reference editor: pick/upload, alt text and focal point (click on the image). */
export function ImageField({
  name,
  label,
  help,
  folder,
  aspect = 'aspect-[4/5]',
}: {
  name: string
  label: string
  help?: string
  folder?: 'professionals' | 'testimonials' | 'site' | 'gallery'
  aspect?: string
}) {
  const { control } = useFormContext<FieldValues>()
  const [open, setOpen] = useState(false)
  const media = useMediaUrl()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = field.value as MediaRef | undefined
        const update = (patch: Partial<MediaRef>) => value && field.onChange({ ...value, ...patch })
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{label}</Label>
              {value?.hasAlpha && <Badge variant="accent">Transparencia</Badge>}
            </div>
            {value ? (
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <button
                  type="button"
                  className={`relative ${aspect} w-full cursor-crosshair overflow-hidden rounded-lg border bg-[repeating-conic-gradient(#f2f1ef_0_25%,#fff_0_50%)] bg-[length:16px_16px]`}
                  aria-label="Haz clic para definir el punto focal"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    update({
                      focalX: Math.round(((e.clientX - rect.left) / rect.width) * 100),
                      focalY: Math.round(((e.clientY - rect.top) / rect.height) * 100),
                    })
                  }}
                >
                  <Image
                    src={media(value.url) ?? ''}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                    style={{ objectPosition: `${value.focalX}% ${value.focalY}%` }}
                  />
                  <span
                    className="bg-primary/70 pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                    style={{ left: `${value.focalX}%`, top: `${value.focalY}%` }}
                    aria-hidden
                  />
                </button>
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${name}-alt`} className="text-xs">
                      Texto alternativo
                    </Label>
                    <Input
                      id={`${name}-alt`}
                      value={value.alt}
                      maxLength={240}
                      placeholder="Describe la imagen para lectores de pantalla"
                      onChange={(e) => update({ alt: e.target.value })}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {value.width}×{value.height}px · foco {value.focalX}% / {value.focalY}%
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
                      <ImagePlus /> Cambiar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => field.onChange(undefined)}
                    >
                      <Trash2 /> Quitar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-muted-foreground hover:bg-muted/50 flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm"
              >
                <ImagePlus className="size-5" aria-hidden />
                Elegir o subir imagen
              </button>
            )}
            {help && <p className="text-muted-foreground text-xs">{help}</p>}
            <MediaPickerDialog
              open={open}
              onOpenChange={setOpen}
              folder={folder}
              onSelect={(ref) => field.onChange(ref)}
            />
          </div>
        )
      }}
    />
  )
}
