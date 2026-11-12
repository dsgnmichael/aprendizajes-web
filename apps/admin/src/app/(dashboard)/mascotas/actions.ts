'use server'

import { markPetStoriesAsRead } from '@repo/data-access'
import { revalidatePath } from 'next/cache'

export async function markMascotasAsReadAction() {
  await markPetStoriesAsRead()
  revalidatePath('/', 'layout')
}


export async function updatePetStoryImageAction(id: string, imageUrl: string) {
  await updatePetStory(id, { imageUrl })
  revalidatePath('/mascotas')
  return { success: true }
}
