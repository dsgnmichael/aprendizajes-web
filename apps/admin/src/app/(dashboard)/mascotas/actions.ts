'use server'

import { revalidatePath } from 'next/cache'
import { updatePetStoryStatus, deletePetStory, updatePetStory, markPetStoriesAsRead } from '@repo/data-access'

export async function updatePetStoryStatusAction(id: string, status: 'pending' | 'approved' | 'rejected') {
  await updatePetStoryStatus(id, status)
  revalidatePath('/mascotas')
  revalidatePath('/')
}

export async function deletePetStoryAction(id: string) {
  await deletePetStory(id)
  revalidatePath('/mascotas')
  revalidatePath('/')
}

export async function updatePetStoryTextAction(id: string, story: string) {
  await updatePetStory(id, { story })
  revalidatePath('/mascotas')
  revalidatePath('/')
  return { success: true }
}

export async function updatePetStoryImageAction(id: string, imageUrl: string) {
  await updatePetStory(id, { imageUrl })
  revalidatePath('/mascotas')
  revalidatePath('/')
  return { success: true }
}

export async function markMascotasAsReadAction() {
  await markPetStoriesAsRead()
  revalidatePath('/mascotas')
  revalidatePath('/')
  return { success: true }
}
