'use server'

import { markPetStoriesAsRead } from '@repo/data-access'
import { revalidatePath } from 'next/cache'

export async function markMascotasAsReadAction() {
  await markPetStoriesAsRead()
  revalidatePath('/', 'layout')
}
