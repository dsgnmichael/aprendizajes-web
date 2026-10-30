'use client'

import { useState } from 'react'
import { upload } from '@vercel/blob/client'
import { Loader2, Upload, CheckCircle2 } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { toast } from '@repo/ui/components/sonner'

export function PetStoryForm({ studentId, studentName }: { studentId: string, studentName: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [story, setStory] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !story) {
      toast.error('Por favor, sube una foto y escribe tu anécdota.')
      return
    }

    setIsUploading(true)
    try {
      const filename = `mascotas/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const blob = await upload(filename, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })

      const res = await fetch('/api/parent-club/pet-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentName,
          imageUrl: blob.url,
          story,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al guardar la historia')
      }

      setIsSuccess(true)
      toast.success('¡Historia enviada con éxito!')
    } catch (error) {
      console.error(error)
      toast.error('Hubo un error al subir tu historia. Intenta de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="mt-8 rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-green-600 mb-2" />
        <h3 className="text-lg font-bold text-green-900">¡Gracias por compartir!</h3>
        <p className="text-sm text-green-700 mt-1">Tu anécdota con la mascota será publicada pronto.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 border-t pt-6 space-y-4">
      <div>
        <h3 className="text-lg font-black text-brand">Escribe tu historia 📝</h3>
        <p className="text-sm text-ink-muted mt-1">Sube una foto y cuéntanos lo que más te gustó de esta experiencia.</p>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">Tu foto</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#ece7f3] file:text-[#4d2a80] hover:file:bg-[#b7ace5]"
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">Tu anécdota</label>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Ej: La mascota estaba muy tranquila, pudimos acariciarla y nos tomamos una foto juntos..."
          className="w-full rounded-xl border p-3 min-h-[100px] text-sm focus:border-brand focus:outline-none"
          maxLength={300}
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${story.length > 280 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
            {story.length}/300
          </span>
        </div>
      </div>

      <Button type="submit" disabled={isUploading} className="w-full rounded-full bg-brand text-white font-bold py-3">
        {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</> : <><Upload className="mr-2 h-4 w-4" /> Publicar historia</>}
      </Button>
    </form>
  )
}
