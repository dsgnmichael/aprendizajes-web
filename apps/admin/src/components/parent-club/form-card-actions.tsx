'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { toast } from '@repo/ui/components/sonner'
import { cn } from '@repo/ui/lib/utils'

export function FormCardActions({
  publicUrl,
  publicBaseUrl,
}: {
  publicUrl: string | null
  publicBaseUrl: string
}) {
  const [copied, setCopied] = useState(false)

  if (!publicUrl) return null

  const fullUrl = `${publicBaseUrl.replace(/\/+$/, '')}${publicUrl}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success('Enlace copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleCopy}
        className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Copiar enlace del formulario"
        title="Copiar enlace"
      >
        {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
      </button>
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'grid size-8 place-items-center rounded-md text-muted-foreground',
          'transition-colors hover:bg-muted hover:text-foreground',
        )}
        aria-label="Abrir formulario público"
        title="Abrir formulario en una pestaña nueva"
      >
        <ExternalLink className="size-4" />
      </a>
    </div>
  )
}
