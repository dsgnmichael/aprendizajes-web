'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
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
import {
  Archive,
  ArchiveRestore,
  Copy,
  CopyPlus,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Pencil,
  QrCode,
  Rocket,
  Trash2,
} from 'lucide-react'
import type { ProfessionalStatus } from '@repo/domain'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { toast } from '@repo/ui/components/sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'
import {
  archiveAction,
  deleteAction,
  duplicateAction,
  previewUrlAction,
  publishAction,
  reorderAction,
  restoreAction,
  unpublishAction,
} from '@/actions/professionals'
import { ConfirmDialog, type ConfirmState } from '@/components/confirm-dialog'
import { handleResult } from '@/components/use-action-toast'
import type { ActionResult } from '@/lib/action'
import { PROFESSIONAL_STATUS_LABEL } from '@/lib/labels'
import { QrDialog } from './qr-dialog'

/** Stable id so dnd-kit's accessibility ids match between SSR and hydration. */
const DND_ID = 'professionals-dnd'

export interface ProfessionalRow {
  id: string
  name: string
  slug: string
  professionalTitle: string
  status: ProfessionalStatus
  hasUnpublished: boolean
  isDemo: boolean
  updatedAtLabel: string
  avatarUrl?: string
  initials: string
  publicUrl: string
  qrUrl: string
}

export interface ProfessionalPermissions {
  write: boolean
  publish: boolean
  archive: boolean
  remove: boolean
}

const STATUS_VARIANT: Record<ProfessionalStatus, 'success' | 'secondary' | 'outline'> = {
  published: 'success',
  draft: 'secondary',
  archived: 'outline',
}

export function ProfessionalsTable({
  rows: initialRows,
  canReorder,
  permissions,
  logoUrl,
}: {
  rows: ProfessionalRow[]
  canReorder: boolean
  permissions: ProfessionalPermissions
  logoUrl?: string
}) {
  const router = useRouter()
  const sortable = canReorder && permissions.write
  const [rows, setRows] = useState(initialRows)
  const [syncedFrom, setSyncedFrom] = useState(initialRows)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [qr, setQr] = useState<ProfessionalRow | null>(null)
  const [, startTransition] = useTransition()
  if (syncedFrom !== initialRows) {
    setSyncedFrom(initialRows)
    setRows(initialRows)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = rows.findIndex((r) => r.id === active.id)
    const to = rows.findIndex((r) => r.id === over.id)
    const next = arrayMove(rows, from, to)
    setRows(next)
    startTransition(async () => {
      if (!handleResult(await reorderAction(next.map((r) => r.id)), 'Orden actualizado'))
        setRows(rows)
    })
  }

  function run<T>(promise: Promise<ActionResult<T>>, success: string, after?: (data: T) => void) {
    startTransition(async () => {
      const data = handleResult(await promise, success)
      router.refresh()
      if (data !== null && after) after(data)
    })
  }

  async function openPreview(id: string) {
    const result = await previewUrlAction(id)
    const data = handleResult(result)
    if (data) window.open(data.url, '_blank', 'noopener')
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    toast.success('URL copiada')
  }

  return (
    <>
      <div className="bg-card overflow-hidden rounded-xl border">
        <DndContext
          id={DND_ID}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {sortable && <TableHead className="w-8" aria-label="Ordenar" />}
                <TableHead>Profesional</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Modificado</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                {rows.map((row) => (
                  <SortableRow key={row.id} id={row.id} sortable={sortable}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="ring-border size-10 ring-1">
                          {row.avatarUrl && <AvatarImage src={row.avatarUrl} alt="" />}
                          <AvatarFallback>{row.initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={`/professionals/${row.id}`}
                            className="block truncate font-medium hover:underline"
                          >
                            {row.name}
                          </Link>
                          <p className="text-muted-foreground truncate text-xs">
                            {row.professionalTitle}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                      /{row.slug}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={STATUS_VARIANT[row.status]}>
                          {PROFESSIONAL_STATUS_LABEL[row.status]}
                        </Badge>
                        {row.hasUnpublished && (
                          <Badge variant="warning">Cambios sin publicar</Badge>
                        )}
                        {row.isDemo && <Badge variant="accent">DEMO</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                      {row.updatedAtLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setQr(row)}
                          aria-label={`Generar QR de ${row.name}`}
                        >
                          <QrCode />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Acciones para ${row.name}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem asChild>
                              <Link href={`/professionals/${row.id}`}>
                                <Pencil /> Editar
                              </Link>
                            </DropdownMenuItem>
                            {row.status === 'published' && (
                              <DropdownMenuItem asChild>
                                <a href={row.publicUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink /> Abrir página
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => openPreview(row.id)}>
                              <Eye /> Vista previa
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => copyUrl(row.publicUrl)}>
                              <Copy /> Copiar URL
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setQr(row)}>
                              <QrCode /> Generar QR
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {permissions.publish && row.status !== 'archived' && (
                              <DropdownMenuItem
                                onSelect={() => run(publishAction(row.id), 'Publicado')}
                              >
                                <Rocket />{' '}
                                {row.status === 'published' ? 'Publicar cambios' : 'Publicar'}
                              </DropdownMenuItem>
                            )}
                            {permissions.publish && row.status === 'published' && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  setConfirm({
                                    title: `¿Despublicar a ${row.name}?`,
                                    description:
                                      'La página pública dejará de estar disponible (404) hasta que vuelvas a publicar. Los QR impresos dejarán de funcionar mientras tanto.',
                                    confirmLabel: 'Despublicar',
                                    destructive: true,
                                    onConfirm: () => run(unpublishAction(row.id), 'Despublicado'),
                                  })
                                }
                              >
                                <EyeOff /> Despublicar
                              </DropdownMenuItem>
                            )}
                            {permissions.write && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  run(duplicateAction(row.id), 'Duplicado en borrador', (d) =>
                                    router.push(`/professionals/${d.id}`),
                                  )
                                }
                              >
                                <CopyPlus /> Duplicar
                              </DropdownMenuItem>
                            )}
                            {permissions.archive && row.status !== 'archived' && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  setConfirm({
                                    title: `¿Archivar a ${row.name}?`,
                                    description:
                                      'Se retirará del sitio público y del selector de profesionales. Podrás restaurarlo después.',
                                    confirmLabel: 'Archivar',
                                    onConfirm: () => run(archiveAction(row.id), 'Archivado'),
                                  })
                                }
                              >
                                <Archive /> Archivar
                              </DropdownMenuItem>
                            )}
                            {permissions.archive && row.status === 'archived' && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  run(restoreAction(row.id), 'Restaurado como borrador')
                                }
                              >
                                <ArchiveRestore /> Restaurar
                              </DropdownMenuItem>
                            )}
                            {permissions.remove && row.status === 'archived' && (
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() =>
                                  setConfirm({
                                    title: `¿Eliminar definitivamente a ${row.name}?`,
                                    description:
                                      'Se eliminarán el perfil, sus revisiones y sus testimonios manuales. Esta acción no se puede deshacer.',
                                    confirmLabel: 'Eliminar',
                                    destructive: true,
                                    onConfirm: () => run(deleteAction(row.id), 'Eliminado'),
                                  })
                                }
                              >
                                <Trash2 /> Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </SortableRow>
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
      {qr && (
        <QrDialog
          open
          onOpenChange={(open) => !open && setQr(null)}
          name={qr.name}
          slug={qr.slug}
          qrUrl={qr.qrUrl}
          logoUrl={logoUrl}
        />
      )}
    </>
  )
}

function SortableRow({
  id,
  sortable,
  children,
}: {
  id: string
  sortable: boolean
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !sortable,
  })
  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'bg-card relative z-10 shadow-lg' : undefined}
      data-testid={`professional-row-${id}`}
    >
      {sortable && (
        <TableCell className="w-8 pr-0">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="text-muted-foreground hover:bg-muted cursor-grab rounded p-1 active:cursor-grabbing"
            aria-label="Arrastrar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        </TableCell>
      )}
      {children}
    </TableRow>
  )
}
