import { z } from 'zod'
import { optionalText, text } from './common'

/* -------------------------------------------------------------------------- */
/*  Marcas comerciales para clasificar a los padres (uso interno del admin)   */
/* -------------------------------------------------------------------------- */

export const PARENT_CLUB_TAGS = [
  'favorito',
  'alta_prioridad',
  'contactado',
  'reunion_agendada',
  'vip',
  'seguimiento',
  'en_pausa',
  'descartado',
] as const

export type ParentClubTag = typeof PARENT_CLUB_TAGS[number]

export const PARENT_CLUB_TAG_LABELS: Record<ParentClubTag, string> = {
  favorito: 'Favorito',
  alta_prioridad: 'Alta prioridad',
  contactado: 'Contactado',
  reunion_agendada: 'Reunión agendada',
  vip: 'Perfil ideal / VIP',
  seguimiento: 'Dar seguimiento',
  en_pausa: 'En pausa',
  descartado: 'Descartado',
}



export const SUPPORT_AREAS = [
  'conducta',
  'escolar',
  'emocional_adulto',
  'comunicacion',
  'situaciones_complejas',
  'desahogo',
  'esparcimiento',
  'herramientas_escolares',
  'talleres_especialistas',
] as const

export type SupportArea = typeof SUPPORT_AREAS[number]

export const SUPPORT_AREA_LABELS: Record<SupportArea, string> = {
  conducta: 'Manejo de conductas y límites',
  escolar: 'Acompañamiento escolar y tareas',
  emocional_adulto: 'Gestión emocional del adulto',
  comunicacion: 'Comunicación y vínculo familiar',
  situaciones_complejas: 'Situaciones familiares complejas',
  desahogo: 'Solo necesito desahogarme',
  esparcimiento: 'Espacio de esparcimiento',
  herramientas_escolares: 'Herramientas escolares',
  talleres_especialistas: 'Talleres con especialistas',
}

const nameRegex = /^[a-zA-ZÀ-ÿ\s']{3,120}$/

export const parentClubRegistrationSchema = z.object({
  fullName: text(120)
    .min(3, 'El nombre debe tener al menos 3 letras')
    .regex(nameRegex, 'El nombre solo puede contener letras y espacios'),
    
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de nacimiento inválida')
    .refine((val) => {
      const y = parseInt(val.slice(0, 4), 10)
      const m = parseInt(val.slice(5, 7), 10)
      const d = parseInt(val.slice(8, 10), 10)
      const birth = new Date(y, m - 1, d)
      return birth <= new Date()
    }, 'La fecha no puede ser en el futuro')
    .refine((val) => {
      const y = parseInt(val.slice(0, 4), 10)
      const m = parseInt(val.slice(5, 7), 10)
      const d = parseInt(val.slice(8, 10), 10)
      const birth = new Date(y, m - 1, d)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age >= 18 && age <= 70
    }, 'Debes tener entre 18 y 70 años'),

  whatsapp: z.string()
    .min(8, 'El número es muy corto')
    .max(25, 'El número es muy largo')
    .refine((val) => {
      const clean = val.replace(/[\s()-]/g, '')
      return /^\+?[1-9]\d{7,14}$/.test(clean)
    }, 'Selecciona tu país e ingresa un número de teléfono válido'),

  email: z.string().email('Correo electrónico inválido').max(160),
  supportAreas: z.array(z.enum(SUPPORT_AREAS)).min(1, 'Puedes seleccionar una o varias opciones de esta lista'),
  otherSupport: optionalText(250),
  formType: z.enum(['invitacion-especial', 'suscripcion-club', 'otro']).default('invitacion-especial'),
})

export type ParentClubRegistrationInput = z.infer<typeof parentClubRegistrationSchema>

export interface ParentClubRegistrationDocument extends ParentClubRegistrationInput {
  id: string
  status: 'nuevo' | 'contactado' | 'integrado' | 'cancelled'
  tags: ParentClubTag[]
  readAt: Date | null
  calendarClickedAt: Date | null
  cancelledAt: Date | null
  createdAt: Date
  updatedAt: Date
}
