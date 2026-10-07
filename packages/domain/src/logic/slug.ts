import { RESERVED_SLUGS } from '../constants'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** "Jessica de Sousa" → "jessica-de-sousa" (strips accents and symbols). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase())
}

export function isValidSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 80 && SLUG_PATTERN.test(slug) && !isReservedSlug(slug)
}
