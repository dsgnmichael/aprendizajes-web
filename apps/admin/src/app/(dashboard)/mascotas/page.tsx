import { listPetStories } from '@repo/data-access'
import { PetStoryCard } from '@/components/mascotas/PetStoryCard'
import { MarkAsReadTrigger } from '@/components/mascotas/MarkAsReadTrigger'

export default async function MascotasPage() {
  const stories = await listPetStories()

  const safeStories = stories.map(s => ({
    ...s,
    _id: s._id.toString(),
    createdAt: s.createdAt?.toISOString() || null,
  }))

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <MarkAsReadTrigger />
      <div className="mb-8">
        <h1 className="text-3xl font-black text-brand">Historias de Mascotas 🐾</h1>
        <p className="text-muted-foreground mt-1">Revisa, edita o elimina las anécdotas que suben los alumnos.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeStories.map((story) => (
          <PetStoryCard key={story._id} story={story} />
        ))}
        {safeStories.length === 0 && <p className="text-gray-500">No hay historias todavía.</p>}
      </div>
    </div>
  )
}
