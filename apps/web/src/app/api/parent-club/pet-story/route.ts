import { NextResponse, type NextRequest } from 'next/server'
import { collections } from '@repo/database'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, studentName, imageUrl, story } = body

    if (!studentId || !imageUrl || !story) {
      return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 })
    }

    if (story.length > 300) {
      return NextResponse.json({ error: 'La historia no puede superar los 300 caracteres.' }, { status: 400 })
    }

    // Validar que el studentId sea un ObjectId válido
    if (!ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: 'El ID del alumno no es válido.' }, { status: 400 })
    }

    const c = await collections()
    
    await c.petStories.insertOne({
      _id: new ObjectId(),
      studentId: new ObjectId(studentId),
      studentName,
      imageUrl,
      story,
      status: 'pending',
      readAt: null,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('❌ Error guardando mascota en MongoDB:', error.message)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
