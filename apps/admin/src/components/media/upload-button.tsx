'use client'

import { useRef, useTransition } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { MEDIA_LIMITS } from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import { toast } from '@repo/ui/components/sonner'
import { uploadMediaAction, type MediaItem } from '@/actions/media'
import { handleResult } from '@/components/use-action-toast'

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

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MEDIA_LIMITS.maxBytes) {
      toast.error('El archivo supera 8 MB')
      return
    }
    const data = new FormData()
    data.set('file', file)
    data.set('folder', folder)
    data.set('alt', '')
    startTransition(async () => {
      const item = handleResult(await uploadMediaAction(data), 'Imagen subida')
      if (item) onUploaded(item)
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
