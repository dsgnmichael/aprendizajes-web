'use client'

import { useRef, useTransition } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { upload } from '@vercel/blob/client'
import { MEDIA_LIMITS } from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import { toast } from '@repo/ui/components/sonner'
import { saveMediaMetadataAction, type MediaItem } from '@/actions/media'

export function UploadButton({
  folder = 'professionals',
  onUploaded,
  variant = 'outline',
}: {
  folder?: 'professionals' | 'testimonials' | 'site' | 'gallery'
  onUploaded: (item: MediaItem) => void
  variant?: 'outline' | 'default'
}) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()

  const getDimensions = (file: File) => new Promise<{ width: number, height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error al leer la imagen'))
    }
    img.src = url
  })

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MEDIA_LIMITS.maxBytes) {
      toast.error('El archivo supera el límite permitido')
      return
    }

    startTransition(async () => {
      try {
        const { width, height } = await getDimensions(file)

        // Sube directo a Vercel Blob (esquiva el límite de 4.5MB)
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        })

        // Guarda los metadatos en MongoDB usando runAction
        const result = await saveMediaMetadataAction({
          url: blob.url,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          width,
          height,
          hasAlpha: file.type === 'image/png' || file.type === 'image/webp',
          folder: folder,
        })

        if (!result.ok) {
          throw new Error(result.error)
        }

        toast.success('Imagen subida correctamente')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUploaded(result.data as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error(error.message || 'Error al subir la imagen')
      }
    })
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={MEDIA_LIMITS.mimeTypes.join(',')}
        className="sr-only"
        onChange={onChange}
        aria-label="Subir imagen"
        data-testid="media-upload-input"
      />
      <Button
        type="button"
        variant={variant}
        onClick={() => input.current?.click()}
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Upload />} Subir imagen
      </Button>
    </>
  )
}