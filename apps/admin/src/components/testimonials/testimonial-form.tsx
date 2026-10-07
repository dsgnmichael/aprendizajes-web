'use client'

import { useTransition } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { testimonialInputSchema, type TestimonialInput } from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { createTestimonialAction, updateTestimonialAction } from '@/actions/testimonials'
import { Field, SwitchField, TextareaField, TextField } from '@/components/editor/fields'
import { ImageField } from '@/components/editor/image-field'
import { handleResult } from '@/components/use-action-toast'

const GLOBAL = '__global'
const NO_RATING = '__none'

export function TestimonialFormDialog({
  open,
  onOpenChange,
  editing,
  professionals,
  defaultProfessionalId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: (TestimonialInput & { id: string }) | null
  professionals: { id: string; name: string }[]
  defaultProfessionalId: string | null
  onSaved: () => void
}) {
  const [pending, startTransition] = useTransition()
  const form = useForm<z.input<typeof testimonialInputSchema>, unknown, TestimonialInput>({
    resolver: zodResolver(testimonialInputSchema),
    values: editing ?? {
      professionalId: defaultProfessionalId,
      authorName: '',
      authorDetail: '',
      rating: 5,
      content: '',
      date: new Date().toISOString().slice(0, 10),
      sourceLabel: '',
      sourceUrl: '',
      enabled: true,
      featured: false,
      displayOrder: 0,
      isDemo: false,
    },
  })

  const submit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = editing
        ? await updateTestimonialAction(editing.id, values)
        : await createTestimonialAction(values)
      handleResult(result, editing ? 'Testimonio actualizado' : 'Testimonio creado')
      if (result.ok) {
        onOpenChange(false)
        onSaved()
      }
    }),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar testimonio' : 'Nuevo testimonio manual'}</DialogTitle>
          <DialogDescription>
            Usa testimonios reales y con autorización de la persona.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="professionalId"
                render={({ field }) => (
                  <Field label="Profesional">
                    <Select
                      value={field.value ?? GLOBAL}
                      onValueChange={(v) => field.onChange(v === GLOBAL ? null : v)}
                    >
                      <SelectTrigger aria-label="Profesional">
                        <SelectValue>
                          {field.value
                            ? (professionals.find((p) => p.id === field.value)?.name ?? '—')
                            : 'Todos (testimonio general)'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GLOBAL}>Todos (testimonio general)</SelectItem>
                        {professionals.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <Field label="Valoración">
                    <Select
                      value={field.value == null ? NO_RATING : String(field.value)}
                      onValueChange={(v) => field.onChange(v === NO_RATING ? null : Number(v))}
                    >
                      <SelectTrigger aria-label="Valoración">
                        <SelectValue>
                          {field.value == null
                            ? 'Sin valoración'
                            : `${'★'.repeat(field.value)} (${field.value})`}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_RATING}>Sin valoración</SelectItem>
                        {[5, 4, 3, 2, 1].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {'★'.repeat(n)} ({n})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <TextField name="authorName" label="Nombre o iniciales" />
              <TextField
                name="authorDetail"
                label="Detalle (opcional)"
                placeholder="Mamá de Tomás, 9 años"
              />
            </div>
            <TextareaField name="content" label="Testimonio" rows={4} maxLength={2000} />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField name="date" label="Fecha" type="date" />
              <TextField name="sourceLabel" label="Origen (texto)" placeholder="Encuesta, email…" />
              <TextField name="sourceUrl" label="Enlace de origen" placeholder="https://…" />
            </div>
            <ImageField
              name="authorAvatar"
              label="Foto (opcional)"
              folder="testimonials"
              aspect="aspect-square"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <SwitchField name="enabled" label="Visible" />
              <SwitchField name="featured" label="Destacado" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} Guardar
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
