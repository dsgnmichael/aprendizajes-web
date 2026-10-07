import { describe, expect, it } from 'vitest'
import { profileTags } from './revalidate'

describe('profileTags', () => {
  it('invalidates the new and previous slug plus the directory and landing', () => {
    expect(profileTags('nuevo-slug', 'viejo-slug')).toEqual([
      'profile:nuevo-slug',
      'profile:viejo-slug',
      'directory',
      'landing',
    ])
  })
  it('ignores missing slugs', () => {
    expect(profileTags(null, undefined)).toEqual(['directory', 'landing'])
  })
})
