'use client'

import { Controller, useFormContext, useWatch, type FieldValues } from 'react-hook-form'
import { AlertTriangle, Undo2 } from 'lucide-react'
import { colorTokens, contrastRatio, type ColorToken } from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'

export const COLOR_LABELS: Record<ColorToken, string> = {
  canvas: 'Lienzo (fondo)',
  surface: 'Superficie / tarjetas',
  ink: 'Texto principal',
  inkMuted: 'Texto secundario',
  brand: 'Marca (panel)',
  brandDeep: 'Marca profunda',
  brandSoft: 'Marca suave',
  brandMist: 'Bruma de marca',
  onBrand: 'Texto sobre marca',
  accent: 'Acento',
  accentWarm: 'Acento cálido',
  border: 'Bordes',
}

const PAIRS: [ColorToken, ColorToken, string][] = [
  ['ink', 'canvas', 'Texto sobre lienzo'],
  ['ink', 'surface', 'Texto sobre tarjetas'],
  ['inkMuted', 'canvas', 'Texto secundario sobre lienzo'],
  ['onBrand', 'brand', 'Texto sobre panel de marca'],
]

const HEX = /^#([0-9a-f]{6})$/i

/**
 * Color editor. With `inherit` (professional overrides) an empty value means
 * "use the site theme"; otherwise (site theme) every token is required.
 */
export function ColorTokensEditor({
  name,
  inherit,
}: {
  name: string
  inherit?: Record<ColorToken, string>
}) {
  const { control } = useFormContext<FieldValues>()
  const values =
    (useWatch({ control, name }) as Partial<Record<ColorToken, string>> | undefined) ?? {}
  const effective = (key: ColorToken) => values[key] || inherit?.[key] || colorTokens[key]
  const warnings = PAIRS.map(([fg, bg, label]) => ({
    label,
    ratio: contrastRatio(effective(fg), effective(bg)),
  })).filter((w) => w.ratio < 4.5)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(colorTokens) as ColorToken[]).map((key) => (
          <Controller
            key={key}
            control={control}
            name={`${name}.${key}`}
            render={({ field }) => {
              const value = (field.value as string | undefined) || ''
              const shown = value || effective(key)
              return (
                <div className="flex items-center gap-2 rounded-lg border p-2">
                  <input
                    type="color"
                    value={HEX.test(shown) ? shown : '#000000'}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
                    aria-label={`Color ${COLOR_LABELS[key]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{COLOR_LABELS[key]}</p>
                    <Input
                      value={value}
                      placeholder={inherit ? `${effective(key)} (heredado)` : colorTokens[key]}
                      onChange={(e) =>
                        field.onChange(
                          inherit && e.target.value === '' ? undefined : e.target.value,
                        )
                      }
                      className="mt-1 h-7 font-mono text-xs"
                      aria-label={`Hex ${COLOR_LABELS[key]}`}
                    />
                  </div>
                  {inherit && value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => field.onChange(undefined)}
                      aria-label="Volver a heredar"
                    >
                      <Undo2 />
                    </Button>
                  )}
                </div>
              )
            }}
          />
        ))}
      </div>
      {warnings.length > 0 && (
        <div
          role="status"
          className="border-warning/50 bg-warning/10 space-y-1 rounded-lg border p-3 text-sm"
        >
          {warnings.map((w) => (
            <p key={w.label} className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-[oklch(0.55_0.13_65)]" aria-hidden />
              {w.label}: contraste {w.ratio.toFixed(2)}:1 (WCAG AA requiere 4.5:1)
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
