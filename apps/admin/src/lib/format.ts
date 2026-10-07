const dateTime = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Santiago',
})
const date = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'America/Santiago' })

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '—'
  return dateTime.format(typeof value === 'string' ? new Date(value) : value)
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—'
  return date.format(typeof value === 'string' ? new Date(value) : value)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
