/**
 * Design tokens shared by the public site. Values here are the *defaults*;
 * colors, fonts, radius and motion intensity can be overridden from the
 * backoffice (site theme) and per professional (theme overrides).
 *
 * Seeded from the legacy brand palette (cream #F5F4F0, ink #1A1A1A, purple
 * #5B4B7A / #8B7BA8 / #B8A8D0) plus the logo violet #4D2A80 and the logo's
 * heart red / pencil yellow, used sparingly as accents.
 */
export const colorTokens = {
  canvas: '#F5F4F0',
  surface: '#FFFFFF',
  ink: '#1A1A1A',
  inkMuted: '#5A5566',
  brand: '#4D2A80',
  brandDeep: '#2E1752',
  brandSoft: '#B8A8D0',
  brandMist: '#ECE7F3',
  onBrand: '#FFFFFF',
  accent: '#E8323C',
  accentWarm: '#F6B94A',
  border: '#E4E0EA',
} as const
export type ColorToken = keyof typeof colorTokens

export const radiusScale = {
  sm: { card: '14px', panel: '24px', control: '10px' },
  md: { card: '20px', panel: '36px', control: '14px' },
  lg: { card: '28px', panel: '48px', control: '18px' },
  xl: { card: '36px', panel: '64px', control: '22px' },
} as const
export type RadiusScale = keyof typeof radiusScale

export const buttonShapes = {
  pill: '999px',
  rounded: '16px',
  square: '6px',
} as const
export type ButtonShape = keyof typeof buttonShapes

export const spaceTokens = {
  '3xs': '0.25rem',
  '2xs': '0.5rem',
  xs: '0.75rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2.5rem',
  xl: '4rem',
  '2xl': '6rem',
} as const

export const containerTokens = {
  prose: '42rem',
  content: '72rem',
  wide: '84rem',
} as const

export const zIndexTokens = {
  base: 0,
  raised: 10,
  header: 40,
  overlay: 60,
  modal: 70,
  toast: 80,
} as const

export const shadowTokens = {
  soft: '0 1px 2px rgb(30 16 60 / 0.06), 0 8px 24px -12px rgb(30 16 60 / 0.18)',
  lifted: '0 2px 4px rgb(30 16 60 / 0.06), 0 24px 48px -20px rgb(30 16 60 / 0.35)',
  glow: '0 30px 80px -30px rgb(77 42 128 / 0.55)',
} as const

/** Motion tokens (seconds) and easing curves. */
export const motionTokens = {
  duration: { fast: 0.18, normal: 0.36, slow: 0.7 },
  ease: {
    /** Expressive deceleration for entrances. */
    out: [0.16, 1, 0.3, 1] as const,
    /** Symmetric for state changes. */
    inOut: [0.65, 0, 0.35, 1] as const,
    /** Snappy for exits. */
    in: [0.7, 0, 0.84, 0] as const,
  },
  spring: { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 } as const,
} as const

export const MOTION_INTENSITIES = ['off', 'subtle', 'normal', 'expressive'] as const
export type MotionIntensity = (typeof MOTION_INTENSITIES)[number]

/** Multiplier applied to translate distances depending on intensity. */
export const motionDistance: Record<MotionIntensity, number> = {
  off: 0,
  subtle: 10,
  normal: 18,
  expressive: 28,
}

export const FONT_CHOICES = {
  sans: ['lato', 'system'] as const,
  display: ['loverine', 'none'] as const,
}
