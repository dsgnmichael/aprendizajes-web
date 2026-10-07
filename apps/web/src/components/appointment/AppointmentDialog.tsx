'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentRequestInputSchema, type AppointmentRequestInput } from '@repo/domain'
import { CircleCheck, LoaderCircle, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useId, useState, useTransition, type ReactNode } from 'react'
import { useForm, type FieldErrors, type UseFormRegisterReturn } from 'react-hook-form'
import type { z } from 'zod'
import { submitAppointment } from '@/app/_actions/appointment'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import type { AppointmentFormConfig } from './types'

type FormInput = z.input<typeof appointmentRequestInputSchema>

function entrySource(): AppointmentRequestInput['entry'] {
  if (typeof window === 'undefined') return 'direct'
  let src = new URLSearchParams(window.location.search).get('src')
  try {
    src ??= sessionStorage.getItem('entry')
  } catch {
    /* storage may be unavailable */
  }
  return src === 'qr' ? 'qr' : src === 'switcher' ? 'switcher' : 'direct'
}

/**
 * Appointment request form. Mobile: bottom sheet with safe-area padding.
 * Desktop: centered dialog. Radix handles focus trap, Esc and aria wiring.
 */
export default function AppointmentDialog({
  config,
  open,
  onOpenChange,
}: {
  config: AppointmentFormConfig
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const form = useForm<FormInput, unknown, AppointmentRequestInput>({
    resolver: zodResolver(appointmentRequestInputSchema),
    defaultValues: {
      professionalSlug: config.professionalSlug,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      modality: '',
      service: '',
      preferredDate: '',
      preferredTime: '',
      message: '',
      website: '',
      entry: 'direct',
    },
  })
  const { register, handleSubmit, formState, setError } = form
  const errors = formState.errors as FieldErrors<FormInput>
  const f = config.fields
  const today = new Date().toISOString().slice(0, 10)

  const onSubmit = handleSubmit((values) => {
    setResult(null)
    startTransition(async () => {
      const response = await submitAppointment({ ...values, entry: entrySource() })
      if (response.status === 'success') {
        track('appointment_submit', { slug: config.professionalSlug })
        setResult({ ok: true, message: response.message })
        form.reset()
      } else {
        for (const [key, message] of Object.entries(response.fieldErrors ?? {})) {
          setError(key as keyof FormInput, { message })
        }
        setResult({ ok: false, message: response.message })
      }
    })
  })

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-brand-deep/45 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_240ms_ease-out]" />
        <Dialog.Content
          className={cn(
            'fixed z-[71] flex max-h-[92svh] w-full flex-col overflow-hidden bg-surface text-ink shadow-lifted outline-none',
            // Mobile: bottom sheet.
            'inset-x-0 bottom-0 rounded-t-[28px] pb-[var(--safe-bottom)] data-[state=open]:animate-[sheet-up_420ms_cubic-bezier(0.16,1,0.3,1)]',
            // Desktop: centered dialog.
            'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[88svh] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:pb-0 sm:data-[state=open]:animate-[pop-in_320ms_cubic-bezier(0.16,1,0.3,1)]',
          )}
        >
          <div aria-hidden="true" className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-line sm:hidden" />
          <header className="flex items-start justify-between gap-4 px-6 pt-4 pb-2 sm:px-8 sm:pt-7">
            <div>
              <p className="script text-3xl text-brand">{config.professionalName}</p>
              <Dialog.Title className="mt-1 text-2xl leading-tight font-black tracking-tight">{config.title}</Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm text-ink-muted">{config.intro}</Dialog.Description>
            </div>
            <Dialog.Close
              className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-brand-mist hover:text-ink"
              aria-label="Cerrar"
            >
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </header>

          {result?.ok ? (
            <div className="flex flex-col items-center gap-4 px-8 pt-6 pb-10 text-center" role="status">
              <CircleCheck size={56} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
              <p className="max-w-sm text-lg font-bold">{result.message}</p>
              <Dialog.Close className="mt-2 min-h-12 rounded-button bg-brand px-6 font-black tracking-wide text-on-brand uppercase">
                Listo
              </Dialog.Close>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto overscroll-contain px-6 py-4 sm:grid-cols-2 sm:px-8">
                <input type="hidden" {...register('professionalSlug')} />
                {/* Honeypot: invisible to people, tempting for bots. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    No completar
                    <input tabIndex={-1} autoComplete="off" {...register('website')} />
                  </label>
                </div>
                <Field label="Nombre" error={errors.firstName?.message} required>
                  {(p) => <input {...p} {...register('firstName')} autoComplete="given-name" />}
                </Field>
                {f.lastName ? (
                  <Field label="Apellido" error={errors.lastName?.message}>
                    {(p) => <input {...p} {...register('lastName')} autoComplete="family-name" />}
                  </Field>
                ) : null}
                <Field label="Email" error={errors.email?.message} required className={f.phone ? '' : 'sm:col-span-2'}>
                  {(p) => <input {...p} {...register('email')} type="email" inputMode="email" autoComplete="email" />}
                </Field>
                {f.phone ? (
                  <Field label="Teléfono" error={errors.phone?.message}>
                    {(p) => <input {...p} {...register('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="+56 9…" />}
                  </Field>
                ) : null}
                {f.modality && config.modalities.length > 0 ? (
                  <Field label="Modalidad" error={errors.modality?.message}>
                    {(p) => (
                      <select {...p} {...register('modality')}>
                        <option value="">Sin preferencia</option>
                        {config.modalities.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    )}
                  </Field>
                ) : null}
                {f.service && config.services.length > 0 ? (
                  <Field label="Servicio" error={errors.service?.message}>
                    {(p) => (
                      <select {...p} {...register('service')}>
                        <option value="">Aún no lo sé</option>
                        {config.services.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </Field>
                ) : null}
                {f.preferredDate ? (
                  <Field label="Fecha preferida" error={errors.preferredDate?.message}>
                    {(p) => <input {...p} {...register('preferredDate')} type="date" min={today} />}
                  </Field>
                ) : null}
                {f.preferredTime ? (
                  <Field label="Hora preferida" error={errors.preferredTime?.message}>
                    {(p) => <input {...p} {...register('preferredTime')} type="time" step={900} />}
                  </Field>
                ) : null}
                {f.message ? (
                  <Field label="Mensaje" error={errors.message?.message} className="sm:col-span-2">
                    {(p) => <textarea {...p} {...register('message')} rows={3} placeholder="Cuéntanos brevemente el motivo de consulta" />}
                  </Field>
                ) : null}
                <ConsentField
                  text={config.consentText}
                  privacyUrl={config.privacyUrl}
                  registration={register('consent')}
                  error={errors.consent?.message}
                />
              </div>
              <footer className="flex flex-col gap-3 border-t border-line bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <p role={result && !result.ok ? 'alert' : undefined} className="text-sm text-accent">
                  {result && !result.ok ? result.message : ''}
                </p>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button bg-brand px-7 font-black tracking-wide text-on-brand uppercase transition-colors hover:bg-brand-deep disabled:opacity-70"
                >
                  {pending ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" /> : null}
                  {pending ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </footer>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const inputClass =
  'min-h-12 w-full rounded-control border border-line bg-canvas/60 px-4 py-3 text-base text-ink transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/15 focus:outline-none aria-[invalid=true]:border-accent'

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  className?: string
  children: (props: { id: string; className: string; 'aria-invalid': boolean; 'aria-describedby'?: string; required?: boolean }) => ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      {children({ id, className: inputClass, 'aria-invalid': Boolean(error), 'aria-describedby': error ? errorId : undefined, required })}
      {error ? (
        <p id={errorId} className="text-sm text-accent">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function ConsentField({
  text,
  privacyUrl,
  registration,
  error,
}: {
  text: string
  privacyUrl: string
  registration: UseFormRegisterReturn
  error?: string
}) {
  const id = useId()
  return (
    <div className="sm:col-span-2">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-control bg-brand-mist/60 p-4 text-sm leading-relaxed">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-[var(--t-brand)]"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...registration}
        />
        <span>
          {text}{' '}
          {privacyUrl ? (
            <a href={privacyUrl} className="font-bold text-brand underline underline-offset-2" target="_blank" rel="noopener noreferrer">
              Política de privacidad
            </a>
          ) : null}
        </span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-accent">
          {error}
        </p>
      ) : null}
    </div>
  )
}
