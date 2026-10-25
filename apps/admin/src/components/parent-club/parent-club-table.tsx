'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { ParentClubRegistrationDocument, ParentClubTag } from '@repo/domain'
import { SUPPORT_AREA_LABELS, PARENT_CLUB_TAGS, PARENT_CLUB_TAG_LABELS } from '@repo/domain'
import { ChevronDown, ChevronRight, Mail, Phone, Calendar, User, Trash2, Loader2, X, CheckSquare, Star, Flame, CheckCircle2, CalendarCheck, Gem, Pin, PauseCircle, XCircle, Search, Filter } from 'lucide-react'
import { toast } from '@repo/ui/components/sonner'
import { cn } from '@repo/ui/lib/utils'
import {
  deleteRegistrationAction,
  deleteManyRegistrationsAction,
  toggleTagAction,
} from '@/app/(dashboard)/formularios/invitacion-especial/actions'

const TAG_ICONS: Record<ParentClubTag, React.ComponentType<{ className?: string }>> = {
  favorito: Star,
  alta_prioridad: Flame,
  contactado: CheckCircle2,
  reunion_agendada: CalendarCheck,
  vip: Gem,
  seguimiento: Pin,
  en_pausa: PauseCircle,
  descartado: XCircle,
}

const TAG_COLORS: Record<ParentClubTag, { active: string; inactive: string; icon: string }> = {
  favorito: { active: 'bg-amber-100 text-amber-800 border-amber-300', inactive: 'bg-muted text-muted-foreground border-transparent', icon: 'fill-amber-500 text-amber-500' },
  alta_prioridad: { active: 'bg-red-100 text-red-800 border-red-300', inactive: 'bg-muted text-muted-foreground border-transparent', icon: 'fill-red-500 text-red-500' },
  contactado: { active: 'bg-emerald-100 text-emerald-800 border-emerald-300', inactive: 'bg-muted text-muted-foreground border-transparent', icon: 'text-emerald-600' },
  reunion_agendada: { active: 'bg-blue-100 text-blue-800 border-blue-300', inactive: 'bg-muted text-muted-foreground border-transparent', icon: 'text-blue-600' },
  vip: { active: 'bg-purple-100 text-purple-800 border-purple-300', inactive: 'bg-muted text-muted-foreground border-transparent', icon: 'text-purple-600' },
  seguimiento: { active: 'bg-orange-100 text-orange-800 border-orange-300', inactive: 'bg-muted text-muted-foreground border-transparent', icon: 'text-orange-600' },
  en_pausa: { active: 'bg-gray-100 text-gray-800 border-gray-300', inactive: 'bg-muted text-muted-foreground border-transparent', icon: 'text-gray-600' },
  descartado: { active: 'bg-rose-100 text-rose-800 border-rose-300', inactive: 'bg-muted text-muted-foreground border-transparent', icon: 'text-rose-600' },
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export function ParentClubTable({ registrations }: { registrations: ParentClubRegistrationDocument[] }) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'one'; id: string; name: string } | { type: 'many'; count: number } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [filterTag, setFilterTag] = useState<ParentClubTag | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [localTags, setLocalTags] = useState<Record<string, ParentClubTag[]>>({})

  const getTags = useCallback(
    (r: ParentClubRegistrationDocument): ParentClubTag[] => {
      return localTags[r.id] ?? r.tags ?? []
    },
    [localTags]
  )

  const tagCounts = useMemo(() => {
    const counts: Record<ParentClubTag, number> = {} as Record<ParentClubTag, number>
    for (const tag of PARENT_CLUB_TAGS) {
      counts[tag] = registrations.filter((r) => getTags(r).includes(tag)).length
    }
    return counts
  }, [registrations, getTags])

  const filteredRegistrations = useMemo(() => {
    let result = registrations
    if (filterTag) {
      result = result.filter((r) => getTags(r).includes(filterTag))
    }
    const searchNorm = normalize(searchQuery)
    if (searchNorm.length > 0) {
      const searchDigits = searchQuery.replace(/\D/g, '')
      result = result.filter((r) => {
        const nameMatch = normalize(r.fullName).includes(searchNorm)
        const emailMatch = normalize(r.email).includes(searchNorm)
        const phoneMatch = searchDigits.length >= 3 && r.whatsapp.replace(/\D/g, '').includes(searchDigits)
        return nameMatch || emailMatch || phoneMatch
      })
    }
    return result
  }, [registrations, filterTag, searchQuery, getTags])

  const handleToggleTag = (id: string, tag: ParentClubTag) => {
    const currentTags = localTags[id] ?? registrations.find((r) => r.id === id)?.tags ?? []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag]

    setLocalTags((prev) => ({ ...prev, [id]: newTags }))

    startTransition(async () => {
      const result = await toggleTagAction(id, tag)
      if (!result.success) {
        toast.error(result.error || 'Error al actualizar')
        setLocalTags((prev) => ({ ...prev, [id]: currentTags }))
      } else {
        router.refresh()
      }
    })
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRegistrations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRegistrations.map((r) => r.id)))
    }
  }

  const handleDeleteOne = (id: string, name: string) => {
    setConfirmDelete({ type: 'one', id, name })
  }

  const handleDeleteMany = () => {
    if (selectedIds.size === 0) return
    setConfirmDelete({ type: 'many', count: selectedIds.size })
  }

  const executeDelete = () => {
    if (!confirmDelete) return
    startTransition(async () => {
      try {
        if (confirmDelete.type === 'one') {
          const result = await deleteRegistrationAction(confirmDelete.id)
          if (result.success) {
            toast.success('Registro eliminado')
            setSelectedIds((prev) => {
              const next = new Set(prev)
              next.delete(confirmDelete.id)
              return next
            })
          } else {
            toast.error(result.error || 'Error al eliminar')
          }
        } else {
          const ids = Array.from(selectedIds)
          const result = await deleteManyRegistrationsAction(ids)
          if (result.success) {
            toast.success(`${result.count} registro(s) eliminado(s)`)
            setSelectedIds(new Set())
          } else {
            toast.error(result.error || 'Error al eliminar')
          }
        }
        setConfirmDelete(null)
        router.refresh()
      } catch {
        toast.error('Error al eliminar')
      }
    })
  }

  if (registrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Aún no hay registros en este formulario.</p>
      </div>
    )
  }

  const allSelected = selectedIds.size === filteredRegistrations.length && filteredRegistrations.length > 0

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar por nombre, apellido, teléfono o correo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border bg-card py-2.5 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filtros por marca (colapsables) */}
      <div className="rounded-md border bg-card">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/30"
        >
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-bold">
              Filtrar por marcas
            </span>
            {filterTag !== null && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                TAG_COLORS[filterTag].active
              )}>
                {PARENT_CLUB_TAG_LABELS[filterTag]}
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              showFilters && "rotate-180"
            )}
          />
        </button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 border-t p-3">
            <button
              type="button"
              onClick={() => setFilterTag(null)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                filterTag === null ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              Todos ({registrations.length})
            </button>
            {PARENT_CLUB_TAGS.map((tag) => {
              const Icon = TAG_ICONS[tag]
              const count = tagCounts[tag]
              const isActive = filterTag === tag
              const colors = TAG_COLORS[tag]
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFilterTag(isActive ? null : tag)}
                  disabled={count === 0}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                    count === 0 && "opacity-40 cursor-not-allowed",
                    isActive ? colors.active : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  )}
                >
                  <Icon className={cn("size-3.5", isActive ? colors.icon : "")} />
                  {PARENT_CLUB_TAG_LABELS[tag]} ({count})
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Barra de acciones masivas */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-primary/5 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckSquare className="size-4 text-primary" />
            <span>{selectedIds.size} seleccionado(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteMany}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              Eliminar {selectedIds.size}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-md border bg-card overflow-hidden">
        {/* Encabezado */}
        <div className="grid grid-cols-[28px_28px_1fr_28px] md:grid-cols-[40px_40px_1fr_140px_120px_60px] items-center gap-2 md:gap-3 border-b bg-muted/50 px-3 md:px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="size-4 cursor-pointer rounded border-gray-300 accent-primary"
            aria-label="Seleccionar todos"
          />
          <span></span>
          <span>Nombre / Contacto</span>
          <span className="hidden md:block">Fecha</span>
          <span className="hidden md:block">Estado</span>
          <span></span>
        </div>

        <div className="divide-y">
          {filteredRegistrations.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {searchQuery ? `No se encontraron registros para "${searchQuery}".` : 'No hay registros con esta marca.'}
            </div>
          ) : filteredRegistrations.map((r) => {
            const isExpanded = expandedId === r.id
            const isSelected = selectedIds.has(r.id)
            const currentTags = getTags(r)
            const visibleTags = currentTags.slice(0, 4)
            const extraCount = currentTags.length - visibleTags.length

            return (
              <div key={r.id} className="group">
                <div
                  className={cn(
                    "grid grid-cols-[28px_28px_1fr_28px] md:grid-cols-[40px_40px_1fr_140px_120px_60px] items-center gap-2 md:gap-3 px-3 md:px-4 py-3 transition-colors",
                    isSelected && "bg-primary/5",
                    !isSelected && "hover:bg-muted/30"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(r.id)}
                    className="size-4 cursor-pointer rounded border-gray-300 accent-primary"
                    aria-label={`Seleccionar ${r.fullName}`}
                  />
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="flex justify-center text-muted-foreground hover:text-foreground"
                    aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                  >
                    {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="flex flex-col text-left min-w-0"
                  >
                    {/* Marcas arriba del nombre */}
                    {visibleTags.length > 0 && (
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        {visibleTags.map((tag) => {
                          const Icon = TAG_ICONS[tag]
                          const colors = TAG_COLORS[tag]
                          return (
                            <span
                              key={tag}
                              className={cn("inline-flex items-center justify-center rounded-full p-1 border", colors.active)}
                              title={PARENT_CLUB_TAG_LABELS[tag]}
                            >
                              <Icon className={cn("size-3", colors.icon)} />
                            </span>
                          )
                        })}
                        {extraCount > 0 && (
                          <span className="text-xs text-muted-foreground font-medium">+{extraCount}</span>
                        )}
                      </div>
                    )}
                    <span className="font-bold text-foreground truncate">{r.fullName}</span>
                    <span className="text-xs text-muted-foreground truncate">{r.email}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                      <Phone className="size-3 shrink-0" />
                      <span className="truncate">{r.whatsapp}</span>
                    </span>

                    {/* Fecha y Estado visibles solo en móvil (debajo del nombre) */}
                    <div className="flex items-center gap-2 mt-2 md:hidden flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}
                        {new Date(r.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                        r.status === 'nuevo' ? 'bg-blue-100 text-blue-700' :
                        r.status === 'contactado' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  </button>

                  {/* Fecha (solo desktop) */}
                  <div className="hidden md:block text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('es-CL', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                    <br />
                    <span className="text-xs">
                      {new Date(r.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Estado (solo desktop) */}
                  <div className="hidden md:block">
                    <span className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
                      r.status === 'nuevo' ? 'bg-blue-100 text-blue-700' :
                      r.status === 'contactado' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteOne(r.id, r.fullName)}
                    className="flex justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Eliminar ${r.fullName}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="grid gap-4 border-t border-dashed bg-muted/10 px-6 md:px-14 py-6">
                    {/* Sección de marcas */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Marcas</p>
                      <div className="flex flex-wrap gap-2">
                        {PARENT_CLUB_TAGS.map((tag) => {
                          const Icon = TAG_ICONS[tag]
                          const isActive = currentTags.includes(tag)
                          const colors = TAG_COLORS[tag]
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleTag(r.id, tag)}
                              disabled={isPending}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 disabled:opacity-50",
                                isActive ? colors.active : colors.inactive
                              )}
                            >
                              <Icon className={cn("size-3.5", isActive ? colors.icon : "")} />
                              {PARENT_CLUB_TAG_LABELS[tag]}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-muted-foreground uppercase">WhatsApp</p>
                          <a
                            href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline break-all"
                          >
                            {r.whatsapp}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-muted-foreground uppercase">Email</p>
                          <a href={`mailto:${r.email}`} className="text-sm font-medium text-primary hover:underline break-all">
                            {r.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">Fecha de nacimiento</p>
                          <p className="text-sm font-medium">{r.birthDate}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <User className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                        <div className="w-full min-w-0">
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Áreas de interés</p>
                          <div className="flex flex-wrap gap-2">
                            {r.supportAreas.map((area) => (
                              <span key={area} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                {SUPPORT_AREA_LABELS[area]}
                              </span>
                            ))}
                          </div>
                          {r.otherSupport && (
                            <div className="mt-3">
                              <p className="text-xs font-bold text-muted-foreground uppercase">Comentario adicional</p>
                              <p className="text-sm italic text-muted-foreground mt-1 border-l-2 border-muted pl-2 break-words">
                                &ldquo;{r.otherSupport}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Diálogo de confirmación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">¿Eliminar {confirmDelete.type === 'one' ? 'registro' : `${confirmDelete.count} registros`}?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {confirmDelete.type === 'one'
                    ? `Se eliminará permanentemente el registro de "${confirmDelete.name}". Esta acción no se puede deshacer.`
                    : `Se eliminarán permanentemente ${confirmDelete.count} registros. Esta acción no se puede deshacer.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={isPending}
                className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
