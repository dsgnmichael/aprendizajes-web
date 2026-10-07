'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MessageSquareQuote, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import type { TestimonialInput } from '@repo/domain'
import { cn } from '@repo/ui/lib/utils'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Switch } from '@repo/ui/components/switch'
import {
  deleteTestimonialAction,
  patchTestimonialAction,
  reorderTestimonialsAction,
} from '@/actions/testimonials'
import { ConfirmDialog, type ConfirmState } from '@/components/confirm-dialog'
import { PublicBaseProvider } from '@/components/media/media-url'
import { EmptyState } from '@/components/shell/empty-state'
import { handleResult } from '@/components/use-action-toast'
import { TestimonialFormDialog } from './testimonial-form'

/** Stable id so dnd-kit's accessibility ids match between SSR and hydration. */
const DND_ID = 'testimonials-dnd'

export type TestimonialRow = TestimonialInput & { id: string; professionalName: string | null }

export function TestimonialsManager({
  rows: initial,
  professionals,
  filterProfessionalId,
  publicBaseUrl,
}: {
  rows: TestimonialRow[]
  professionals: { id: string; name: string }[]
  filterProfessionalId: string | null
  publicBaseUrl: string
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [synced, setSynced] = useState(initial)
  const [editing, setEditing] = useState<TestimonialRow | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [, startTransition] = useTransition()
  if (synced !== initial) {
    setSynced(initial)
    setRows(initial)
  }
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function patch(
    row: TestimonialRow,
    data: Partial<Pick<TestimonialInput, 'enabled' | 'featured'>>,
  ) {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...data } : r)))
    startTransition(async () => {
      if (handleResult(await patchTestimonialAction(row.id, data), 'Actualizado') === null)
        router.refresh()
    })
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const next = arrayMove(
      rows,
      rows.findIndex((r) => r.id === active.id),
      rows.findIndex((r) => r.id === over.id),
    )
    setRows(next)
    startTransition(async () => {
      handleResult(
        await reorderTestimonialsAction(
          next.map((r) => r.id),
          [...new Set(next.map((r) => r.professionalId))],
        ),
        'Orden actualizado',
      )
    })
  }

  return (
    <PublicBaseProvider value={publicBaseUrl}>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus /> Nuevo testimonio
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote />}
          title="Sin testimonios"
          description="Agrega testimonios manuales reales para mostrarlos en los perfiles."
        />
      ) : (
        <DndContext
          id={DND_ID}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2" aria-label="Testimonios">
              {rows.map((row) => (
                <SortableItem key={row.id} id={row.id}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{row.authorName}</span>
                      {row.rating != null && (
                        <span
                          className="flex items-center gap-0.5 text-xs text-[oklch(0.6_0.14_75)]"
                          aria-label={`${row.rating} de 5`}
                        >
                          {Array.from({ length: row.rating }, (_, i) => (
                            <Star key={i} className="size-3 fill-current" aria-hidden />
                          ))}
                        </span>
                      )}
                      <Badge variant="outline">{row.professionalName ?? 'General'}</Badge>
                      {row.featured && <Badge variant="accent">Destacado</Badge>}
                      {!row.enabled && <Badge variant="secondary">Oculto</Badge>}
                      {row.isDemo && <Badge variant="warning">DEMO</Badge>}
                    </div>
                    <p
                      className={cn(
                        'text-muted-foreground mt-1 line-clamp-2 text-sm',
                        !row.enabled && 'opacity-60',
                      )}
                    >
                      {row.content}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      Visible
                      <Switch
                        checked={row.enabled}
                        onCheckedChange={(enabled) => patch(row, { enabled })}
                        aria-label={`Visible: ${row.authorName}`}
                      />
                    </label>
                    <label className="text-muted-foreground hidden items-center gap-1.5 text-xs sm:flex">
                      Destacado
                      <Switch
                        checked={row.featured}
                        onCheckedChange={(featured) => patch(row, { featured })}
                        aria-label={`Destacado: ${row.authorName}`}
                      />
                    </label>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar testimonio de ${row.authorName}`}
                      onClick={() => {
                        setEditing(row)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Eliminar testimonio de ${row.authorName}`}
                      onClick={() =>
                        setConfirm({
                          title: '¿Eliminar testimonio?',
                          description:
                            'Se quitará de todos los perfiles. Si solo quieres dejar de mostrarlo, desactiva "Visible".',
                          confirmLabel: 'Eliminar',
                          destructive: true,
                          onConfirm: () =>
                            startTransition(async () => {
                              handleResult(
                                await deleteTestimonialAction(row.id),
                                'Testimonio eliminado',
                              )
                              router.refresh()
                            }),
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </SortableItem>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <TestimonialFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        professionals={professionals}
        defaultProfessionalId={filterProfessionalId}
        onSaved={() => router.refresh()}
      />
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </PublicBaseProvider>
  )
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'bg-card flex items-start gap-3 rounded-xl border p-3',
        isDragging && 'relative z-10 shadow-lg',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="text-muted-foreground hover:bg-muted mt-0.5 cursor-grab rounded p-1"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      {children}
    </li>
  )
}
