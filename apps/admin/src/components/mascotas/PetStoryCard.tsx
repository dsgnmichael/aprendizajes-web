'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Trash2, Pencil, Image as ImageIcon, Loader2, X, Save } from 'lucide-react'
import { toast } from '@repo/ui/components/sonner'
import { Button } from '@repo/ui/components/button'
import { updatePetStoryStatusAction, deletePetStoryAction, updatePetStoryTextAction, updatePetStoryImageAction } from '@/app/(dashboard)/mascotas/actions'
import { upload } from '@vercel/blob/client'
import { compressImageIfNeeded } from '@/lib/compress-image'

export function PetStoryCard({ story }: { story: any }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(story.story)
  const [image, setImage] = useState(story.imageUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleStatus = async (status: 'approved' | 'rejected') => {
    await updatePetStoryStatusAction(story.id, status)
    toast.success(status === 'approved' ? 'Historia aprobada' : 'Historia rechazada')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('¿Seguro que deseas eliminar esta historia?')) return
    await deletePetStoryAction(story.id)
    toast.success('Historia eliminada')
    router.refresh()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileToUpload = await compressImageIfNeeded(file)
      const filename = `mascotas/${Date.now()}-${fileToUpload.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const blob = await upload(filename, fileToUpload, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      
      setImage(blob.url)
      toast.success('Imagen subida. Haz clic en Guardar para confirmar.')
    } catch (error) {
      toast.error('Error al subir la imagen')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updatePetStoryTextAction(story.id, text)
      if (image !== story.imageUrl) {
        await updatePetStoryImageAction(story.id, image)
      }
      toast.success('Historia actualizada correctamente')
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      toast.error('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col rounded-xl bg-white border shadow-sm overflow-hidden relative">
      {story.status !== 'approved' && (
        <div className="absolute top-2 left-2 z-10 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-md">
          {story.status === 'pending' ? 'Pendiente' : 'Rechazada'}
        </div>
      )}

      <div className="relative h-48 w-full bg-gray-100 group">
        {image ? (
          <Image src={image} alt="Mascota" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <ImageIcon className="size-8" />
          </div>
        )}
        
        {isEditing && (
          <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploading ? (
              <Loader2 className="size-6 text-white animate-spin" />
            ) : (
              <>
                <ImageIcon className="size-6 text-white mb-1" />
                <span className="text-xs font-bold text-white">Cambiar Foto</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
          </label>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg leading-tight">{story.studentName}</h3>
          <span className="text-xs text-gray-500">
            {formatDate(story.createdAt)}
          </span>
        </div>

        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full flex-1 min-h-[100px] p-2 text-sm border rounded-lg focus:outline-none focus:border-brand resize-none mb-4"
          />
        ) : (
          <p className="text-sm text-gray-600 italic flex-1 mb-4">"{story.story}"</p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 min-w-[100px] border-gray-300 text-gray-700 hover:bg-gray-50" 
                onClick={() => { setIsEditing(false); setImage(story.imageUrl); setText(story.story); }} 
                disabled={isSaving || isUploading}
              >
                <X className="size-4 mr-1" /> Cancelar
              </Button>
              <Button 
                size="sm" 
                className="flex-1 min-w-[100px] bg-[#4d2a80] hover:bg-[#2e1752] text-white font-bold" 
                onClick={handleSave} 
                disabled={isSaving || isUploading}
              >
                {isSaving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Save className="size-4 mr-1" />} Guardar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsEditing(true)}>
                <Pencil className="size-4 mr-1" /> Editar
              </Button>
              {story.status !== 'approved' && (
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatus('approved')}>
                  <CheckCircle2 className="size-4 mr-1" /> Aprobar
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
