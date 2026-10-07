'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Controller, useFieldArray, useFormContext, type FieldValues } from 'react-hook-form'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { shortId, type FieldDescriptor, type MediaRef } from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import { Label } from '@repo/ui/components/label'
import { MediaPickerDialog } from '@/components/media/media-picker'
import { useMediaUrl } from '@/components/media/media-url'
import { IconField } from './icon-field'
import { ImageField } from './image-field'
import {
  NumberField,
  RichTextField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from './fields'

/** Builds an empty item for an `items` descriptor (string fields → '', booleans → false). */
function emptyItem(fields: FieldDescriptor[]): Record<string, unknown> {
  const item: Record<string, unknown> = { id: shortId('it') }
  for (const f of fields) {
    if (f.kind === 'image') continue
    item[f.name] =
      f.kind === 'boolean'
        ? false
        : f.kind === 'number'
          ? 0
          : f.kind === 'icon'
            ? 'sparkles'
            : f.kind === 'cta'
              ? { label: '', href: '' }
              : f.kind === 'images'
                ? []
                : ''
  }
  return item
}

/**
 * Renders the editor control for one registry FieldDescriptor. This is what
 * makes the page builder "auto-generated": adding a new section type only
 * requires declaring its schema + descriptors in @repo/domain.
 */
export function DescriptorField({
  descriptor,
  base,
}: {
  descriptor: FieldDescriptor
  base: string
}) {
  const name = `${base}.${descriptor.name}`
  switch (descriptor.kind) {
    case 'text':
      return (
        <TextField
          name={name}
          label={descriptor.label}
          placeholder={descriptor.placeholder}
          help={descriptor.help}
          maxLength={descriptor.max}
        />
      )
    case 'href':
      return (
        <TextField
          name={name}
          label={descriptor.label}
          placeholder="https://… · /ruta · #ancla · mailto:"
          help={descriptor.help}
        />
      )
    case 'textarea':
      return (
        <TextareaField
          name={name}
          label={descriptor.label}
          rows={descriptor.rows}
          help={descriptor.help}
          placeholder={descriptor.placeholder}
        />
      )
    case 'richtext':
      return <RichTextField name={name} label={descriptor.label} help={descriptor.help} />
    case 'boolean':
      return <SwitchField name={name} label={descriptor.label} help={descriptor.help} />
    case 'number':
      return (
        <NumberField
          name={name}
          label={descriptor.label}
          min={descriptor.min}
          max={descriptor.max}
          help={descriptor.help}
        />
      )
    case 'select':
      return <SelectField name={name} label={descriptor.label} options={descriptor.options} />
    case 'cta':
      return (
        <fieldset className="space-y-3 rounded-lg border p-3">
          <legend className="px-1 text-sm font-medium">{descriptor.label}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField name={`${name}.label`} label="Texto" />
            <TextField name={`${name}.href`} label="Enlace" placeholder="https://… · #seccion" />
          </div>
          {descriptor.help && <p className="text-muted-foreground text-xs">{descriptor.help}</p>}
        </fieldset>
      )
    case 'items':
      return <ItemsField descriptor={descriptor} name={name} />
    case 'images':
      return <ImagesField name={name} label={descriptor.label} help={descriptor.help} />
    case 'image':
      return (
        <ImageField
          name={name}
          label={descriptor.label}
          help={descriptor.help}
          folder="site"
          aspect="aspect-[4/3]"
        />
      )
    case 'icon':
      return <IconField name={name} label={descriptor.label} />
  }
}

function ItemsField({
  descriptor,
  name,
}: {
  descriptor: Extract<FieldDescriptor, { kind: 'items' }>
  name: string
}) {
  const { control } = useFormContext<FieldValues>()
  const { fields, append, remove, move } = useFieldArray({ control, name })
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{descriptor.label}</legend>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              {descriptor.itemLabel} {index + 1}
            </span>
            <div className="flex">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                aria-label="Subir"
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
                aria-label="Bajar"
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
                aria-label={`Eliminar ${descriptor.itemLabel}`}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          {descriptor.fields.map((sub) => (
            <DescriptorField key={sub.name} descriptor={sub} base={`${name}.${index}`} />
          ))}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(emptyItem(descriptor.fields))}
      >
        <Plus /> Agregar {descriptor.itemLabel.toLowerCase()}
      </Button>
    </fieldset>
  )
}

function ImagesField({ name, label, help }: { name: string; label: string; help?: string }) {
  const { control } = useFormContext<FieldValues>()
  const [open, setOpen] = useState(false)
  const media = useMediaUrl()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const images = (field.value as MediaRef[] | undefined) ?? []
        return (
          <div className="space-y-2">
            <Label>{label}</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img, index) => (
                <div
                  key={`${img.url}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-lg border"
                >
                  <Image
                    src={media(img.url) ?? ''}
                    alt={img.alt}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    className="absolute top-1 right-1 opacity-90"
                    aria-label="Quitar imagen"
                    onClick={() => field.onChange(images.filter((_, i) => i !== index))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-muted-foreground hover:bg-muted/50 flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs"
              >
                <ImagePlus className="size-5" aria-hidden /> Agregar
              </button>
            </div>
            {help && <p className="text-muted-foreground text-xs">{help}</p>}
            <MediaPickerDialog
              open={open}
              onOpenChange={setOpen}
              folder="gallery"
              onSelect={(ref) => field.onChange([...images, ref])}
            />
          </div>
        )
      }}
    />
  )
}
