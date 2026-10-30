'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveStudentAction, deleteStudentAction, toggleStudentPetAction } from '@/app/(dashboard)/alumnos/actions'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { toast } from '@repo/ui/components/sonner'
import { Pencil, Trash2, Plus, X, Dog, Camera, Loader2, User, Link as LinkIcon, Check, Copy } from 'lucide-react'
import Image from 'next/image'
import { upload } from '@vercel/blob/client'

export function StudentManager({ initialStudents }: { initialStudents: any[] }) {
  const router = useRouter()
  const [students, setStudents] = useState(initialStudents)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  
  // Estados para la subida de imagen
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    // Inyectamos la URL de la imagen que subimos manualmente
    formData.append('imageUrl', imageUrl)

    const res = await saveStudentAction(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success(editing ? 'Alumno actualizado' : 'Alumno creado')
      setIsOpen(false)
      setEditing(null)
      setImageUrl('')
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este alumno?')) return
    await deleteStudentAction(id)
    toast.success('Alumno eliminado')
    router.refresh()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const filename = `alumnos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const blob = await upload(filename, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      setImageUrl(blob.url)
      toast.success('Foto subida correctamente')
    } catch (error) {
      toast.error('Error al subir la foto')
    } finally {
      setIsUploading(false)
    }
  }

  const openEdit = (student: any) => {
    setEditing(student)
    setImageUrl(student.imageUrl || '')
    setIsOpen(true)
  }

  const copyLink = (id: string, code: string) => {
    // En producción, usamos la URL base configurada o la URL actual
    const isLocal = window.location.hostname === 'localhost'
    const baseUrl = isLocal 
      ? window.location.origin.replace('3001', '3000') 
      : (process.env.NEXT_PUBLIC_PUBLIC_BASE_URL || 'https://aprendizajess.vercel.app')
      
    const url = `${baseUrl}/mascota/${code}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  const openNew = () => {
    setEditing(null)
    setImageUrl('')
    setIsOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-brand">Alumnos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los alumnos, sus fotos y atributos.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2"/> Nuevo Alumno</Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Editar Alumno' : 'Nuevo Alumno'}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="w-4 h-4"/></Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editing && <input type="hidden" name="id" value={editing._id} />}
              
              {/* Subida de Foto */}
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="relative size-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                  {imageUrl ? (
                    <Image src={imageUrl} alt="Alumno" fill className="object-cover" unoptimized />
                  ) : (
                    <User className="size-10 text-gray-300" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="animate-spin text-brand size-6" />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Button type="button" variant="outline" size="sm" className="relative">
                    <Camera className="w-4 h-4 mr-2" />
                    {imageUrl ? 'Cambiar foto' : 'Subir foto'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input name="firstName" defaultValue={editing?.firstName} required />
              </div>
              <div>
                <label className="text-sm font-medium">Apellido</label>
                <Input name="lastName" defaultValue={editing?.lastName} required />
              </div>
              <div>
                <label className="text-sm font-medium">Código Único</label>
                <Input name="code" defaultValue={editing?.code} required placeholder="Ej: MICH2026" />
              </div>
              
              <Button type="submit" className="w-full mt-6" disabled={isUploading}>
                {isUploading ? 'Subiendo foto...' : 'Guardar Alumno'}
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((s) => (
          <div key={s._id.toString()} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="relative size-14 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  {s.imageUrl ? (
                    <Image src={s.imageUrl} alt="Alumno" fill className="object-cover" unoptimized />
                  ) : (
                    <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg leading-tight">{s.firstName} {s.lastName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500 font-mono">{s.code}</p>
                    <button 
                      onClick={() => copyCode(s._id.toString(), s.code)}
                      className="text-gray-400 hover:text-brand transition-colors p-1"
                      title="Copiar código"
                    >
                      {copiedCodeId === s._id.toString() ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {s.hasPet && (
                    <span className="inline-block mt-2 bg-[#ece7f3] text-brand text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 w-max">
                      <Dog className="w-3 h-3"/> Mascota
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => copyLink(s._id.toString(), s.code)}
                className="p-2 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-full transition-colors"
                title="Copiar enlace del diario"
              >
                {copiedId === s._id.toString() ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <LinkIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button 
                variant={s.hasPet ? "default" : "secondary"} 
                size="sm" 
                className={`w-full ${s.hasPet ? 'bg-[#4d2a80] hover:bg-[#2e1752]' : ''}`}
                onClick={async () => {
                  // 1. Actualización visual inmediata (Optimista)
                  const newHasPet = !s.hasPet;
                  setStudents(prev => prev.map(st => 
                    st._id === s._id ? { ...st, hasPet: newHasPet } : st
                  ));
                  
                  // 2. Guardar en base de datos en segundo plano
                  await toggleStudentPetAction(s._id.toString(), newHasPet);
                  router.refresh();
                }}
              >
                <Dog className="w-4 h-4 mr-2"/> 
                {s.hasPet ? 'Quitar Mascota' : 'Asignar Mascota'}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit({...s, _id: s._id.toString()})}>
                  <Pencil className="w-4 h-4 mr-1"/> Editar
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(s._id.toString())}>
                  <Trash2 className="w-4 h-4 mr-1"/> Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}
        {students.length === 0 && <p className="text-gray-500 col-span-full">No hay alumnos registrados.</p>}
      </div>
    </div>
  )
}
