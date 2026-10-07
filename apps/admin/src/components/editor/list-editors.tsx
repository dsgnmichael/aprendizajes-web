'use client'

import { Controller, useFieldArray, useFormContext, type FieldValues } from 'react-hook-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { ICON_LABELS, ICON_NAMES, shortId } from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { TextareaField, TextField } from './fields'

const ICON_OPTIONS = ICON_NAMES.map((name) => ({ value: name, label: ICON_LABELS[name] }))

function RowControls({
  index,
  count,
  move,
  remove,
  label,
}: {
  index: number
  count: number
  move: (a: number, b: number) => void
  remove: (i: number) => void
  label: string
}) {
  return (
    <div className="flex shrink-0 items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={index === 0}
        onClick={() => move(index, index - 1)}
        aria-label={`Subir ${label}`}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={index === count - 1}
        onClick={() => move(index, index + 1)}
        aria-label={`Bajar ${label}`}
      >
        <ArrowDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => remove(index)}
        aria-label={`Eliminar ${label}`}
      >
        <Trash2 />
      </Button>
    </div>
  )
}

export function IconSelect({ name }: { name: string }) {
  const { control } = useFormContext<FieldValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger className="w-40 shrink-0" aria-label="Icono">
            <SelectValue>
              {ICON_LABELS[field.value as keyof typeof ICON_LABELS] ?? field.value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ICON_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}

/** Specialties / modalities / target audience: label + whitelisted icon. */
export function LabeledIconList({
  name,
  itemLabel,
  max,
}: {
  name: string
  itemLabel: string
  max: number
}) {
  const { control, register } = useFormContext<FieldValues>()
  const { fields, append, remove, move } = useFieldArray({ control, name })
  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Input aria-label={`${itemLabel} ${index + 1}`} {...register(`${name}.${index}.label`)} />
          <IconSelect name={`${name}.${index}.icon`} />
          <RowControls
            index={index}
            count={fields.length}
            move={move}
            remove={remove}
            label={itemLabel}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={fields.length >= max}
        onClick={() => append({ id: shortId('i'), label: '', icon: 'sparkles' })}
      >
        <Plus /> Agregar {itemLabel.toLowerCase()}
      </Button>
    </div>
  )
}

export function ServicesList() {
  const { control } = useFormContext<FieldValues>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'services' })
  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs font-medium">Servicio {index + 1}</span>
            <RowControls
              index={index}
              count={fields.length}
              move={move}
              remove={remove}
              label="servicio"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <TextField name={`services.${index}.name`} label="Nombre" />
            <TextField name={`services.${index}.duration`} label="Duración" placeholder="45 min" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <TextareaField
              name={`services.${index}.description`}
              label="Descripción"
              rows={2}
              maxLength={500}
            />
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Icono</span>
              <IconSelect name={`services.${index}.icon`} />
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={fields.length >= 20}
        onClick={() =>
          append({
            id: shortId('sv'),
            name: '',
            description: '',
            duration: '',
            icon: 'heart-handshake',
          })
        }
      >
        <Plus /> Agregar servicio
      </Button>
    </div>
  )
}

/** Plain string list (credentials). */
export function StringList({
  name,
  itemLabel,
  max,
}: {
  name: string
  itemLabel: string
  max: number
}) {
  const { control } = useFormContext<FieldValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const values = (field.value as string[] | undefined) ?? []
        const set = (next: string[]) => field.onChange(next)
        return (
          <div className="space-y-2">
            {values.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={value}
                  aria-label={`${itemLabel} ${index + 1}`}
                  onChange={(e) => set(values.map((v, i) => (i === index ? e.target.value : v)))}
                />
                <RowControls
                  index={index}
                  count={values.length}
                  label={itemLabel}
                  remove={(i) => set(values.filter((_, j) => j !== i))}
                  move={(a, b) => {
                    const next = [...values]
                    const [item] = next.splice(a, 1)
                    next.splice(b, 0, item ?? '')
                    set(next)
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={values.length >= max}
              onClick={() => set([...values, ''])}
            >
              <Plus /> Agregar {itemLabel.toLowerCase()}
            </Button>
          </div>
        )
      }}
    />
  )
}
