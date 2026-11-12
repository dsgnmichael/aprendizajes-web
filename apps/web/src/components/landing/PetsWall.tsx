import { listApprovedPetStories } from '@repo/data-access'
import { PetsCarousel } from './PetsCarousel'
import { PetsActions } from './PetsActions'

export async function PetsWall({ section }: { section?: any } = {}) {
  // Consultamos siempre la base de datos para tener la foto más reciente
  const stories = await listApprovedPetStories()
  
  if (stories.length === 0) return null

  const safeStories = stories.map((s) => ({
    _id: s._id.toString(),
    imageUrl: s.imageUrl,
    studentName: s.studentName,
    story: s.story,
    createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
  }))

  const c = section?.content || {}

  return (
    <section id="diario-mascotas" className="py-16 bg-canvas scroll-mt-24">
      <div className="mx-auto w-full max-w-content px-5 sm:px-8">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-3xl font-black text-brand mb-2">
            {c.title || 'Diario de nuestras Mascotas'}
          </h2>
          {c.subtitle ? (
            <p className="text-ink-muted">{c.subtitle}</p>
          ) : (
            <p className="text-ink-muted">Un premio a su esfuerzo que se convierte en una gran anécdota</p>
          )}
        </div>
        
        <PetsCarousel stories={safeStories} duration={(c.duration || 5) * 1000} />
        
        <PetsActions showFormButton={c.showFormButton} showInfoButton={c.showInfoButton} />
      </div>
    </section>
  )
}
