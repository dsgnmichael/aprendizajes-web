'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type PopupDocument, popupInputSchema, type PopupInput, type PopupSlide, MEDIA_LIMITS } from '@repo/domain'
import { Plus, Trash2, X, MousePointerClick, Image as ImageIcon, Loader2, Upload, GripVertical } from 'lucide-react'
import { upload } from '@vercel/blob/client'
import { toast } from '@repo/ui/components/sonner'
import { createPopupAction, updatePopupAction } from '@/app/(dashboard)/popups/actions'
import { saveMediaMetadataAction } from '@/actions/media'
import { toMediaRef } from '@/components/media/media-picker'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'

export function PopupForm({
  initialData,
  onClose,
  professionals,
}: {
  initialData?: PopupDocument
  onClose: () => void
  professionals: { slug: string, name: string, status: string }[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null)
  
  // Estados para Drag & Drop y Multi-upload
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [uploading, startTransition] = useTransition()
  const multiInputRef = useRef<HTMLInputElement>(null)

  const initialSlides = initialData?.slides && initialData.slides.length > 0 
    ? initialData.slides 
    : initialData?.image ? [{ id: 'legacy', image: initialData.image, buttons: [] }] : []

  const initialGlobalButtons = [
    ...(initialData?.buttons || []),
    ...(initialData?.slides?.flatMap(s => s.buttons || []) || [])
  ]

  const defaultValues: PopupInput = initialData ? {
    ...initialData,
    slides: initialSlides,
    buttons: initialGlobalButtons
  } : {
    name: '',
    targetPath: '/',
    autoCloseSeconds: 0,
    slides: [],
    buttons: [],
    active: true,
    floatingButtonStyle: 'dark',
  }

  const methods = useForm<PopupInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(popupInputSchema) as any,
    defaultValues,
  })

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = methods

  const { fields: globalButtons, append: appendGlobalButton, remove: removeGlobalButton } = useFieldArray({
    control,
    name: 'buttons',
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const slides = watch('slides') || []
  const currentSlide = slides[activeSlideIndex]
  const globalButtonsWatch = watch('buttons') || []

  const removeSlide = (index: number) => {
    const newSlides = [...slides]
    newSlides.splice(index, 1)
    setValue('slides', newSlides)
    if (activeSlideIndex >= newSlides.length) {
      setActiveSlideIndex(Math.max(0, newSlides.length - 1))
    }
  }

  // --- LÓGICA DE DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === index) return
    
    const newSlides = [...slides]
    const [movedItem] = newSlides.splice(draggedIdx, 1)
    if (!movedItem) return
    newSlides.splice(index, 0, movedItem)
    
    setValue('slides', newSlides)
    setActiveSlideIndex(index)
    setDraggedIdx(null)
  }

  // --- LÓGICA DE MULTI-UPLOAD ---
  const getDimensions = (file: File) => new Promise<{ width: number, height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error al leer la imagen'))
    }
    img.src = url
  })

  const handleMultiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    // Convertir a array ANTES de limpiar el input para evitar que se pierdan los archivos
    const filesArray = Array.from(files)
    e.target.value = ''

    startTransition(async () => {
      const newSlides: PopupSlide[] = [...slides]
      let successCount = 0
      const toastId = toast.loading(`Subiendo ${filesArray.length} imágenes...`)

      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i]
        if (!file) continue
        if (file.size > MEDIA_LIMITS.maxBytes) {
          toast.error(`El archivo ${file.name} supera el límite permitido (máx ${MEDIA_LIMITS.maxBytes / 1024 / 1024}MB)`)
          continue
        }

        try {
          const { width, height } = await getDimensions(file)
          const blob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
          })

          const result = await saveMediaMetadataAction({
            url: blob.url,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            width,
            height,
            hasAlpha: file.type === 'image/png' || file.type === 'image/webp',
            folder: 'site',
          })

          if (result.ok && result.data) {
            newSlides.push({
              id: Date.now().toString() + i,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              image: toMediaRef(result.data as any),
              buttons: []
            })
            successCount++
          } else {
            toast.error(`Error al guardar metadatos de ${file.name}`)
          }
        } catch (err: unknown) {
          // Aquí capturamos el error de Vercel Blob (ej: falta de token en local)
          toast.error(`Error al subir ${file.name}: ${(err as Error).message}`)
        }
      }

      if (successCount > 0) {
        setValue('slides', newSlides)
        setActiveSlideIndex(slides.length) // Ir a la primera nueva
        toast.success(`${successCount} imágenes agregadas al carrusel`, { id: toastId })
      } else {
        toast.error('No se pudo subir ninguna imagen. Revisa los errores.', { id: toastId })
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setLoading(true)
    setError('')

    const payload = {
      ...data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slides: data.slides.map((s: any) => ({ ...s, buttons: [] })),
      image: undefined
    }

    const res = initialData
      ? await updatePopupAction(initialData.id, payload)
      : await createPopupAction(payload)

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.refresh()
      onClose()
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeButtonIndex === null || !globalButtonsWatch[activeButtonIndex]) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)

    setValue(`buttons.${activeButtonIndex}.x`, Math.max(0, Math.min(100, x)))
    setValue(`buttons.${activeButtonIndex}.y`, Math.max(0, Math.min(100, y)))
  }

  const getButtonClass = (style: string | undefined) => {
    switch (style) {
      case 'light': return 'bg-purple-200 text-purple-900 border-transparent'
      case 'white': return 'bg-white text-purple-900 border-gray-200'
      case 'dark':
      default: return 'bg-purple-700 text-white border-transparent'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-background p-6 shadow-xl relative">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>
        
        <h2 className="text-xl font-bold mb-4">
          {initialData ? 'Editar Popup' : 'Nuevo Popup'}
        </h2>

        {error && <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
              {/* Columna Izquierda */}
              <div className="space-y-4">
                <div>
                  <Label>Nombre interno</Label>
                  <Input {...register('name')} className="mt-1" placeholder="Ej: Promo Verano" />
                  {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
                </div>
                
                <div>
                  <Label>Ruta donde aparece</Label>
                  <select
                    {...register('targetPath')}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="*">Todas las páginas (Global)</option>
                    <option value="/">Página de inicio</option>
                    <option value="/profesionales">Directorio de profesionales</option>
                    <option value="/servicios">Servicios</option>
                    <option value="/equipo">Equipo</option>
                    <option value="/contacto">Contacto</option>
                    {professionals.filter(p => p.status === 'published').map(p => (
                      <option key={p.slug} value={`/${p.slug}`}>Perfil: {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Auto-cierre (seg)</Label>
                    <Input type="number" {...register('autoCloseSeconds', { valueAsNumber: true })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Estilo Pestañita Flotante</Label>
                    <select
                      {...register('floatingButtonStyle')}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="dark">Oscuro</option>
                      <option value="light">Claro</option>
                      <option value="white">Blanco</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" {...register('active')} id="active-checkbox" className="mr-2 size-4" />
                  <Label htmlFor="active-checkbox">Popup Activo</Label>
                </div>

                <div className="border p-4 rounded-md bg-muted/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Diapositivas</Label>
                      <p className="text-[11px] text-muted-foreground">Arrastra para reordenar</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={multiInputRef}
                        type="file"
                        multiple
                        accept={MEDIA_LIMITS.mimeTypes.join(',')}
                        className="hidden"
                        onChange={handleMultiUpload}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => multiInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? <Loader2 className="size-4 animate-spin mr-1" /> : <Upload className="size-4 mr-1" />}
                        Subir varias
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {slides.map((slide, idx) => (
                      <div 
                        key={slide.id || idx} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, idx)}
                        className={cn(
                          "flex items-center justify-between p-2 border rounded cursor-pointer transition-opacity",
                          activeSlideIndex === idx ? "border-primary bg-primary/5" : "bg-background",
                          draggedIdx === idx ? "opacity-50" : "opacity-100"
                        )}
                        onClick={() => setActiveSlideIndex(idx)}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <GripVertical className="size-4 text-muted-foreground cursor-grab" />
                          {slide.image?.url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={slide.image.url} alt="thumb" className="size-8 rounded object-cover pointer-events-none" />
                          ) : (
                            <div className="size-8 rounded bg-muted flex items-center justify-center"><ImageIcon className="size-4 text-muted-foreground" /></div>
                          )}
                          <span className="text-sm font-medium">Diapositiva {idx + 1}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeSlide(idx); }} className="text-destructive hover:bg-destructive/10 h-8 px-2">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    {slides.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">No hay imágenes. Agrega o sube varias.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Columna Derecha (Previsualización) */}
              <div className="space-y-4">
                <div className="border p-4 rounded-md space-y-4 h-full flex flex-col">
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MousePointerClick className="size-4" />
                      Posicionar Visualmente
                    </h3>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      1. Haz clic en un botón abajo. 2. Haz clic en la imagen para posicionarlo.
                    </p>
                  </div>

                  <div className="relative border-2 border-dashed rounded-lg overflow-hidden bg-[repeating-conic-gradient(#f2f1ef_0_25%,#fff_0_50%)] bg-[length:16px_16px] flex-1 min-h-[300px] flex items-center justify-center">
                    {currentSlide?.image?.url ? (
                      <div 
                        className={cn("relative w-full h-full cursor-crosshair", activeButtonIndex !== null && "ring-2 ring-primary ring-inset")}
                        onClick={handleImageClick}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={currentSlide.image.url} alt="Preview" className="w-full h-full object-contain pointer-events-none" />
                        
                        {globalButtonsWatch?.map((btn, i) => (
                          btn.x !== undefined && btn.y !== undefined && (
                            <div
                              key={btn.id}
                              className={cn(
                                "absolute px-3 py-1.5 text-xs rounded shadow-sm transition-all -translate-x-1/2 -translate-y-1/2 pointer-events-none border font-medium",
                                i === activeButtonIndex ? "z-10 scale-110 ring-2 ring-primary" : "",
                                getButtonClass(btn.style)
                              )}
                              style={{ left: `${btn.x}%`, top: `${btn.y}%` }}
                            >
                              {btn.label || 'Botón'}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center px-4">Selecciona una diapositiva y sube una imagen a la izquierda.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Botones Globales */}
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-medium">Botones Globales</h3>
                  <p className="text-[11px] text-muted-foreground">Estos botones aparecerán en TODAS las diapositivas.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    appendGlobalButton({ id: Date.now().toString(), label: '', url: '', style: 'dark', x: 50, y: 50 })
                    setActiveButtonIndex(globalButtons.length)
                  }}
                >
                  <Plus className="size-4 mr-1" /> Agregar Botón
                </Button>
              </div>

              {globalButtons.map((field, index) => (
                <div 
                  key={field.id} 
                  className={cn(
                    "grid grid-cols-12 gap-3 mb-3 items-end border-b pb-3 p-2 rounded transition-colors cursor-pointer",
                    activeButtonIndex === index ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50"
                  )}
                  onClick={() => setActiveButtonIndex(index)}
                >
                  <div className="col-span-4 space-y-1">
                    <Label className="text-[11px]">Texto</Label>
                    <Input {...register(`buttons.${index}.label`)} placeholder="Ej: Ver oferta" className="h-8 text-sm" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-[11px]">URL</Label>
                    <Input {...register(`buttons.${index}.url`)} placeholder="https://..." className="h-8 text-sm" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[11px]">Estilo</Label>
                    <select {...register(`buttons.${index}.style`)} className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                      <option value="dark">Oscuro</option>
                      <option value="light">Claro</option>
                      <option value="white">Blanco</option>
                    </select>
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-[11px]">X %</Label>
                    <Input type="number" readOnly {...register(`buttons.${index}.x`)} className="h-8 text-xs bg-muted px-1" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-[11px]">Y %</Label>
                    <Input type="number" readOnly {...register(`buttons.${index}.y`)} className="h-8 text-xs bg-muted px-1" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGlobalButton(index);
                        if (activeButtonIndex === index) setActiveButtonIndex(null);
                      }}
                      className="text-destructive hover:bg-destructive/10 h-8 px-2"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {globalButtons.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No hay botones globales.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Popup'}</Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
