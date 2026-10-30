import { listPetStories, updatePetStoryStatus, deletePetStory, updatePetStoryText } from '@repo/data-access'
import { revalidatePath } from 'next/cache'
import { PetStoryCard } from '@/components/mascotas/PetStoryCard'
import { MarkAsReadTrigger } from '@/components/mascotas/MarkAsReadTrigger'

export default async function MascotasPage() {
  const stories = await listPetStories()

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    'use server'
    await updatePetStoryStatus(id, status)
    revalidatePath('/mascotas')
  }

  async function deleteStory(id: string) {
    'use server'
    await deletePetStory(id)
    revalidatePath('/mascotas')
  }

  async function editText(id: string, text: string) {
    'use server'
    await updatePetStoryText(id, text)
    revalidatePath('/mascotas')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black mb-2 text-brand">Historias de Mascotas 🐾</h1>
      <p className="text-muted-foreground mb-8">Revisa, edita o elimina las anécdotas que suben los alumnos.</p>
      <MarkAsReadTrigger />

      {stories.length === 0 ? (
        <div className="text-center p-12 bg-muted/30 rounded-2xl">
          <p className="text-muted-foreground">Aún no hay historias enviadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <PetStoryCard 
              key={story._id.toString()} 
              story={{
                _id: story._id.toString(),
                studentId: story.studentId?.toString() || '',
                studentName: story.studentName,
                imageUrl: story.imageUrl,
                story: story.story,
                status: story.status,
                createdAt: story.createdAt?.toISOString() || null
              }} 
              onUpdateStatus={updateStatus}
              onDelete={deleteStory}
              onEditText={editText}
            />
          ))}
        </div>
      )}
    </div>
  )
}
