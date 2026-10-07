import type { AppointmentStatus, ProfessionalStatus } from '@repo/domain'

export const PROFESSIONAL_STATUS_LABEL: Record<ProfessionalStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
}

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  new: 'Nueva',
  contacted: 'Contactada',
  scheduled: 'Agendada',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export const APPOINTMENT_STATUS_VARIANT: Record<
  AppointmentStatus,
  'accent' | 'warning' | 'success' | 'secondary' | 'destructive'
> = {
  new: 'accent',
  contacted: 'warning',
  scheduled: 'success',
  completed: 'secondary',
  cancelled: 'destructive',
}
