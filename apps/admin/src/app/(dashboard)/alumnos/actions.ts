'use server'

import { createStudent, updateStudent, deleteStudent } from '@repo/data-access'
import { studentSchema } from '@repo/domain'
import { revalidatePath } from 'next/cache'

export async function saveStudentAction(formData: FormData) {
  const id = formData.get('id') as string | null
  const data = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    code: formData.get('code') as string,
    hasPet: formData.get('hasPet') === 'on',
    imageUrl: formData.get('imageUrl') as string || undefined,
  }

  const parsed = studentSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Datos inválidos' }
  }

  if (id) {
    await updateStudent(id, parsed.data)
  } else {
    await createStudent(parsed.data)
  }

  revalidatePath('/alumnos')
  return { success: true }
}

export async function deleteStudentAction(id: string) {
  await deleteStudent(id)
  revalidatePath('/alumnos')
}

export async function toggleStudentPetAction(id: string, hasPet: boolean) {
  await updateStudent(id, { hasPet })
  revalidatePath('/alumnos')
}
