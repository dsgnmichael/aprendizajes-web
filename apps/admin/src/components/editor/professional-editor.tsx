'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Rocket,
  Save,
} from 'lucide-react'
import {
  APPOINTMENT_MODES,
  createSection,
  FONT_CHOICES,
  MOTION_INTENSITIES,
  professionalInputSchema,
  SECTION_TYPES,
  sectionRegistry,
  type ColorToken,
  type ProfessionalInput,
  type ProfessionalStatus,
} from '@repo/domain'
import { cn } from '@repo/ui/lib/utils'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { publishAction, restoreRevisionAction, saveDraftAction } from '@/actions/professionals'
import { handleResult } from '@/components/use-action-toast'
import { PROFESSIONAL_STATUS_LABEL } from '@/lib/labels'
import { ColorTokensEditor } from './color-overrides'
import {
  NumberField,
  RichTextField,
  Section,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from './fields'
import { ImageField } from './image-field'
import { LabeledIconList, ServicesList, StringList } from './list-editors'
import { PageBuilder } from './page-builder'
import { PreviewPanel } from './preview-panel'
import { TestimonialsTab, type IntegrationFlags } from './testimonials-tab'

type FormInput = z.input<typeof professionalInputSchema>

export interface EditorMeta {
  id: string
  status: ProfessionalStatus
  revision: number
  publishedRevision: number | null
  publicUrl: string
  isDemo: boolean
  revisions: { revision: number; publishedAt: string; publishedBy: string }[]
  siteColors: Record<ColorToken, string>
  canPublish: boolean
  canWrite: boolean
}

const TABS = [
  ['identity', 'Identidad'],
  ['content', 'Contenido'],
  ['images', 'Hero e imágenes'],
  ['services', 'Servicios'],
  ['specialties', 'Especialidades'],
  ['contact', 'Contacto y redes'],
  ['appointment', 'Agendamiento'],
  ['testimonials', 'Testimonios'],
  ['builder', 'Page builder'],
  ['theme', 'Tema'],
  ['seo', 'SEO'],
  ['revisions', 'Revisiones'],
] as const

const MODE_LABELS: Record<(typeof APPOINTMENT_MODES)[number], string> = {
  INTERNAL_FORM: 'Formulario interno (solicitudes al backoffice)',
  EXTERNAL_URL: 'Enlace externo (Calendly u otro)',
  WHATSAPP: 'WhatsApp con mensaje prellenado',
}

/** Re-number section order from the array position (what the builder shows). */
function normalize(values: ProfessionalInput): ProfessionalInput {
  return { ...values, sections: values.sections.map((s, i) => ({ ...s, order: i })) }
}

export function ProfessionalEditor({
  initial,
  meta,
  flags,
}: {
  initial: ProfessionalInput
  meta: EditorMeta
  flags: IntegrationFlags
}) {
  const router = useRouter()
  const form = useForm<FormInput, unknown, ProfessionalInput>({
    resolver: zodResolver(professionalInputSchema),
    defaultValues: initial,
    mode: 'onBlur',
  })
  const [revision, setRevision] = useState(meta.revision)
  const [status, setStatus] = useState(meta.status)
  const [publishedRevision, setPublishedRevision] = useState(meta.publishedRevision)
  const [previewKey, setPreviewKey] = useState(0)
  const [showPreview, setShowPreview] = useState(true)
  const [pending, startTransition] = useTransition()
  const { isDirty, errors } = form.formState
  const name = useWatch({ control: form.control, name: 'name' })
  const appointmentMode = useWatch({ control: form.control, name: 'appointment.mode' })

  useEffect(() => {
    if (!isDirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const save = form.handleSubmit(
    (values) =>
      startTransition(async () => {
        const data = handleResult(
          await saveDraftAction(meta.id, normalize(values), revision),
          'Borrador guardado',
        )
        if (!data) return
        setRevision(data.revision)
        form.reset(values)
        setPreviewKey((k) => k + 1)
        router.refresh()
      }),
    () => handleResult({ ok: false, error: 'Revisa los campos marcados antes de guardar.' }),
  )

  const publish = form.handleSubmit(
    (values) =>
      startTransition(async () => {
        const data = handleResult(
          await publishAction(meta.id, normalize(values), revision),
          'Publicado en el sitio',
        )
        if (!data) return
        setRevision(data.revision)
        setPublishedRevision(data.revision)
        setStatus('published')
        form.reset(values)
        setPreviewKey((k) => k + 1)
        router.refresh()
      }),
    () => handleResult({ ok: false, error: 'Revisa los campos marcados antes de publicar.' }),
  )

  const unpublished =
    status === 'published' && publishedRevision !== null && revision > publishedRevision
  const errorCount = Object.keys(errors).length

  return (
    <FormProvider {...form}>
      <form onSubmit={save} noValidate>
        <div className="bg-background/95 sticky top-14 z-20 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">{name || 'Sin nombre'}</h1>
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
              <Badge variant={status === 'published' ? 'success' : 'secondary'}>
                {PROFESSIONAL_STATUS_LABEL[status]}
              </Badge>
              {unpublished && <Badge variant="warning">Cambios sin publicar</Badge>}
              {isDirty && <Badge variant="outline">Sin guardar</Badge>}
              {meta.isDemo && <Badge variant="accent">DEMO</Badge>}
              <span className="tabular-nums">rev. {revision}</span>
            </div>
          </div>
          {errorCount > 0 && (
            <span className="text-destructive flex items-center gap-1 text-xs" role="status">
              <AlertCircle className="size-4" /> {errorCount} sección(es) con errores
            </span>
          )}
          {status === 'published' && (
            <Button asChild variant="ghost" size="sm">
              <a href={meta.publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink /> Ver publicada
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hidden lg:inline-flex"
            onClick={() => setShowPreview((v) => !v)}
            aria-label={showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
          >
            {showPreview ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
          {meta.canWrite && (
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />} Guardar borrador
            </Button>
          )}
          {meta.canPublish && status !== 'archived' && (
            <Button type="button" onClick={publish} disabled={pending}>
              <Rocket /> Publicar
            </Button>
          )}
        </div>

        <div
          className={cn(
            'grid gap-6',
            showPreview && 'lg:grid-cols-[minmax(0,1fr)_minmax(340px,42%)]',
          )}
        >
          <Tabs defaultValue="identity" className="min-w-0">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <TabsList className="w-max">
                {TABS.map(([value, label]) => (
                  <TabsTrigger key={value} value={value}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="identity" className="space-y-4">
              <Section title="Identidad">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField name="name" label="Nombre completo" />
                  <TextField
                    name="slug"
                    label="Slug (URL pública)"
                    help="Cambiarlo rompe los QR ya impresos."
                  />
                  <TextField name="professionalTitle" label="Profesión / especialidad" />
                  <TextField
                    name="scriptTitle"
                    label="Título manuscrito"
                    placeholder="psicopedagoga"
                    help="Se muestra con la tipografía script."
                  />
                  <NumberField
                    name="yearsOfExperience"
                    label="Años de experiencia"
                    min={0}
                    max={80}
                    nullable
                  />
                  <NumberField
                    name="displayOrder"
                    label="Orden en el selector"
                    min={0}
                    max={10000}
                  />
                </div>
              </Section>
              <Section title="Credenciales" description="Títulos, colegiaturas, certificaciones.">
                <StringList name="credentials" itemLabel="Credencial" max={10} />
              </Section>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Section title="Contenido">
                <TextareaField
                  name="shortDescription"
                  label="Descripción breve"
                  rows={2}
                  maxLength={300}
                  help="Aparece en el directorio y en SEO si no hay descripción específica."
                />
                <RichTextField name="biography" label="Biografía" />
              </Section>
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <Section
                title="Hero"
                description="Ideal: PNG/WebP recortado con transparencia (alto ≥ 1000px). También funciona una foto rectangular."
              >
                <ImageField name="images.hero" label="Foto hero (escritorio)" />
                <ImageField
                  name="images.heroMobile"
                  label="Foto hero móvil (opcional)"
                  help="Si no se define se usa la de escritorio."
                />
              </Section>
              <Section title="Avatar y perfil">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageField
                    name="images.avatar"
                    label="Avatar (selector de profesionales)"
                    aspect="aspect-square"
                  />
                  <ImageField name="images.profile" label="Foto de perfil (secciones)" />
                </div>
              </Section>
              <p className="text-muted-foreground text-xs">
                Los textos del hero (claim, experiencia, CTA) se editan en Page builder → Hero.
              </p>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <Section title="Servicios">
                <ServicesList />
              </Section>
            </TabsContent>

            <TabsContent value="specialties" className="space-y-4">
              <Section title="Especialidades">
                <LabeledIconList name="specialties" itemLabel="Especialidad" max={12} />
              </Section>
              <Section
                title="Modalidades"
                description="Se muestran con iconos en el hero (presencial, online…)."
              >
                <LabeledIconList name="modalities" itemLabel="Modalidad" max={8} />
              </Section>
              <Section title="Público objetivo">
                <LabeledIconList name="targetAudience" itemLabel="Público" max={8} />
              </Section>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Section title="Contacto">
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField name="contact.email" label="Email" type="email" />
                  <TextField name="contact.phone" label="Teléfono" type="tel" />
                  <TextField
                    name="contact.whatsapp"
                    label="WhatsApp"
                    type="tel"
                    placeholder="+56 9 …"
                  />
                </div>
              </Section>
              <Section title="Redes sociales" description="URLs completas (https://…).">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField name="social.instagram" label="Instagram" />
                  <TextField name="social.tiktok" label="TikTok" />
                  <TextField name="social.facebook" label="Facebook" />
                  <TextField name="social.linkedin" label="LinkedIn" />
                  <TextField name="social.youtube" label="YouTube" />
                  <TextField name="social.website" label="Sitio web" />
                </div>
              </Section>
              <Section title="Ubicación">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField name="location.label" label="Nombre del lugar" />
                  <TextField name="location.address" label="Dirección" />
                  <TextField name="location.city" label="Ciudad" />
                  <TextField name="location.region" label="Región" />
                  <TextField name="location.country" label="País (ISO, ej. CL)" maxLength={2} />
                  <TextField name="location.mapsUrl" label="Enlace a Google Maps" />
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="appointment" className="space-y-4">
              <Section title='CTA "Agendar cita"'>
                <SelectField
                  name="appointment.mode"
                  label="Modo"
                  options={APPOINTMENT_MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
                />
                <TextField
                  name="appointment.buttonLabel"
                  label="Texto del botón"
                  help="Vacío = texto predeterminado del sitio."
                />
                {appointmentMode === 'EXTERNAL_URL' && (
                  <TextField
                    name="appointment.externalUrl"
                    label="URL externa (https)"
                    placeholder="https://calendly.com/…"
                  />
                )}
                {appointmentMode === 'WHATSAPP' && (
                  <>
                    <TextField
                      name="appointment.whatsappNumber"
                      label="Número de WhatsApp"
                      placeholder="+56 9 1234 5678"
                    />
                    <TextareaField
                      name="appointment.whatsappMessage"
                      label="Mensaje prellenado"
                      rows={2}
                      maxLength={400}
                      help="Usa {name} para el nombre del profesional."
                    />
                  </>
                )}
                {appointmentMode === 'INTERNAL_FORM' && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField name="appointment.formTitle" label="Título del formulario" />
                      <TextField name="appointment.successMessage" label="Mensaje de éxito" />
                    </div>
                    <TextareaField name="appointment.formIntro" label="Introducción" rows={2} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <SwitchField name="appointment.fields.lastName" label="Apellido" />
                      <SwitchField name="appointment.fields.phone" label="Teléfono" />
                      <SwitchField name="appointment.fields.modality" label="Modalidad" />
                      <SwitchField name="appointment.fields.service" label="Servicio" />
                      <SwitchField
                        name="appointment.fields.preferredDate"
                        label="Fecha preferida"
                      />
                      <SwitchField name="appointment.fields.preferredTime" label="Hora preferida" />
                      <SwitchField name="appointment.fields.message" label="Mensaje" />
                    </div>
                    <TextareaField
                      name="appointment.consentText"
                      label="Texto de consentimiento"
                      rows={2}
                      help="Vacío = texto predeterminado del sitio. Nombre, email y consentimiento siempre son obligatorios."
                    />
                  </>
                )}
              </Section>
            </TabsContent>

            <TabsContent value="testimonials">
              <TestimonialsTab professionalId={meta.id} flags={flags} />
            </TabsContent>

            <TabsContent value="builder">
              <PageBuilder
                registry={sectionRegistry}
                types={SECTION_TYPES}
                create={createSection}
                dndId="profile-sections-dnd"
              />
            </TabsContent>

            <TabsContent value="theme" className="space-y-4">
              <Section title="Colores" description="Vacío = hereda el tema global del sitio.">
                <ColorTokensEditor name="theme.colors" inherit={meta.siteColors} />
              </Section>
              <Section title="Forma y movimiento">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    name="theme.radius"
                    label="Redondeo"
                    inheritLabel="Heredar"
                    options={['sm', 'md', 'lg', 'xl'].map((v) => ({
                      value: v,
                      label: v.toUpperCase(),
                    }))}
                  />
                  <SelectField
                    name="theme.buttonShape"
                    label="Botones"
                    inheritLabel="Heredar"
                    options={[
                      { value: 'pill', label: 'Píldora' },
                      { value: 'rounded', label: 'Redondeado' },
                      { value: 'square', label: 'Recto' },
                    ]}
                  />
                  <SelectField
                    name="theme.motion"
                    label="Animaciones"
                    inheritLabel="Heredar"
                    options={MOTION_INTENSITIES.map((v) => ({ value: v, label: v }))}
                  />
                  <SelectField
                    name="theme.visualIntensity"
                    label="Intensidad visual"
                    inheritLabel="Heredar"
                    options={[
                      { value: 'low', label: 'Baja' },
                      { value: 'medium', label: 'Media' },
                      { value: 'high', label: 'Alta' },
                    ]}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Tipografías disponibles: {FONT_CHOICES.sans.join(', ')} /{' '}
                  {FONT_CHOICES.display.join(', ')} (se configuran en el tema global).
                </p>
              </Section>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <Section
                title="Buscadores"
                description="Vacío = se generan a partir del nombre, profesión y descripción."
              >
                <TextField name="seo.title" label="Título SEO" maxLength={70} />
                <TextareaField
                  name="seo.description"
                  label="Descripción SEO"
                  rows={2}
                  maxLength={170}
                />
                <TextField
                  name="seo.canonical"
                  label="URL canónica (opcional)"
                  help="Solo si esta página se publica también en otro dominio."
                />
                <SwitchField name="seo.noIndex" label="No indexar (noindex)" />
              </Section>
              <Section title="Redes sociales (Open Graph / Twitter)">
                <TextField name="seo.ogTitle" label="Título para compartir" maxLength={90} />
                <TextareaField
                  name="seo.ogDescription"
                  label="Descripción para compartir"
                  rows={2}
                  maxLength={200}
                />
                <ImageField
                  name="seo.ogImage"
                  label="Imagen para compartir (1200×630 recomendado)"
                  aspect="aspect-[1200/630]"
                />
              </Section>
            </TabsContent>

            <TabsContent value="revisions" className="space-y-4">
              <Section
                title="Publicaciones"
                description="Cada publicación genera un snapshot inmutable. El sitio público solo lee la versión publicada."
              >
                {meta.revisions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aún no se ha publicado.</p>
                ) : (
                  <ol className="divide-y">
                    {meta.revisions.map((r) => (
                      <li
                        key={r.revision}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span>
                          Revisión <span className="font-medium tabular-nums">{r.revision}</span>
                          {r.revision === publishedRevision && (
                            <Badge variant="success" className="ml-2">
                              En línea
                            </Badge>
                          )}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-muted-foreground text-xs">
                            {r.publishedAt} · {r.publishedBy}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending || isDirty}
                            title={isDirty ? 'Guarda o descarta los cambios antes de restaurar' : undefined}
                            onClick={() =>
                              startTransition(async () => {
                                const data = handleResult(
                                  await restoreRevisionAction(meta.id, r.revision, revision),
                                  `Revisión ${r.revision} restaurada al borrador`,
                                )
                                if (!data) return
                                // Reload so the form shows the restored draft.
                                window.location.reload()
                              })
                            }
                          >
                            Restaurar al borrador
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Section>
            </TabsContent>
          </Tabs>

          {showPreview && (
            <aside
              className="hidden h-[calc(100dvh-9rem)] lg:sticky lg:top-24 lg:block"
              aria-label="Vista previa"
            >
              <PreviewPanel target={{ kind: 'professional', id: meta.id }} reloadKey={previewKey} />
            </aside>
          )}
        </div>
      </form>
    </FormProvider>
  )
}
