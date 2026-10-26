/**
 * Genera el link "Añadir a Google Calendar" para el evento del Club de Padres.
 * Google Calendar acepta fechas en UTC (formato YYYYMMDDTHHmmssZ).
 */
export interface CalendarEvent {
  title: string
  description: string
  location: string
  startUTC: string // YYYYMMDDTHHmmssZ
  endUTC: string
}

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.startUTC}/${event.endUTC}`,
    details: event.description,
    location: event.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Datos del evento del Club de Padres (31 de octubre 2026, 10:00-12:00 Venezuela UTC-4).
 * En UTC: 14:00-16:00.
 */
export const CLUB_EVENT = {
  title: 'Primera sesión gratuita - Club de Padres Aprendizajess',
  description:
    'Te esperamos en la primera actividad para padres de Aprendizajess. ' +
    'Traé tu credencial (correo electrónico) o el QR. Cualquier duda: +58 424 121 4452.',
  location: 'Av. El Paseo, Los Rosales, Caracas, Distrito Capital',
  startUTC: '20261031T140000Z', // 31 Oct 2026 10:00 AM Venezuela
  endUTC: '20261031T160000Z',   // 31 Oct 2026 12:00 PM Venezuela
  mapsUrl: 'https://maps.app.goo.gl/vm21V6L3KEkgjJ9Q7',
}
