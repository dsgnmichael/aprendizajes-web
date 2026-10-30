import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getStudentByCode, getStudentById } from '@repo/data-access'
import { PetStoryForm } from '@/components/parent-club/PetStoryForm'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { listApprovedPetStories } from '@repo/data-access'
import { PetsCarousel } from '@/components/landing/PetsCarousel'
import Link from 'next/link'

async function MascotaContent({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  
  // Buscamos al alumno por su código (ej: MICH2026) o por su ID de MongoDB
  const stories = await listApprovedPetStories()
  const safeStories = stories.map(s => ({
    _id: s._id.toString(),
    imageUrl: s.imageUrl,
    studentName: s.studentName,
    story: s.story,
    createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString()
  }))

  let student = await getStudentByCode(id)
  if (!student) {
    // Si no lo encuentra por código, intentamos por ID (por si acaso)
    student = await getStudentById(id)
  }

  // Si no existe el alumno, error 404
  if (!student) notFound()

  // Si el alumno existe pero NO tiene la mascota asignada, mostramos un mensaje
  if (!student.hasPet) {
    return (
      <div className="mx-auto max-w-lg rounded-[2rem] bg-white p-8 shadow-lifted text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Acceso Restringido</h1>
        <p className="mt-2 text-sm text-gray-600 mb-6">
          Hola {student.firstName}, actualmente no tienes asignada la mascota para el Diario. 
          Si crees que es un error, contáctanos.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white font-bold px-8 py-3 hover:bg-brand-deep transition-colors"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
      </div>
    )
  }

  // Si tiene la mascota, mostramos el formulario
  return (
    <>
      <div className="mx-auto max-w-lg rounded-[2rem] bg-white p-8 shadow-lifted mb-16">
      <div className="text-left mb-8">
        <h1 className="text-3xl font-black text-brand">Diario de nuestras mascotas 🐾</h1>
        <p className="mt-2 text-sm text-ink-muted">
          ¡Hola {student.firstName}! Nos encantaría saber cómo fue tu experiencia con la mascota. Cuéntanos tu anécdota y sube una foto para guardar este bonito recuerdo.
        </p>
      </div>

      <PetStoryForm studentId={student._id.toString()} studentName={`${student.firstName} ${student.lastName}`} />
      </div>

      {/* Carrusel de otros alumnos (Fuera de la tarjeta blanca) */}
      {safeStories.length > 0 && (
        <div className="mx-auto w-full max-w-4xl">
          <h2 className="text-3xl font-black text-brand text-center mb-8">Momentos de otros alumnos 🐾</h2>
          <PetsCarousel stories={safeStories} duration={5000} />
        </div>
      )}
    </>
  )
}

export default function MascotaPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="min-h-screen bg-canvas py-16 px-4">
      <Suspense fallback={
        <div className="mx-auto max-w-lg rounded-[2rem] bg-white p-8 shadow-lifted text-center">
          <p className="text-muted-foreground">Verificando tu código de alumno...</p>
        </div>
      }>
        <MascotaContent params={params} />
      </Suspense>
    </main>
  )
}
