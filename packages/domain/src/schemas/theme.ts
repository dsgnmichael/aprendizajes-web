import { z } from 'zod'
import {
  buttonShapes,
  colorTokens,
  FONT_CHOICES,
  MOTION_INTENSITIES,
  radiusScale,
  type ColorToken,
} from '../tokens'
import { hexColorSchema } from './common'

const colorKeys = Object.keys(colorTokens) as [ColorToken, ...ColorToken[]]

export const themeColorsSchema = z.object(
  Object.fromEntries(colorKeys.map((key) => [key, hexColorSchema.default(colorTokens[key])])) as {
    [K in ColorToken]: z.ZodDefault<typeof hexColorSchema>
  },
)

export const themeSchema = z.object({
  colors: themeColorsSchema.default(colorTokens as unknown as z.infer<typeof themeColorsSchema>),
  fontSans: z.enum(FONT_CHOICES.sans).default('lato'),
  fontDisplay: z.enum(FONT_CHOICES.display).default('loverine'),
  radius: z.enum(Object.keys(radiusScale) as [keyof typeof radiusScale]).default('lg'),
  buttonShape: z.enum(Object.keys(buttonShapes) as [keyof typeof buttonShapes]).default('pill'),
  motion: z.enum(MOTION_INTENSITIES).default('normal'),
  /** Visual richness of decorative layers (glows, grain, orbit lines). */
  visualIntensity: z.enum(['low', 'medium', 'high']).default('medium'),
})
export type Theme = z.infer<typeof themeSchema>

/** Per-professional overrides: every key optional, inherits from site theme. */
export const themeOverridesSchema = z.object({
  colors: z
    .object(
      Object.fromEntries(colorKeys.map((key) => [key, hexColorSchema.optional()])) as {
        [K in ColorToken]: z.ZodOptional<typeof hexColorSchema>
      },
    )
    .partial()
    .default({}),
  radius: themeSchema.shape.radius.unwrap().optional(),
  buttonShape: themeSchema.shape.buttonShape.unwrap().optional(),
  motion: themeSchema.shape.motion.unwrap().optional(),
  visualIntensity: themeSchema.shape.visualIntensity.unwrap().optional(),
})
export type ThemeOverrides = z.infer<typeof themeOverridesSchema>

export const defaultTheme: Theme = themeSchema.parse({})

export function mergeTheme(base: Theme, overrides?: Partial<ThemeOverrides> | null): Theme {
  if (!overrides) return base
  const colors = { ...base.colors }
  for (const [key, value] of Object.entries(overrides.colors ?? {})) {
    if (value) colors[key as ColorToken] = value
  }
  return {
    ...base,
    colors,
    radius: overrides.radius ?? base.radius,
    buttonShape: overrides.buttonShape ?? base.buttonShape,
    motion: overrides.motion ?? base.motion,
    visualIntensity: overrides.visualIntensity ?? base.visualIntensity,
  }
}

const kebab = (value: string) => value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

/** Converts `#RRGGBB` into `r g b` channels so Tailwind can apply alpha. */
export function hexToChannels(hex: string): string {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = Number.parseInt(h.slice(0, 6), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/**
 * Generates the CSS custom properties consumed by the public site. All input
 * values are validated (hex colors / enums), so the output can't inject CSS.
 */
export function themeToCssVars(theme: Theme): Record<string, string> {
  const vars: Record<string, string> = {}
  // `--t-*` are runtime theme variables; Tailwind's @theme maps utilities to them.
  for (const [key, value] of Object.entries(theme.colors)) {
    vars[`--t-${kebab(key)}`] = value
  }
  const radius = radiusScale[theme.radius]
  vars['--t-radius-card'] = radius.card
  vars['--t-radius-panel'] = radius.panel
  vars['--t-radius-control'] = radius.control
  vars['--t-radius-button'] = buttonShapes[theme.buttonShape]
  vars['--t-font-sans'] = theme.fontSans === 'lato' ? 'var(--font-lato)' : 'system-ui'
  vars['--t-font-display'] = theme.fontDisplay === 'loverine' ? 'var(--font-loverine)' : 'var(--t-font-sans)'
  vars['--t-motion'] = String(theme.motion === 'off' ? 0 : 1)
  return vars
}

/** Relative luminance contrast ratio (WCAG 2.x), used by the admin to warn. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = hexToChannels(hex)
      .split(' ')
      .map(Number)
      .map((c) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      }) as [number, number, number]
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number]
  return (l1 + 0.05) / (l2 + 0.05)
}
