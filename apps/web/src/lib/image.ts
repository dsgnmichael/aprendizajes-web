import type { MediaRef } from '@repo/domain'

/** CSS object-position from the focal point stored with the image. */
export function focalPosition(image?: Pick<MediaRef, 'focalX' | 'focalY'>) {
  return image ? `${image.focalX}% ${image.focalY}%` : '50% 50%'
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
