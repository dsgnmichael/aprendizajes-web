type ClassValue = string | false | null | undefined | 0

/** Tiny class joiner (the public site avoids shipping tailwind-merge). */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
