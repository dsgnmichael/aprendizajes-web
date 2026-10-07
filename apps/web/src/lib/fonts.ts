import localFont from 'next/font/local'

/** Brand sans (kept from the legacy site), subset to Latin + WOFF2. */
export const lato = localFont({
  variable: '--font-lato',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
  src: [
    { path: '../fonts/Lato-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Lato-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/Lato-Black.woff2', weight: '900', style: 'normal' },
    { path: '../fonts/Lato-BlackItalic.woff2', weight: '900', style: 'italic' },
  ],
})

/** Brand handwritten script (legacy "Loverine"), used for accents only. */
export const loverine = localFont({
  variable: '--font-loverine',
  display: 'swap',
  preload: true,
  fallback: ['cursive'],
  src: [{ path: '../fonts/Loverine.woff2', weight: '400', style: 'normal' }],
})
