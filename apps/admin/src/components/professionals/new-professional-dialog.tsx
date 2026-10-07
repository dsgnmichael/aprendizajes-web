'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { professionalCreateSchema, slugify, type ProfessionalCreate } from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { checkSlugAction, createProfessionalAction } from '@/actions/professionals'
import { handleResult } from '@/components/use-action-toast'

export function NewProfessionalDialog({ publicBaseUrl }: { publicBaseUrl: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [slugTouched, setSlugTouched] = useState(false)
  const [checked, setChecked] = useState<{
    slug: string
    status: 'ok' | 'taken' | 'invalid'
  } | null>(null)
  const form = useForm<ProfessionalCreate>({
    resolver: zodResolver(professionalCreateSchema),
    defaultValues: { name: '', slug: '', professionalTitle: '' },
  })
  const slug = useWatch({ control: form.control, name: 'slug' })
  const slugStatus = slug.length < 2 ? 'idle' : checked?.slug === slug ? checked.status : 'checking'

  // Debounced availability check (state is only set from the async callback).
  useEffect(() => {
    if (slug.length < 2) return
    const t = setTimeout(async () => {
      const result = await checkSlugAction(slug)
      if (result.ok)
        setChecked({ slug, status: result.data.available ? 'ok' : (result.data.reason ?? 'taken') })
    }, 350)
    return () => clearTimeout(t)
  }, [slug])

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const data = handleResult(
        await createProfessionalAction(values),
        'Profesional creado en borrador',
      )
      if (data) {
        setOpen(false)
        form.reset()
        setSlugTouched(false)
        router.push(`/professionals/${data.id}`)
      }
    }),
  )

  const errors = form.formState.errors
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nuevo profesional
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo profesional</DialogTitle>
          <DialogDescription>
            Se crea en borrador con una página base. Podrás completarla y publicarla después.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="np-name">Nombre completo</Label>
            <Input
              id="np-name"
              aria-invalid={!!errors.name}
              {...form.register('name', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!slugTouched)
                    form.setValue('slug', slugify(e.target.value), {
                      shouldValidate: e.target.value.length > 1,
                    })
                },
              })}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="np-title">Profesión / especialidad</Label>
            <Input
              id="np-title"
              placeholder="Psicopedagoga"
              aria-invalid={!!errors.professionalTitle}
              {...form.register('professionalTitle')}
            />
            {errors.professionalTitle && (
              <p className="text-destructive text-xs">{errors.professionalTitle.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="np-slug">URL pública</Label>
            <div className="bg-muted/50 text-muted-foreground focus-within:ring-ring/50 flex items-center rounded-md border pl-3 text-sm focus-within:ring-[3px]">
              <span className="truncate">{publicBaseUrl.replace(/^https?:\/\//, '')}/</span>
              <Input
                id="np-slug"
                className="border-0 shadow-none focus-visible:ring-0"
                aria-invalid={!!errors.slug || slugStatus === 'taken'}
                {...form.register('slug', { onChange: () => setSlugTouched(true) })}
              />
            </div>
            <p className="text-muted-foreground text-xs" aria-live="polite">
              {errors.slug?.message ??
                {
                  idle: 'Minúsculas, números y guiones.',
                  checking: 'Comprobando disponibilidad…',
                  ok: 'Disponible.',
                  taken: 'Ya está en uso.',
                  invalid: 'No válido o reservado por el sistema.',
                }[slugStatus]}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={pending || slugStatus === 'taken' || slugStatus === 'invalid'}
            >
              {pending && <Loader2 className="animate-spin" />} Crear borrador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
