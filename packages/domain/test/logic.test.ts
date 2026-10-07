import { describe, expect, it } from 'vitest'
import {
  can,
  isValidSlug,
  parseInline,
  parseRichText,
  publicProfileUrl,
  qrTargetUrl,
  resolveAppointmentAction,
  richTextToPlain,
  safeRedirectPath,
  slugify,
  whatsappUrl,
  appointmentConfigSchema,
} from '../src'

describe('slugs', () => {
  it('slugifies names with accents and symbols', () => {
    expect(slugify('  Jessica de Sousa ')).toBe('jessica-de-sousa')
    expect(slugify('María José Peña!!')).toBe('maria-jose-pena')
  })
  it('rejects reserved and malformed slugs', () => {
    expect(isValidSlug('admin')).toBe(false)
    expect(isValidSlug('api')).toBe(false)
    expect(isValidSlug('Jessica')).toBe(false)
    expect(isValidSlug('a--b')).toBe(false)
    expect(isValidSlug('maria-perez')).toBe(true)
  })
})

describe('permissions', () => {
  it('applies the role matrix server-side', () => {
    expect(can('SUPER_ADMIN', 'users:manage')).toBe(true)
    expect(can('ADMIN', 'users:manage')).toBe(false)
    expect(can('ADMIN', 'integrations:connect')).toBe(false)
    expect(can('ADMIN', 'settings:write')).toBe(true)
    expect(can('EDITOR', 'professionals:publish')).toBe(true)
    expect(can('EDITOR', 'settings:write')).toBe(false)
    expect(can('EDITOR', 'audit:read')).toBe(false)
    expect(can(undefined, 'dashboard:read')).toBe(false)
  })
})

describe('links', () => {
  it('builds public and QR urls on the PUBLIC domain', () => {
    expect(publicProfileUrl('https://dominio.cl/', 'jessica-de-sousa')).toBe('https://dominio.cl/jessica-de-sousa')
    expect(qrTargetUrl('https://dominio.cl', 'maria')).toBe('https://dominio.cl/maria?src=qr')
  })
  it('creates wa.me links with encoded messages', () => {
    expect(whatsappUrl('+56 9 1234 5678', 'Hola & chao')).toBe('https://wa.me/56912345678?text=Hola%20%26%20chao')
  })
  it('resolves the appointment CTA per mode', () => {
    const base = appointmentConfigSchema.parse({})
    expect(resolveAppointmentAction(base, { professionalName: 'Ana' })).toEqual({ kind: 'form' })
    const wa = resolveAppointmentAction(
      { ...base, mode: 'WHATSAPP', whatsappNumber: '+56912345678', whatsappMessage: 'Hola {name}' },
      { professionalName: 'Ana' },
    )
    expect(wa).toEqual({ kind: 'link', external: true, href: 'https://wa.me/56912345678?text=Hola%20Ana' })
    expect(resolveAppointmentAction({ ...base, mode: 'EXTERNAL_URL', externalUrl: 'javascript:alert(1)' }, { professionalName: 'A' })).toEqual({
      kind: 'disabled',
    })
  })
  it('validates mode-specific appointment config', () => {
    expect(appointmentConfigSchema.safeParse({ mode: 'EXTERNAL_URL', externalUrl: '' }).success).toBe(false)
    expect(appointmentConfigSchema.safeParse({ mode: 'WHATSAPP', whatsappNumber: '12' }).success).toBe(false)
  })
  it('prevents open redirects', () => {
    expect(safeRedirectPath('/professionals')).toBe('/professionals')
    expect(safeRedirectPath('//evil.com')).toBe('/')
    expect(safeRedirectPath('https://evil.com')).toBe('/')
    expect(safeRedirectPath('/\\evil.com')).toBe('/')
    expect(safeRedirectPath(undefined, '/x')).toBe('/x')
  })
})

describe('rich text', () => {
  it('parses the safe subset', () => {
    const blocks = parseRichText('## Título\n\nHola **mundo** y *cursiva*\n\n- uno\n- dos')
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'list'])
  })
  it('never produces unsafe links', () => {
    const nodes = parseInline('[clic](javascript:alert(1)) [ok](https://a.cl)')
    expect(nodes.some((n) => n.type === 'link' && n.href.startsWith('javascript'))).toBe(false)
    expect(nodes.some((n) => n.type === 'link' && n.href === 'https://a.cl')).toBe(true)
  })
  it('treats HTML as plain text', () => {
    expect(richTextToPlain('<script>alert(1)</script>')).toBe('<script>alert(1)</script>')
  })
})
