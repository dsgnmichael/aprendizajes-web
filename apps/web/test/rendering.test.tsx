import { SECTION_TYPES } from '@repo/domain'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sectionComponents } from '@/components/sections/registry'
import { RichText } from '@/components/ui/RichText'

describe('section registry (public renderer)', () => {
  it('has a renderer for every section type declared in the domain registry', () => {
    expect(Object.keys(sectionComponents).sort()).toEqual([...SECTION_TYPES].sort())
  })
})

describe('RichText', () => {
  it('renders formatting as elements and never injects HTML', () => {
    const { container } = render(<RichText value={'Hola **mundo** <img src=x onerror=alert(1)>\n\n- [sitio](https://a.cl)\n- [malo](javascript:alert(1))'} />)
    expect(container.querySelector('strong')?.textContent).toBe('mundo')
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>')
    const links = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(links).toEqual(['https://a.cl'])
  })
})

describe('landing registry (public renderer)', () => {
  it('has a renderer for every landing section type', async () => {
    const { LANDING_SECTION_TYPES } = await import('@repo/domain')
    const { landingComponents } = await import('@/components/landing/registry')
    expect(Object.keys(landingComponents).sort()).toEqual([...LANDING_SECTION_TYPES].sort())
  })
})
