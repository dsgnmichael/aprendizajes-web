import { listApprovedPetStories } from '@repo/data-access'
import { unstable_cache } from 'next/cache'
import { PetsCarousel } from './PetsCarousel'
import { PetsActions } from './PetsActions'

const getStories = unstable_cache(
  async () => {
    const stories = await listApprovedPetStories()
    return stories.map((s) => ({
      _id: s._id.toString(),
      imageUrl: s.imageUrl,
      studentName: s.studentName,
      story: s.story,
      createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
    }))
  },
  ['pet-stories'],
  { revalidate: 60, tags: ['pet-stories'] }
)

export async function PetsWall({ section }: { section?: any } = {}) {
  const stories = await getStories()
  if (stories.length === 0) return null

  const c = section?.content || {}

  return (
    <section id="diario-mascotas" className="py-16 bg-canvas">
      <div className="mx-auto w-full max-w-content px-5 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-brand mb-2">
            {c.title || 'Momentos con nuestra mascota 🐾'}
          </h2>
          {c.subtitle ? (
            <p className="text-ink-muted">{c.subtitle}</p>
          ) : (
            <p className="text-ink-muted">Comparte cómo fue tu experiencia.</p>
          )}
        </div>
        
        <PetsCarousel stories={stories} duration={(c.duration || 5) * 1000} />
        
        <PetsActions showFormButton={c.showFormButton} showInfoButton={c.showInfoButton} />
      </div>
    </section>
  )
}
