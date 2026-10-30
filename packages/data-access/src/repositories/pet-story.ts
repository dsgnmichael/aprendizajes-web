import { collections } from '@repo/database'
import { ObjectId } from 'mongodb'

export async function listPetStories() {
  const c = await collections()
  return c.petStories.find({}).sort({ createdAt: -1 }).toArray()
}

export async function updatePetStoryStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
  const c = await collections()
  await c.petStories.updateOne({ _id: new ObjectId(id) }, { $set: { status } })
}

export async function deletePetStory(id: string) {
  const c = await collections()
  await c.petStories.deleteOne({ _id: new ObjectId(id) })
}

export async function updatePetStoryText(id: string, story: string) {
  const c = await collections()
  await c.petStories.updateOne({ _id: new ObjectId(id) }, { $set: { story } })
}

export async function listApprovedPetStories() {
  const c = await collections()
  return c.petStories.find({ status: 'approved' }).sort({ createdAt: -1 }).toArray()
}

export async function countUnreadPetStories() {
  const c = await collections()
  return c.petStories.countDocuments({ readAt: null })
}

export async function markPetStoriesAsRead() {
  const c = await collections()
  await c.petStories.updateMany({ readAt: null }, { $set: { readAt: new Date() } })
}
