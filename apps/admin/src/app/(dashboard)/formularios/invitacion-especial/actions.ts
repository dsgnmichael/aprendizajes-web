'use server'

import { revalidatePath } from 'next/cache'
import {
  deleteParentClubRegistration,
  deleteManyParentClubRegistrations,
  toggleParentClubTag,
  markAllParentClubRegistrationsAsRead,
} from '@repo/data-access'
import type { ParentClubTag } from '@repo/domain'
import { requirePermission } from '@/lib/auth'

export async function deleteRegistrationAction(id: string) {
  await requirePermission('settings:write')
  try {
    const ok = await deleteParentClubRegistration(id)
    revalidatePath('/formularios')
    revalidatePath('/formularios/invitacion-especial')
    return ok ? { success: true } : { error: 'No se encontró el registro' }
  } catch (_error) {
    return { error: 'Error al eliminar el registro' }
  }
}

export async function deleteManyRegistrationsAction(ids: string[]) {
  await requirePermission('settings:write')
  if (ids.length === 0) return { error: 'No hay registros seleccionados' }
  try {
    const count = await deleteManyParentClubRegistrations(ids)
    revalidatePath('/formularios')
    revalidatePath('/formularios/invitacion-especial')
    return { success: true, count }
  } catch (_error) {
    return { error: 'Error al eliminar los registros' }
  }
}


export async function toggleTagAction(id: string, tag: ParentClubTag) {
  await requirePermission('settings:write')
  try {
    const newTags = await toggleParentClubTag(id, tag)
    revalidatePath('/formularios/invitacion-especial')
    return { success: true, tags: newTags }
  } catch (_error) {
    return { error: 'Error al actualizar las marcas' }
  }
}


export async function markAsReadAction() {
  await requirePermission('settings:write')
  try {
    await markAllParentClubRegistrationsAsRead()
    revalidatePath('/formularios')
    return { success: true }
  } catch (_error) {
    return { error: 'Error al marcar como leído' }
  }
}
