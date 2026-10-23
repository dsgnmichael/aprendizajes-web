'use server'

import { revalidatePath } from 'next/cache'
import { createPopup, updatePopup, deletePopup } from '@repo/data-access'
import { popupInputSchema, type PopupInput } from '@repo/domain'
import { requirePermission, toActor } from '@/lib/auth'

export async function createPopupAction(data: PopupInput) {
  const user = await requirePermission('settings:write')
  const actor = toActor(user)
  
  const parsed = popupInputSchema.safeParse(data)
  if (!parsed.success) return { error: 'Datos inválidos' }

  try {
    await createPopup(parsed.data, actor)
    revalidatePath('/popups')
    return { success: true }
  } catch (error) {
    return { error: 'Error al crear el popup' }
  }
}

export async function updatePopupAction(id: string, data: PopupInput) {
  const user = await requirePermission('settings:write')
  const actor = toActor(user)
  
  const parsed = popupInputSchema.safeParse(data)
  if (!parsed.success) return { error: 'Datos inválidos' }

  try {
    await updatePopup(id, parsed.data, actor)
    revalidatePath('/popups')
    return { success: true }
  } catch (error) {
    return { error: 'Error al actualizar el popup' }
  }
}

export async function deletePopupAction(id: string) {
  const user = await requirePermission('settings:write')
  const actor = toActor(user)

  try {
    await deletePopup(id, actor)
    revalidatePath('/popups')
    return { success: true }
  } catch (error) {
    return { error: 'Error al eliminar el popup' }
  }
}
