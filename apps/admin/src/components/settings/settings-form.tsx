'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
  type FieldValues,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import {
  FONT_CHOICES,
  MOTION_INTENSITIES,
  shortId,
  siteSettingsSchema,
  type SiteSettings,
} from '@repo/domain'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Switch } from '@repo/ui/components/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { saveSettingsAction } from '@/actions/settings'
import { ColorTokensEditor } from '@/components/editor/color-overrides'
import {
  Section,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from '@/components/editor/fields'
import { ImageField } from '@/components/editor/image-field'
import { handleResult } from '@/components/use-action-toast'

const TABS = [
  ['identity', 'Identidad'],
  ['theme', 'Tema'],
  ['navigation', 'Navegación'],
  ['copy', 'Textos'],
  ['footer', 'Footer y redes'],
  ['seo', 'SEO'],
  ['root', 'Raíz y selector'],
  ['other', 'Políticas y analytics'],
] as const

function LinkList({ name, max }: { name: 'navigation.items' | 'footer.links'; max: number }) {
  const { control, register } = useFormContext<FieldValues>()
  const { fields, append, remove, move, update } = useFieldArray({ control, name })
  const values =
    (useWatch({ control, name }) as SiteSettings['navigation']['items'] | undefined) ?? []
  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-wrap items-center gap-2 rounded-lg border p-2 sm:flex-nowrap"
        >
          <Input
            className="sm:w-40"
            aria-label={`Texto ${index + 1}`}
            placeholder="Texto"
            {...register(`${name}.${index}.label`)}
          />
          <Input
            aria-label={`Enlace ${index + 1}`}
            placeholder="/ · #servicios · https://…"
            {...register(`${name}.${index}.href`)}
          />
          <Switch
            checked={values[index]?.enabled ?? true}
            onCheckedChange={(enabled) => {
              const current = values[index]
              if (current) update(index, { ...current, enabled })
            }}
            aria-label={`Mostrar enlace ${index + 1}`}
          />
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
            aria-label="Eliminar enlace"
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={fields.length >= max}
        onClick={() => append({ id: shortId('n'), label: '', href: '#', enabled: true })}
      >
        <Plus /> Agregar enlace
      </Button>
    </div>
  )
}

export function SettingsForm({
  initial,
  professionals,
}: {
  initial: SiteSettings
  professionals: { slug: string; name: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useForm<z.input<typeof siteSettingsSchema>, unknown, SiteSettings>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: initial,
    mode: 'onBlur',
  })
  const rootMode = useWatch({ control: form.control, name: 'root.mode' })

  const submit = form.handleSubmit(
    (values) =>
      startTransition(async () => {
        const result = await saveSettingsAction(values)
        handleResult(result, 'Configuración guardada y publicada')
        if (result.ok) {
          form.reset(values)
          router.refresh()
        }
      }),
    () => handleResult({ ok: false, error: 'Revisa los campos marcados.' }),
  )

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate>
        <div className="bg-background/95 sticky top-14 z-20 -mx-4 mb-4 flex items-center justify-end gap-2 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
          <p className="text-muted-foreground mr-auto text-xs">
            Los cambios se aplican al sitio público al guardar.
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />} Guardar
          </Button>
        </div>
        <Tabs defaultValue="identity">
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
            <Section title="Organización">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="organizationName" label="Nombre" />
                <TextField name="tagline" label="Bajada" />
                <TextField name="organization.legalName" label="Razón social" />
                <TextField name="organization.url" label="Sitio institucional" />
                <TextField name="organization.email" label="Email" />
                <TextField name="organization.phone" label="Teléfono" />
              </div>
            </Section>
            <Section
              title="Contacto público"
              description="Se muestra en la sección Contacto de la página de inicio."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  name="organization.whatsapp"
                  label="WhatsApp"
                  placeholder="+56 9 1234 5678"
                />
                <TextField name="organization.address" label="Dirección" />
                <TextField name="organization.city" label="Ciudad" />
                <TextField
                  name="organization.mapsUrl"
                  label="Enlace a Google Maps"
                  placeholder="https://maps.app.goo.gl/…"
                />
                <TextField
                  name="organization.hours"
                  label="Horario de atención"
                  className="sm:col-span-2"
                />
              </div>
            </Section>
            <Section title="Logo y favicon">
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageField name="logo" label="Logo" folder="site" aspect="aspect-[16/9]" />
                <ImageField
                  name="favicon"
                  label="Favicon (cuadrado, PNG)"
                  folder="site"
                  aspect="aspect-square"
                />
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4">
            <Section
              title="Colores"
              description="Tema global. Cada profesional puede sobrescribirlo."
            >
              <ColorTokensEditor name="theme.colors" />
            </Section>
            <Section title="Tipografía, forma y movimiento">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  name="theme.fontSans"
                  label="Tipografía principal"
                  options={FONT_CHOICES.sans.map((v) => ({
                    value: v,
                    label: v === 'lato' ? 'Lato (marca)' : 'Sistema',
                  }))}
                />
                <SelectField
                  name="theme.fontDisplay"
                  label="Tipografía manuscrita"
                  options={FONT_CHOICES.display.map((v) => ({
                    value: v,
                    label: v === 'loverine' ? 'Loverine (marca)' : 'Ninguna',
                  }))}
                />
                <SelectField
                  name="theme.radius"
                  label="Redondeo"
                  options={['sm', 'md', 'lg', 'xl'].map((v) => ({
                    value: v,
                    label: v.toUpperCase(),
                  }))}
                />
                <SelectField
                  name="theme.buttonShape"
                  label="Estilo de botones"
                  options={[
                    { value: 'pill', label: 'Píldora' },
                    { value: 'rounded', label: 'Redondeado' },
                    { value: 'square', label: 'Recto' },
                  ]}
                />
                <SelectField
                  name="theme.motion"
                  label="Animaciones"
                  options={MOTION_INTENSITIES.map((v) => ({
                    value: v,
                    label: {
                      off: 'Desactivadas',
                      subtle: 'Sutiles',
                      normal: 'Normales',
                      expressive: 'Expresivas',
                    }[v],
                  }))}
                />
                <SelectField
                  name="theme.visualIntensity"
                  label="Intensidad visual"
                  options={[
                    { value: 'low', label: 'Baja' },
                    { value: 'medium', label: 'Media' },
                    { value: 'high', label: 'Alta' },
                  ]}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Las animaciones siempre respetan “reducir movimiento” del sistema operativo.
              </p>
            </Section>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-4">
            <Section
              title="Menú principal"
              description="Si se desactiva o queda vacío, el header muestra solo el logo. El sitio público nunca muestra un acceso de login."
            >
              <SwitchField name="navigation.enabled" label="Mostrar navegación" />
              <LinkList name="navigation.items" max={8} />
            </Section>
          </TabsContent>

          <TabsContent value="copy" className="space-y-4">
            <Section
              title="Textos comunes"
              description="Se usan cuando un perfil o sección deja el texto vacío."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="copy.appointmentCta" label='CTA "Agendar cita"' />
                <TextField name="copy.testimonialsTitle" label="Título testimonios" />
                <TextField name="copy.switcherTitle" label="Título selector" />
                <TextField name="copy.directoryTitle" label="Título directorio" />
                <TextField name="copy.servicesTitle" label="Título servicios" />
                <TextField name="copy.specialtiesTitle" label="Título especialidades" />
                <TextField name="copy.aboutTitle" label="Título sobre mí" />
                <TextField name="copy.contactTitle" label="Título contacto" />
                <TextField name="copy.addReviewLabel" label="Texto “dejar reseña”" />
              </div>
              <TextareaField
                name="copy.directoryIntro"
                label="Introducción del directorio"
                rows={2}
              />
              <TextareaField
                name="copy.appointmentSuccess"
                label="Mensaje tras solicitar cita"
                rows={2}
              />
              <TextareaField
                name="copy.consentText"
                label="Consentimiento del formulario"
                rows={2}
              />
            </Section>
          </TabsContent>

          <TabsContent value="footer" className="space-y-4">
            <Section title="Footer">
              <TextareaField name="footer.text" label="Texto" rows={2} />
              <SwitchField name="footer.showSocial" label="Mostrar redes sociales" />
              <LinkList name="footer.links" max={8} />
            </Section>
            <Section title="Redes globales">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="social.instagram" label="Instagram" />
                <TextField name="social.tiktok" label="TikTok" />
                <TextField name="social.facebook" label="Facebook" />
                <TextField name="social.linkedin" label="LinkedIn" />
                <TextField name="social.youtube" label="YouTube" />
                <TextField name="social.website" label="Sitio web" />
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <Section title="SEO global">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="seo.defaultTitle" label="Título por defecto" maxLength={70} />
                <TextField
                  name="seo.titleTemplate"
                  label="Plantilla de título"
                  help="Debe incluir %s"
                />
                <TextField name="seo.locale" label="Locale" placeholder="es_CL" />
              </div>
              <TextareaField
                name="seo.description"
                label="Descripción por defecto"
                rows={2}
                maxLength={170}
              />
              <ImageField
                name="seo.ogImage"
                label="Imagen para compartir por defecto"
                folder="site"
                aspect="aspect-[1200/630]"
              />
            </Section>
          </TabsContent>

          <TabsContent value="root" className="space-y-4">
            <Section title='Comportamiento de "/"'>
              <SelectField
                name="root.mode"
                label="Página de inicio"
                options={[
                  { value: 'LANDING', label: 'Landing de venta (recomendado)' },
                  { value: 'DIRECTORY', label: 'Directorio de profesionales publicados' },
                  { value: 'DEFAULT_PROFESSIONAL', label: 'Profesional por defecto' },
                ]}
              />
              {rootMode === 'DEFAULT_PROFESSIONAL' && (
                <>
                  <SelectField
                    name="root.defaultProfessionalSlug"
                    label="Profesional"
                    options={professionals.map((p) => ({ value: p.slug, label: p.name }))}
                    help="Solo profesionales publicados."
                  />
                  <SwitchField
                    name="root.renderInPlace"
                    label="Mostrar en / (si no, redirige a /slug)"
                    help="La URL canónica siempre es /slug."
                  />
                </>
              )}
            </Section>
            <Section title="Selector de profesionales">
              <SwitchField
                name="switcher.enabled"
                label="Mostrar selector"
                help="Se oculta automáticamente si hay un solo profesional publicado."
              />
              <SwitchField name="switcher.showNames" label="Mostrar nombres bajo los avatares" />
              <SwitchField name="switcher.prefetchNeighbours" label="Precargar perfiles vecinos" />
            </Section>
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <Section title="Políticas">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="policies.privacyUrl" label="Política de privacidad (URL)" />
                <TextField name="policies.termsUrl" label="Términos (URL)" />
              </div>
            </Section>
            <Section
              title="Analytics"
              description="Opcional. Sin ID no se carga ningún script de analítica."
            >
              <TextField
                name="analytics.ga4MeasurementId"
                label="ID de medición GA4"
                placeholder="G-XXXXXXX"
              />
            </Section>
          </TabsContent>
        </Tabs>
      </form>
    </FormProvider>
  )
}
