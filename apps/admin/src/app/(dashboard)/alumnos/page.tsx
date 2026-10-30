import { listStudents } from '@repo/data-access'
import { StudentManager } from '@/components/alumnos/StudentManager'

export default async function AlumnosPage() {
  const students = await listStudents()
  
  // Serializar los ObjectId para que no fallen al pasar al cliente
  const safeStudents = students.map(s => ({
    ...s,
    _id: s._id.toString(),
    imageUrl: s.imageUrl || null,
    createdAt: s.createdAt?.toISOString(),
    updatedAt: s.updatedAt?.toISOString(),
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <StudentManager initialStudents={safeStudents} />
    </div>
  )
}
