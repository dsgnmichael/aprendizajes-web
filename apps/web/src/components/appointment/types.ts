import type { AppointmentFormFields } from '@repo/domain'

/** Serializable subset of the profile needed by the appointment form. */
export interface AppointmentFormConfig {
  professionalSlug: string
  professionalName: string
  title: string
  intro: string
  fields: AppointmentFormFields
  modalities: string[]
  services: string[]
  consentText: string
  privacyUrl: string
}
