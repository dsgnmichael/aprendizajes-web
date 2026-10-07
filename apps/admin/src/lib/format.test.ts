import { describe, expect, it } from 'vitest'
import { formatDate, initials } from './format'

describe('initials', () => {
  it('uses the first letters of the first two words', () => {
    expect(initials('Jessica de Sousa')).toBe('JD')
    expect(initials('  maría  ')).toBe('M')
    expect(initials('')).toBe('')
  })
})

describe('formatDate', () => {
  it('renders an em dash for empty values', () => {
    expect(formatDate(null)).toBe('—')
  })
  it('formats in the Santiago time zone', () => {
    expect(formatDate('2026-01-15T12:00:00Z')).toMatch(/2026/)
  })
})
