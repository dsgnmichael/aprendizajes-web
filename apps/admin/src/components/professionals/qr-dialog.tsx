'use client'

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Copy, Download, RefreshCw } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { Label } from '@repo/ui/components/label'
import { Switch } from '@repo/ui/components/switch'
import { toast } from '@repo/ui/components/sonner'
import { qrLogoDataUrlAction } from '@/actions/media'

const SIZE = 1024
const LOGO_RATIO = 0.22

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Centered logo on a white plate; fits inside ~22% of the QR (well within H-level 30% recovery). */
function logoBox(img: { width: number; height: number }, size: number) {
  const max = size * LOGO_RATIO
  const scale = Math.min(max / img.width, max / img.height)
  const w = img.width * scale
  const h = img.height * scale
  const pad = size * 0.025
  return {
    w,
    h,
    x: (size - w) / 2,
    y: (size - h) / 2,
    plate: { x: (size - w) / 2 - pad, y: (size - h) / 2 - pad, w: w + pad * 2, h: h + pad * 2 },
  }
}

export function QrDialog({
  open,
  onOpenChange,
  name,
  slug,
  qrUrl,
  logoUrl,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  slug: string
  qrUrl: string
  logoUrl?: string
}) {
  const [withLogo, setWithLogo] = useState(Boolean(logoUrl))
  const [svg, setSvg] = useState<string | null>(null)
  const [png, setPng] = useState<string | null>(null)
  const [logoData, setLogoData] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!open || !withLogo || !logoUrl || logoData) return
    let cancelled = false
    qrLogoDataUrlAction(logoUrl).then((result) => {
      if (cancelled) return
      if (result.ok) setLogoData(result.data)
      else {
        toast.error(result.error)
        setWithLogo(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, withLogo, logoUrl, logoData])

  const render = useCallback(async (): Promise<{ svg: string; png: string }> => {
    const options = {
      errorCorrectionLevel: 'H' as const,
      margin: 2,
      color: { dark: '#111111', light: '#ffffff' },
    }
    let svgText = await QRCode.toString(qrUrl, { ...options, type: 'svg', width: SIZE })
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, qrUrl, { ...options, width: SIZE })
    if (withLogo && logoData) {
      const img = await loadImage(logoData)
      const box = logoBox(img, SIZE)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(box.plate.x, box.plate.y, box.plate.w, box.plate.h, SIZE * 0.02)
        ctx.fill()
        ctx.drawImage(img, box.x, box.y, box.w, box.h)
      }
      // SVG coordinates use the QR's own viewBox (modules), so scale accordingly.
      const viewBox = /viewBox="0 0 (\d+) (\d+)"/.exec(svgText)
      const vb = viewBox ? Number(viewBox[1]) : SIZE
      const b = logoBox(img, vb)
      svgText = svgText.replace(
        '</svg>',
        `<rect x="${b.plate.x}" y="${b.plate.y}" width="${b.plate.w}" height="${b.plate.h}" rx="${vb * 0.02}" fill="#fff"/><image href="${logoData}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/></svg>`,
      )
    }
    return { svg: svgText, png: canvas.toDataURL('image/png') }
  }, [qrUrl, withLogo, logoData])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    render()
      .then((result) => {
        if (cancelled) return
        setSvg(result.svg)
        setPng(result.png)
      })
      .catch(() => toast.error('No se pudo generar el código QR'))
    return () => {
      cancelled = true
    }
  }, [open, render, nonce])

  function download(kind: 'svg' | 'png') {
    const href =
      kind === 'svg' && svg ? URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })) : png
    if (!href) return
    const a = document.createElement('a')
    a.href = href
    a.download = `qr-${slug}.${kind}`
    a.click()
    if (kind === 'svg') URL.revokeObjectURL(href)
  }

  async function copy() {
    await navigator.clipboard.writeText(qrUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código QR · {name}</DialogTitle>
          <DialogDescription>
            Apunta siempre a la página pública publicada del profesional.
          </DialogDescription>
        </DialogHeader>
        <div className="mx-auto aspect-square w-full max-w-72 rounded-xl border bg-white p-2">
          {png ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated data URL, next/image adds nothing here
            <img src={png} alt={`Código QR hacia ${qrUrl}`} className="size-full" />
          ) : (
            <div className="bg-muted size-full animate-pulse rounded-lg" />
          )}
        </div>
        <p
          data-testid="qr-target"
          className="bg-muted rounded-md px-3 py-2 font-mono text-xs break-all"
        >
          {qrUrl}
        </p>
        {logoUrl && (
          <div className="flex items-center justify-between">
            <Label htmlFor="qr-logo">Logo central</Label>
            <Switch id="qr-logo" checked={withLogo} onCheckedChange={setWithLogo} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="outline" size="sm" onClick={() => download('svg')} disabled={!svg}>
            <Download /> SVG
          </Button>
          <Button variant="outline" size="sm" onClick={() => download('png')} disabled={!png}>
            <Download /> PNG
          </Button>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />} Copiar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNonce((n) => n + 1)}
            aria-label="Regenerar QR"
          >
            <RefreshCw /> Regenerar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
