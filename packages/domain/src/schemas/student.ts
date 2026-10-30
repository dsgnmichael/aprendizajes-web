import { z } from 'zod'

export const studentSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, 'El nombre es obligatorio'),
  lastName: z.string().min(2, 'El apellido es obligatorio'),
  code: z.string().min(3, 'El código debe tener al menos 3 letras'),
  imageUrl: z.string().optional(),
  hasPet: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type StudentInput = z.infer<typeof studentSchema>
export type StudentDocument = StudentInput & { id: string }
