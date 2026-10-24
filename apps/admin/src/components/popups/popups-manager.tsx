'use client'

import { useState } from 'react'
import type { PopupDocument } from '@repo/domain'
import { Plus, Trash2, Edit, Image as ImageIcon } from 'lucide-react'
import { PopupForm } from './popup-form'
import { deletePopupAction } from '@/app/(dashboard)/popups/actions'

export function PopupsManager({ initialPopups = [], professionals = [] }: { initialPopups?: PopupDocument[], professionals?: { slug: string, name: string, status: string }[] }) {
  const [popups, setPopups] = useState(initialPopups)
  const [isCreating, setIsCreating] = useState(false)
  const [editingPopup, setEditingPopup] = useState<PopupDocument | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este popup?')) return
    const res = await deletePopupAction(id)
    if (!res.error) {
      setPopups(popups.filter((p) => p.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Tus Popups</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Crear Nuevo Popup
        </button>
      </div>

      {popups.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <ImageIcon className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h3 className="text-lg font-medium">No hay publicidad emergente</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crea tu primer popup para mostrarlo en la web.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popups.map((popup) => (
            <div key={popup.id} className="rounded-lg border p-4 space-y-3 shadow-sm">
              <div className="aspect-video w-full rounded-md bg-muted overflow-hidden relative">
                {popup.image?.url && !popup.image.url.includes('localhost') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={popup.image.url} alt={popup.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-8" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium truncate">{popup.name}</h3>
                <p className="text-xs text-muted-foreground">Ruta: {popup.targetPath}</p>
                <p className="text-xs text-muted-foreground">
                  {popup.slides && popup.slides.length > 0 
                    ? `${popup.slides.length} ${popup.slides.length === 1 ? 'diapositiva' : 'diapositivas'}` 
                    : `${popup.buttons?.length || 0} ${(popup.buttons?.length || 0) === 1 ? 'botón' : 'botones'}`}
                </p>
                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${popup.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {popup.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex gap-2 pt-2 border-t mt-2">
                <button onClick={() => setEditingPopup(popup)} className="flex-1 flex items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs hover:bg-muted">
                  <Edit className="size-3" /> Editar
                </button>
                <button onClick={() => handleDelete(popup.id)} className="flex-1 flex items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs text-destructive hover:bg-destructive/10">
                  <Trash2 className="size-3" /> Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreating && (
        <PopupForm professionals={professionals} onClose={() => { setIsCreating(false); window.location.reload(); }} />
      )}
      {editingPopup && (
        <PopupForm initialData={editingPopup} professionals={professionals} onClose={() => { setEditingPopup(null); window.location.reload(); }} />
      )}
    </div>
  )
}
