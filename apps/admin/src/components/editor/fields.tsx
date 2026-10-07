'use client'

import { useId } from 'react'
import { Controller, useFormContext, type FieldValues } from 'react-hook-form'
import { cn } from '@repo/ui/lib/utils'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Switch } from '@repo/ui/components/switch'
import { Textarea } from '@repo/ui/components/textarea'

/** Reads a nested error message by dotted path. */
function useFieldError(name: string): string | undefined {
  const { formState } = useFormContext<FieldValues>()
  let node: unknown = formState.errors
  for (const key of name.split('.')) {
    if (node && typeof node === 'object') node = (node as Record<string, unknown>)[key]
    else return undefined
  }
  const message =
    node && typeof node === 'object' ? (node as { message?: unknown }).message : undefined
  return typeof message === 'string' ? message : undefined
}

export function Field({
  label,
  htmlFor,
  help,
  error,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  help?: React.ReactNode
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : help ? (
        <p className="text-muted-foreground text-xs">{help}</p>
      ) : null}
    </div>
  )
}

export function TextField({
  name,
  label,
  help,
  placeholder,
  type = 'text',
  maxLength,
  className,
}: {
  name: string
  label: string
  help?: React.ReactNode
  placeholder?: string
  type?: string
  maxLength?: number
  className?: string
}) {
  const id = useId()
  const { register } = useFormContext<FieldValues>()
  const error = useFieldError(name)
  return (
    <Field label={label} htmlFor={id} help={help} error={error} className={className}>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={!!error}
        {...register(name)}
      />
    </Field>
  )
}

export function TextareaField({
  name,
  label,
  help,
  rows = 3,
  placeholder,
  maxLength,
  className,
}: {
  name: string
  label: string
  help?: React.ReactNode
  rows?: number
  placeholder?: string
  maxLength?: number
  className?: string
}) {
  const id = useId()
  const { register, watch } = useFormContext<FieldValues>()
  const error = useFieldError(name)
  const value = watch(name)
  return (
    <Field
      label={label}
      htmlFor={id}
      error={error}
      className={className}
      help={
        <span className="flex justify-between gap-2">
          <span>{help}</span>
          {maxLength ? (
            <span className="tabular-nums">
              {typeof value === 'string' ? value.length : 0}/{maxLength}
            </span>
          ) : null}
        </span>
      }
    >
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={!!error}
        {...register(name)}
      />
    </Field>
  )
}

export function RichTextField({
  name,
  label,
  help,
}: {
  name: string
  label: string
  help?: string
}) {
  return (
    <TextareaField
      name={name}
      label={label}
      rows={6}
      help={
        <>
          {help ? `${help} · ` : ''}Formato seguro: <code>**negrita**</code>, <code>*cursiva*</code>
          , <code>- lista</code>, <code>## subtítulo</code>, <code>[enlace](https://…)</code>
        </>
      }
    />
  )
}

export function NumberField({
  name,
  label,
  min,
  max,
  help,
  nullable = false,
}: {
  name: string
  label: string
  min?: number
  max?: number
  help?: string
  nullable?: boolean
}) {
  const id = useId()
  const { control } = useFormContext<FieldValues>()
  const error = useFieldError(name)
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field label={label} htmlFor={id} help={help} error={error}>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={field.value ?? ''}
            onBlur={field.onBlur}
            aria-invalid={!!error}
            onChange={(e) => {
              const raw = e.target.value
              field.onChange(raw === '' ? (nullable ? null : 0) : Number(raw))
            }}
          />
        </Field>
      )}
    />
  )
}

export function SwitchField({ name, label, help }: { name: string; label: string; help?: string }) {
  const id = useId()
  const { control } = useFormContext<FieldValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="bg-card flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5">
          <div>
            <Label htmlFor={id} className="font-normal">
              {label}
            </Label>
            {help && <p className="text-muted-foreground mt-1 text-xs">{help}</p>}
          </div>
          <Switch id={id} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  )
}

const INHERIT = '__inherit'

export function SelectField({
  name,
  label,
  options,
  help,
  inheritLabel,
}: {
  name: string
  label: string
  options: readonly { value: string; label: string }[]
  help?: string
  /** When set, adds an "inherit" option that stores `undefined`. */
  inheritLabel?: string
}) {
  const id = useId()
  const { control } = useFormContext<FieldValues>()
  const error = useFieldError(name)
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value =
          field.value === undefined || field.value === null
            ? inheritLabel
              ? INHERIT
              : ''
            : String(field.value)
        const current =
          value === INHERIT ? inheritLabel : options.find((o) => o.value === value)?.label
        return (
          <Field label={label} htmlFor={id} help={help} error={error}>
            <Select
              value={value}
              onValueChange={(v) => field.onChange(v === INHERIT ? undefined : v)}
            >
              <SelectTrigger id={id} aria-invalid={!!error}>
                {/* Explicit text: Radix only knows item labels once the content has mounted. */}
                <SelectValue placeholder="Selecciona…">{current}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {inheritLabel && <SelectItem value={INHERIT}>{inheritLabel}</SelectItem>}
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )
      }}
    />
  )
}

export function Section({
  title,
  description,
  children,
  actions,
}: {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <section className="bg-card rounded-xl border p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
