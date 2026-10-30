'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Edit2, Trash2, Check, X } from 'lucide-react'
import { Button } from '@repo/ui/components/button'

export function PetStoryCard({ story, onUpdateStatus, onDelete, onEditText }: { 
  story: any, 
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void,
  onDelete: (id: string) => void,
  onEditText: (id: string, text: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(story.story)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };


  const handleSave = () => {
    onEditText(story._id, editText)
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-gray-100">
        <Image src={story.imageUrl} alt="Mascota" fill className="object-cover" unoptimized />
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-3 flex justify-between items-start">
          <div>
            <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${
              story.status === 'approved' ? 'bg-green-100 text-green-800' :
              story.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {story.status === 'approved' ? 'Aprobado' : story.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
            </span>
            <h3 className="font-bold mt-2">{story.studentName}</h3>
            <p className="text-xs text-muted-foreground">{formatDate(story.createdAt)}</p>
          </div>
        </div>
        
        {isEditing ? (
          <div className="flex-1 flex flex-col">
            <textarea 
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-sm border rounded-lg p-2 flex-1 mb-2 focus:outline-none focus:border-brand"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}><X className="w-4 h-4 mr-1"/> Cancelar</Button>
              <Button size="sm" onClick={handleSave}><Check className="w-4 h-4 mr-1"/> Guardar</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 flex-1 italic">"{story.story}"</p>
        )}
        
        <div className="mt-5 flex gap-2">
          {story.status === 'pending' ? (
            <>
              <button onClick={() => onUpdateStatus(story._id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition">Aprobar</button>
              <button onClick={() => onUpdateStatus(story._id, 'rejected')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded-lg text-sm transition">Rechazar</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-lg text-sm transition flex items-center justify-center gap-1">
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => { if(confirm('¿Seguro que quieres eliminar esta historia?')) onDelete(story._id) }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg text-sm transition flex items-center justify-center gap-1">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
