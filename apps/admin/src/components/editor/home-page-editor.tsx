'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
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
  createLandingSection,
  homePageInputSchema,
  LANDING_SECTION_TYPES,
  landingSectionRegistry,
  type HomePageInput,
} from '@repo/domain'
import { cn } from '@repo/ui/lib/utils'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import {
  publishHomeAction,
  restoreHomeRevisionAction,
  saveHomeDraftAction,
} from '@/actions/home-page'
import { handleResult } from '@/components/use-action-toast'
import { Section, TextareaField, TextField } from './fields'
import { ImageField } from './image-field'
import { PageBuilder } from './page-builder'
import { PreviewPanel } from './preview-panel'

type FormInput = z.input<typeof homePageInputSchema>

export interface HomeEditorMeta {
  revision: number
  publishedRevision: number | null
  publicUrl: string
  revisions: { revision: number; publishedAt: string; publishedBy: string }[]
  canPublish: boolean
}

/**
 * Editor of the sales landing (home page). Same workflow as professionals:
 * draft (optimistic concurrency) → live preview → publish an immutable copy.
 */
export function HomePageEditor({ initial, meta }: { initial: HomePageInput; meta: HomeEditorMeta }) {
  const router = useRouter()
  const form = useForm<FormInput, unknown, HomePageInput>({
    resolver: zodResolver(homePageInputSchema),
    defaultValues: initial,
    mode: 'onBlur',
  })
  const [revision, setRevision] = useState(meta.revision)
  const [publishedRevision, setPublishedRevision] = useState(meta.publishedRevision)
  const [previewKey, setPreviewKey] = useState(0)
  const [showPreview, setShowPreview] = useState(true)
  const [pending, startTransition] = useTransition()
  const { isDirty, errors } = form.formState

  useEffect(() => {
    if (!isDirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const save = form.handleSubmit(
    (values) =>
      startTransition(async () => {
        const data = handleResult(await saveHomeDraftAction(values, revision), 'Borrador guardado')
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
          await publishHomeAction(values, revision),
          'Página de inicio publicada',
        )
        if (!data) return
        setRevision(data.revision)
        setPublishedRevision(data.publishedRevision)
        form.reset(values)
        setPreviewKey((k) => k + 1)
        router.refresh()
      }),
    () => handleResult({ ok: false, error: 'Revisa los campos marcados antes de publicar.' }),
  )

  const published = publishedRevision !== null
  const unpublished = published && revision > (publishedRevision ?? 0)
  const errorCount = Object.keys(errors).length

  return (
    <FormProvider {...form}>
      <form onSubmit={save} noValidate>
        <div className="bg-background/95 sticky top-14 z-20 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">Página de inicio</h1>
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
              <Badge variant={published ? 'success' : 'secondary'}>
                {published ? 'Publicada' : 'Sin publicar'}
              </Badge>
              {unpublished && <Badge variant="warning">Cambios sin publicar</Badge>}
              {isDirty && <Badge variant="outline">Sin guardar</Badge>}
              <span className="tabular-nums">rev. {revision}</span>
            </div>
          </div>
          {errorCount > 0 && (
            <span className="text-destructive flex items-center gap-1 text-xs" role="status">
              <AlertCircle className="size-4" /> Hay campos con errores
            </span>
          )}
          <Button asChild variant="ghost" size="sm">
            <a href={meta.publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink /> Ver sitio
            </a>
          </Button>
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
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />} Guardar borrador
          </Button>
          {meta.canPublish && (
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
          <Tabs defaultValue="sections" className="min-w-0">
            <TabsList>
              <TabsTrigger value="sections">Secciones</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="revisions">Revisiones</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="space-y-4">
              <Section
                title="Secciones de la landing"
                description="Activa, ordena y edita cada bloque. Los cambios se ven en la vista previa al guardar y en el sitio al publicar."
              >
                <PageBuilder
                  registry={landingSectionRegistry}
                  types={LANDING_SECTION_TYPES}
                  create={createLandingSection}
                  dndId="landing-sections-dnd"
                />
              </Section>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <Section
                title="SEO y redes sociales"
                description="Si se dejan vacíos se usan los valores de Configuración → SEO."
              >
                <TextField name="seo.title" label="Título SEO" maxLength={70} />
                <TextareaField name="seo.description" label="Descripción SEO" maxLength={170} />
                <ImageField
                  name="seo.ogImage"
                  label="Imagen para compartir (1200×630 recomendado)"
                  folder="site"
                  aspect="aspect-[1200/630]"
                />
              </Section>
            </TabsContent>

            <TabsContent value="revisions" className="space-y-4">
              <Section
                title="Publicaciones"
                description="Cada publicación genera una copia inmutable. El sitio público solo lee la versión publicada."
              >
                {meta.revisions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aún no se ha publicado.</p>
                ) : (
                  <ol className="divide-y">
                    {meta.revisions.map((r) => (
                      <li
                        key={r.revision}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
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
                            title={
                              isDirty
                                ? 'Guarda o descarta los cambios antes de restaurar'
                                : undefined
                            }
                            onClick={() =>
                              startTransition(async () => {
                                const data = handleResult(
                                  await restoreHomeRevisionAction(r.revision, revision),
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
              <PreviewPanel target={{ kind: 'home' }} reloadKey={previewKey} />
            </aside>
          )}
        </div>
      </form>
    </FormProvider>
  )
}
