'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, MessageCircle, Phone } from 'lucide-react'
import { APPOINTMENT_STATUSES, whatsappUrl, type AppointmentStatus } from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet'
import { Textarea } from '@repo/ui/components/textarea'
import { updateAppointmentAction } from '@/actions/appointments'
import { handleResult } from '@/components/use-action-toast'
import { APPOINTMENT_STATUS_LABEL } from '@/lib/labels'

export interface AppointmentDetail {
  id: string
  name: string
  email: string
  phone: string
  professionalName: string
  modality: string
  service: string
  preferredDate: string
  preferredTime: string
  message: string
  consentText: string
  entry: string
  status: AppointmentStatus
  notes: string
  createdAtLabel: string
}

export function AppointmentSheet({
  detail,
  canWrite,
}: {
  detail: AppointmentDetail
  canWrite: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [status, setStatus] = useState(detail.status)
  const [notes, setNotes] = useState(detail.notes)
  const [pending, startTransition] = useTransition()

  function close() {
    const sp = new URLSearchParams(params.toString())
    sp.delete('open')
    router.replace(`${pathname}${sp.size ? `?${sp}` : ''}`, { scroll: false })
  }

  const rows: [string, string][] = [
    ['Profesional', detail.professionalName],
    ['Email', detail.email],
    ['Teléfono', detail.phone || '—'],
    ['Modalidad', detail.modality || '—'],
    ['Servicio', detail.service || '—'],
    ['Fecha preferida', detail.preferredDate || '—'],
    ['Hora preferida', detail.preferredTime || '—'],
    [
      'Origen',
      detail.entry === 'qr'
        ? 'Código QR'
        : detail.entry === 'switcher'
          ? 'Selector de profesionales'
          : 'Directo',
    ],
    ['Recibida', detail.createdAtLabel],
  ]

  return (
    <Sheet open onOpenChange={(open) => !open && close()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{detail.name}</SheetTitle>
          <SheetDescription>Solicitud de cita</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-5">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${detail.email}`}>
                <Mail /> Email
              </a>
            </Button>
            {detail.phone && (
              <>
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${detail.phone.replace(/[^\d+]/g, '')}`}>
                    <Phone /> Llamar
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={whatsappUrl(
                      detail.phone,
                      `Hola ${detail.name}, te escribimos por tu solicitud de cita con ${detail.professionalName}.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle /> WhatsApp
                  </a>
                </Button>
              </>
            )}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="break-words">{v}</dd>
              </div>
            ))}
          </dl>
          {detail.message && (
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Mensaje</p>
              <p className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">
                {detail.message}
              </p>
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            Consentimiento aceptado: “{detail.consentText}”
          </p>
          {canWrite && (
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="ap-status">Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                  <SelectTrigger id="ap-status">
                    <SelectValue>{APPOINTMENT_STATUS_LABEL[status]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {APPOINTMENT_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-notes">Notas internas</Label>
                <Textarea
                  id="ap-notes"
                  rows={4}
                  value={notes}
                  maxLength={2000}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        {canWrite && (
          <SheetFooter>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await updateAppointmentAction(detail.id, { status, notes })
                  handleResult(result, 'Solicitud actualizada')
                  if (result.ok) router.refresh()
                })
              }
            >
              {pending && <Loader2 className="animate-spin" />} Guardar cambios
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
