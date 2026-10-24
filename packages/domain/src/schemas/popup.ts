import { z } from 'zod'
import { mediaRefSchema, text } from './common'

export const BUTTON_STYLES = ['dark', 'light', 'white'] as const
export type ButtonStyle = typeof BUTTON_STYLES[number]


const buttonUrlSchema = z.string().min(1, 'La URL es requerida').refine(
  (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'),
  'Debe ser una URL válida (http/https) o una ruta interna (ej. /contacto)'
)

export const popupButtonSchema = z.object({
  id: z.string().min(1),
  label: text(40).min(1, 'El texto del botón es requerido'),
  url: buttonUrlSchema, // Usamos el nuevo esquema flexible
  style: z.enum(BUTTON_STYLES).default('dark'),
  x: z.number().min(0).max(100).default(50),
  y: z.number().min(0).max(100).default(80),
})
export type PopupButton = z.infer<typeof popupButtonSchema>

export const popupSlideSchema = z.object({
  id: z.string().min(1),
  image: mediaRefSchema,
  buttons: z.array(popupButtonSchema).max(5).default([]),
})
export type PopupSlide = z.infer<typeof popupSlideSchema>

export const popupInputSchema = z.object({
  name: text(50).min(1, 'El nombre interno es requerido'),
  targetPath: text(100).min(1, 'La ruta es requerida').default('/'),
  autoCloseSeconds: z.number().int().min(0).max(60).default(0),
  // NUEVO: Arreglo de diapositivas (soporta 1 o varias)
  slides: z.array(popupSlideSchema).default([]),
  // CAMPOS LEGACY (Mantenidos para retrocompatibilidad con popups antiguos)
  image: mediaRefSchema.optional(),
  buttons: z.array(popupButtonSchema).max(5).default([]).optional(),
  active: z.boolean().default(true),
  floatingButtonStyle: z.enum(BUTTON_STYLES).default('dark'),
})

export type PopupInput = z.infer<typeof popupInputSchema>

export interface PopupDocument extends PopupInput {
  id: string
  createdAt: Date
  updatedAt: Date
}
