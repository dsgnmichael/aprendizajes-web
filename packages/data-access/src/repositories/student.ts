import { collections } from '@repo/database'
import { ObjectId } from 'mongodb'
import type { StudentInput } from '@repo/domain'

export async function createStudent(data: StudentInput) {
  const c = await collections()
  const now = new Date()
  const doc = {
    _id: new ObjectId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  await c.students.insertOne(doc)
  return { ...data, id: doc._id.toHexString() }
}

export async function listStudents() {
  const c = await collections()
  return c.students.find({}).sort({ createdAt: -1 }).toArray()
}

export async function getStudentById(id: string) {
  const c = await collections()
  try {
    return await c.students.findOne({ _id: new ObjectId(id) })
  } catch {
    return null
  }
}

export async function getStudentByCode(code: string) {
  const c = await collections()
  return await c.students.findOne({ code })
}

export async function updateStudent(id: string, data: Partial<StudentInput>) {
  const c = await collections()
  await c.students.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } }
  )
}

export async function deleteStudent(id: string) {
  const c = await collections()
  await c.students.deleteOne({ _id: new ObjectId(id) })
}
