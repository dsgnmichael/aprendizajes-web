'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type PopupDocument, popupInputSchema, type PopupInput } from '@repo/domain'
import { Plus, Trash2, X, MousePointerClick } from 'lucide-react'
import { createPopupAction, updatePopupAction } from '@/app/(dashboard)/popups/actions'
import { ImageField } from '@/components/editor/image-field'
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
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null)

  const methods = useForm<PopupInput>({
    resolver: zodResolver(popupInputSchema),
    defaultValues: initialData || {
      name: '',
      targetPath: '/',
      autoCloseSeconds: 0,
      image: undefined,
      buttons: [],
      active: true,
      floatingButtonStyle: 'dark',
    },
  })

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = methods

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'buttons',
  })

  const image = watch('image')
  const buttons = watch('buttons')

  const onSubmit = async (data: PopupInput) => {
    setLoading(true)
    setError('')

    const res = initialData
      ? await updatePopupAction(initialData.id, data)
      : await createPopupAction(data)

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.refresh()
      onClose()
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeButtonIndex === null || !buttons || activeButtonIndex >= buttons.length) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)

    setValue(`buttons.${activeButtonIndex}.x`, Math.max(0, Math.min(100, x)))
    setValue(`buttons.${activeButtonIndex}.y`, Math.max(0, Math.min(100, y)))
  }

  // Función para previsualizar los colores de los botones en el admin
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

                <div className="border p-4 rounded-md bg-muted/10">
                  <ImageField name="image" label="Imagen del Popup" folder="site" aspect="aspect-video" />
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
                      1. Agrega un botón abajo. 2. Haz clic en él. 3. Clic en la imagen.
                    </p>
                  </div>

                  <div className="relative border-2 border-dashed rounded-lg overflow-hidden bg-[repeating-conic-gradient(#f2f1ef_0_25%,#fff_0_50%)] bg-[length:16px_16px] flex-1 min-h-[300px] flex items-center justify-center">
                    {image?.url ? (
                      <div 
                        className={cn("relative w-full h-full cursor-crosshair", activeButtonIndex !== null && "ring-2 ring-primary ring-inset")}
                        onClick={handleImageClick}
                      >
                        <img src={image.url} alt="Preview" className="w-full h-full object-contain pointer-events-none" />
                        
                        {buttons?.map((btn, i) => (
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
                      <p className="text-xs text-muted-foreground text-center px-4">Sube una imagen a la izquierda.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Botones */}
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Lista de Botones</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    append({ id: Date.now().toString(), label: '', url: '', style: 'dark', x: 50, y: 50 })
                    setActiveButtonIndex(fields.length)
                  }}
                >
                  <Plus className="size-4 mr-1" /> Agregar Botón
                </Button>
              </div>

              {fields.map((field, index) => (
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
                        remove(index);
                        if (activeButtonIndex === index) setActiveButtonIndex(null);
                      }}
                      className="text-destructive hover:bg-destructive/10 h-8 px-2"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
