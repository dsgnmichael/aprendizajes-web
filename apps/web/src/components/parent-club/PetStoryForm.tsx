'use client'

import { useState } from 'react'
import { upload } from '@vercel/blob/client'
import imageCompression from 'browser-image-compression'
import { Loader2, Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { toast } from '@repo/ui/components/sonner'
import Image from 'next/image'

export function PetStoryForm({ studentId, studentName }: { studentId: string, studentName: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [story, setStory] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objectUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    
    if (!file || !story) {
      toast.error('Por favor, sube una foto y escribe tu anécdota.')
      return
    }

    setIsUploading(true)

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp' as const
      }
      const compressedFile = await imageCompression(file, options)

      const filename = `mascotas/${Date.now()}-${compressedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      
      const blob = await upload(filename, compressedFile, {
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
        throw new Error(errorData.error || 'Error al guardar en la base de datos')
      }

      setIsSuccess(true)
      toast.success('¡Historia enviada con éxito!')
    } catch (error: any) {
      console.error('❌ ERROR DETALLADO:', error)
      setErrorMsg(error.message || 'Hubo un error al subir tu historia. Intenta de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="mt-6 rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-green-600 mb-2" />
        <h3 className="text-lg font-bold text-green-900">¡Gracias por compartir!</h3>
        <p className="text-sm text-green-700 mt-1">Tu anécdota con la mascota será publicada pronto.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <h3 className="text-base font-black text-brand">Comparte tu experiencia con la mascota 🐾</h3>
        <p className="text-xs text-ink-muted mt-0.5">Cuéntanos cómo fue esta experiencia y sube una foto para recordarlo.</p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-600 font-bold border border-red-200">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold mb-1.5">Tu foto</label>
        <div className="flex items-center gap-3">
          <div className="relative size-16 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
            {previewUrl ? (
              <Image src={previewUrl} alt="Vista previa" fill className="object-cover" unoptimized />
            ) : (
              <ImageIcon className="size-5 text-gray-400" />
            )}
          </div>
          
          <div className="flex flex-col">
            <label 
              htmlFor="file-upload" 
              className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[#ece7f3] px-4 py-1.5 text-sm font-bold text-[#4d2a80] hover:bg-[#b7ace5] transition-colors"
            >
              Buscar Imagen
            </label>
            <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
              {file ? file.name : 'Ningún archivo seleccionado'}
            </p>
            <input 
              id="file-upload"
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1.5">Tu anécdota</label>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Ej: La mascota estaba muy tranquila, pudimos acariciarla..."
          className="w-full rounded-xl border p-2.5 min-h-[80px] text-sm focus:border-brand focus:outline-none"
          maxLength={300}
        />
        <div className="flex justify-end mt-1">
          <span className={`text-[11px] ${story.length > 280 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
            {story.length}/300
          </span>
        </div>
      </div>

      <Button type="submit" disabled={isUploading} className="w-full rounded-full bg-brand text-white font-bold py-2.5 text-sm">
        {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</> : <><Upload className="mr-2 h-4 w-4" /> Publicar historia</>}
      </Button>
    </form>
  )
}
