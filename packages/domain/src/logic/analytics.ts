export const ANALYTICS_EVENTS = [
  'profile_view',
  'professional_switch',
  'appointment_cta_click',
  'appointment_submit',
  'social_click',
  'testimonial_interaction',
  'qr_entry',
  'popup_shown',
  'popup_closed',
  'popup_restored',
  'popup_cta_click',
] as const
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]
export type AnalyticsProps = Record<string, string | number | boolean | undefined>
