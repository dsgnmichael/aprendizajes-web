'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Controller, useFormContext, useWatch, type FieldValues } from 'react-hook-form'
import { Eye, EyeOff, Loader2, MapPin, Search, Star } from 'lucide-react'
import type { TestimonialDTO } from '@repo/domain'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import {
  gbpAccountsAction,
  gbpLocationsAction,
  googleReviewsForProfessionalAction,
  placesSearchAction,
  placesTestAction,
  type GoogleReviewsPanel,
} from '@/actions/integrations'
import { handleResult } from '@/components/use-action-toast'
import { NumberField, Section, SelectField, SwitchField, TextField } from './fields'

export interface IntegrationFlags {
  placesConfigured: boolean
  gbpConnected: boolean
}

const SOURCE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'GOOGLE_PLACES', label: 'Google Places' },
  { value: 'GOOGLE_BUSINESS_PROFILE', label: 'Google Business Profile' },
  { value: 'MIXED', label: 'Mixto (manual + Google)' },
]

export function TestimonialsTab({
  professionalId,
  flags,
}: {
  professionalId: string
  flags: IntegrationFlags
}) {
  const { control } = useFormContext<FieldValues>()
  const source = useWatch({ control, name: 'testimonials.source' }) as string
  const usesPlaces = source === 'GOOGLE_PLACES' || source === 'MIXED'
  const usesGbp = source === 'GOOGLE_BUSINESS_PROFILE' || source === 'MIXED'

  return (
    <div className="space-y-4">
      <Section
        title="Fuente y presentación"
        description="Los testimonios manuales se gestionan en la sección Testimonios. Los cambios de esta pestaña se aplican al publicar."
      >
        <SwitchField name="testimonials.enabled" label="Mostrar testimonios" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="testimonials.source" label="Fuente" options={SOURCE_OPTIONS} />
          <SelectField
            name="testimonials.ordering"
            label="Orden"
            options={[
              { value: 'featured', label: 'Destacados primero' },
              { value: 'recent', label: 'Más recientes' },
              { value: 'rating', label: 'Mejor valorados' },
            ]}
          />
          <NumberField name="testimonials.maxReviews" label="Máximo a mostrar" min={1} max={20} />
          <NumberField
            name="testimonials.minimumRating"
            label="Valoración mínima"
            min={1}
            max={5}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchField
            name="testimonials.manualFallback"
            label="Usar manuales si Google no responde"
          />
          <SwitchField
            name="testimonials.showAverageRating"
            label="Mostrar valoración promedio"
            help="Solo con datos reales del proveedor."
          />
          <SwitchField name="testimonials.showTotalReviews" label="Mostrar total de reseñas" />
          <SwitchField name="testimonials.showSourceBadge" label="Mostrar origen de cada reseña" />
        </div>
        <TextField
          name="testimonials.addReviewUrl"
          label="Enlace para dejar reseña"
          placeholder="https://g.page/r/…"
        />
        <p className="text-muted-foreground text-xs">
          <Link href={`/testimonials?professional=${professionalId}`} className="underline">
            Gestionar testimonios manuales de este profesional
          </Link>
        </p>
      </Section>

      {usesPlaces && <PlacesConfig configured={flags.placesConfigured} />}
      {usesGbp && <GbpConfig connected={flags.gbpConnected} />}
      {(usesPlaces || usesGbp) && <GoogleReviewsHidePanel professionalId={professionalId} />}
    </div>
  )
}

function PlacesConfig({ configured }: { configured: boolean }) {
  const { setValue, control } = useFormContext<FieldValues>()
  const placeId = useWatch({ control, name: 'testimonials.googlePlaceId' }) as string
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ placeId: string; name: string; address: string }[]>([])
  const [pending, startTransition] = useTransition()

  if (!configured) {
    return (
      <Section title="Google Places">
        <p className="text-muted-foreground text-sm">
          Falta <code>GOOGLE_MAPS_API_KEY</code> en el servidor. Mientras tanto se mostrarán los
          testimonios manuales.
        </p>
      </Section>
    )
  }

  return (
    <Section
      title="Google Places (API New)"
      description="Places devuelve como máximo 5 reseñas por lugar. El contenido se consulta en vivo y no se almacena; solo se guarda el Place ID."
    >
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () =>
            setResults(handleResult(await placesSearchAction(query)) ?? []),
          )
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar consulta en Google Maps"
          aria-label="Buscar lugar"
        />
        <Button type="submit" variant="outline" disabled={pending || query.trim().length < 2}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />} Buscar
        </Button>
      </form>
      {results.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {results.map((r) => (
            <li key={r.placeId}>
              <button
                type="button"
                className="hover:bg-muted/50 flex w-full items-start gap-2 p-2.5 text-left text-sm"
                onClick={() => {
                  setValue('testimonials.googlePlaceId', r.placeId, { shouldDirty: true })
                  setResults([])
                }}
              >
                <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="block font-medium">{r.name}</span>
                  <span className="text-muted-foreground block text-xs">{r.address}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <TextField name="testimonials.googlePlaceId" label="Place ID" className="flex-1" />
        <Button
          type="button"
          variant="outline"
          disabled={!placeId || pending}
          onClick={() =>
            startTransition(async () => {
              const data = handleResult(await placesTestAction(placeId))
              if (data)
                handleResult(
                  { ok: true, data },
                  `Conexión OK: ${data.name} · ${data.rating ?? '–'}★ (${data.userRatingCount ?? 0} reseñas)`,
                )
            })
          }
        >
          Probar
        </Button>
      </div>
    </Section>
  )
}

function GbpConfig({ connected }: { connected: boolean }) {
  const { control } = useFormContext<FieldValues>()
  const [accounts, setAccounts] = useState<{ name: string; label: string }[] | null>(null)
  const [locations, setLocations] = useState<
    { name: string; title: string; address: string }[] | null
  >(null)
  const [pending, startTransition] = useTransition()

  if (!connected) {
    return (
      <Section title="Google Business Profile">
        <p className="text-muted-foreground text-sm">
          No hay una cuenta conectada.{' '}
          <Link href="/integrations" className="underline">
            Configurar en Integraciones
          </Link>
          . Mientras tanto se usan los testimonios manuales.
        </p>
      </Section>
    )
  }

  return (
    <Section
      title="Google Business Profile"
      description="Ubicación verificada cuyas reseñas se sincronizan para este profesional."
    >
      <Controller
        control={control}
        name="testimonials.gbpLocationName"
        render={({ field }) => (
          <div className="space-y-3">
            <p className="text-sm">
              Ubicación actual: <code className="text-xs">{field.value || 'ninguna'}</code>
            </p>
            {accounts === null ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () =>
                    setAccounts(handleResult(await gbpAccountsAction()) ?? []),
                  )
                }
              >
                {pending && <Loader2 className="animate-spin" />} Elegir ubicación
              </Button>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Select
                  onValueChange={(account) =>
                    startTransition(async () =>
                      setLocations(handleResult(await gbpLocationsAction(account)) ?? []),
                    )
                  }
                >
                  <SelectTrigger aria-label="Cuenta">
                    <SelectValue placeholder="Cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.name} value={a.name}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={!locations}
                >
                  <SelectTrigger aria-label="Ubicación">
                    <SelectValue placeholder="Ubicación">
                      {locations?.find((l) => l.name === field.value)?.title ?? field.value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(locations ?? []).map((l) => (
                      <SelectItem key={l.name} value={l.name}>
                        {l.title}
                        {l.address ? ` · ${l.address}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {field.value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => field.onChange('')}>
                Desvincular ubicación
              </Button>
            )}
          </div>
        )}
      />
    </Section>
  )
}

function GoogleReviewsHidePanel({ professionalId }: { professionalId: string }) {
  const { control } = useFormContext<FieldValues>()
  const [panel, setPanel] = useState<GoogleReviewsPanel | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Section
      title="Reseñas de Google"
      description="Solo lectura: el texto original no se puede editar. Puedes ocultar reseñas concretas (se guarda únicamente su identificador). Usa la configuración guardada: guarda el borrador antes de cargar."
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () =>
              setPanel(handleResult(await googleReviewsForProfessionalAction(professionalId))),
            )
          }
        >
          {pending && <Loader2 className="animate-spin" />} Cargar reseñas
        </Button>
      }
    >
      <Controller
        control={control}
        name="testimonials.hiddenReviewIds"
        render={({ field }) => {
          const hidden = new Set((field.value as string[] | undefined) ?? [])
          const toggle = (id: string) => {
            const next = new Set(hidden)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            field.onChange([...next])
          }
          const items: TestimonialDTO[] = [
            ...(panel?.places?.items ?? []),
            ...(panel?.gbp?.items ?? []),
          ]
          return (
            <div className="space-y-2">
              {hidden.size > 0 && (
                <p className="text-muted-foreground text-xs">{hidden.size} reseña(s) oculta(s).</p>
              )}
              {panel?.places?.error && (
                <p className="text-destructive text-sm">Google Places: {panel.places.error}</p>
              )}
              {panel && items.length === 0 && (
                <p className="text-muted-foreground text-sm">No hay reseñas disponibles.</p>
              )}
              <ul className="space-y-2">
                {items.map((review) => (
                  <li
                    key={review.id}
                    className={`rounded-lg border p-3 text-sm ${hidden.has(review.id) ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {review.authorUrl ? (
                            <a
                              href={review.authorUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {review.authorName}
                            </a>
                          ) : (
                            review.authorName
                          )}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Star className="size-3 fill-current" aria-hidden />{' '}
                          {review.rating ?? '–'} · {review.relativeTime ?? review.date ?? ''}
                          <Badge variant="outline" className="ml-1">
                            {review.origin === 'google_places'
                              ? 'Google Places'
                              : 'Business Profile'}
                          </Badge>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggle(review.id)}
                        aria-pressed={hidden.has(review.id)}
                      >
                        {hidden.has(review.id) ? (
                          <>
                            <Eye /> Mostrar
                          </>
                        ) : (
                          <>
                            <EyeOff /> Ocultar
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-muted-foreground mt-2 line-clamp-4">{review.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        }}
      />
    </Section>
  )
}
