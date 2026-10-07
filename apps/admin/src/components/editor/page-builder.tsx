'use client'

import { useState } from 'react'
import { useFieldArray, useFormContext, useWatch, type FieldValues } from 'react-hook-form'
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  CopyPlus,
  GripVertical,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
} from 'lucide-react'
import {
  SECTION_BACKGROUNDS,
  SECTION_SPACING,
  shortId,
  type FieldDescriptor,
} from '@repo/domain'
import { cn } from '@repo/ui/lib/utils'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { Switch } from '@repo/ui/components/switch'
import { DescriptorField } from './descriptor-field'
import { SelectField, SwitchField } from './fields'

/** Minimal shape of a registry definition the builder needs. */
export interface BuilderDefinition {
  label: string
  description: string
  singleton: boolean
  variantLabels: Record<string, string>
  fields: FieldDescriptor[]
}

/** Minimal shape of a section instance stored in the form. */
export interface BuilderSection {
  id: string
  type: string
  enabled: boolean
  variant: string
  responsive: { hideOnMobile: boolean; hideOnDesktop: boolean }
}

const BACKGROUND_LABELS: Record<(typeof SECTION_BACKGROUNDS)[number], string> = {
  canvas: 'Lienzo',
  surface: 'Superficie blanca',
  mist: 'Bruma de marca',
  brand: 'Color de marca',
}
const SPACING_LABELS: Record<(typeof SECTION_SPACING)[number], string> = {
  compact: 'Compacto',
  normal: 'Normal',
  relaxed: 'Amplio',
}

/**
 * Controlled page builder over a typed section registry (professional pages
 * or the landing): sections can be added, removed, enabled/disabled,
 * duplicated and reordered (drag & drop or keyboard). No arbitrary code/HTML:
 * every section is validated by its registry's Zod schema.
 */
export function PageBuilder<T extends string>({
  registry,
  types,
  create,
  dndId,
  name = 'sections',
}: {
  registry: Record<T, BuilderDefinition>
  types: readonly T[]
  create: (type: T, id: string, order: number) => BuilderSection
  /** Stable, per-instance id so dnd-kit's a11y ids match between SSR and hydration. */
  dndId: string
  name?: string
}) {
  const { control } = useFormContext<FieldValues>()
  const { fields, append, remove, move, insert, update } = useFieldArray({
    control,
    name,
    keyName: 'key',
  })
  const sections = (useWatch({ control, name }) as BuilderSection[] | undefined) ?? []
  const def = (type: string) => registry[type as T]
  const [expanded, setExpanded] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const present = new Set(sections.map((s) => s.type))
  const available = types.filter((t) => !(registry[t].singleton && present.has(t)))

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = fields.findIndex((f) => f.key === active.id)
    const to = fields.findIndex((f) => f.key === over.id)
    if (from >= 0 && to >= 0) move(from, to)
  }

  function add(type: T) {
    const section = create(type, shortId('s'), sections.length)
    append(section)
    setExpanded(section.id)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {sections.filter((s) => s.enabled).length} de {sections.length} secciones visibles. El
          orden se aplica al publicar.
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm">
              <Plus /> Agregar sección
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-96 w-72">
            <DropdownMenuLabel>Tipos disponibles</DropdownMenuLabel>
            {available.map((type) => (
              <DropdownMenuItem
                key={type}
                onSelect={() => add(type)}
                className="flex-col items-start gap-0.5"
              >
                <span className="font-medium">{registry[type].label}</span>
                <span className="text-muted-foreground text-xs">
                  {registry[type].description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={fields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2" aria-label="Secciones de la página">
            {fields.map((field, index) => {
              const section = sections[index]
              const definition = section ? def(section.type) : undefined
              if (!section || !definition) return null
              return (
                <SectionCard
                  key={field.key}
                  sortId={field.key}
                  base={`${name}.${index}`}
                  section={section}
                  def={definition}
                  open={expanded === section.id}
                  onToggle={() => setExpanded(expanded === section.id ? null : section.id)}
                  onEnabled={(enabled) => update(index, { ...section, enabled })}
                  onRemove={() => remove(index)}
                  onDuplicate={
                    definition.singleton
                      ? undefined
                      : () => insert(index + 1, { ...structuredClone(section), id: shortId('s') })
                  }
                />
              )
            })}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SectionCard({
  sortId,
  base,
  section,
  def,
  open,
  onToggle,
  onEnabled,
  onRemove,
  onDuplicate,
}: {
  sortId: string
  base: string
  section: BuilderSection
  def: BuilderDefinition
  open: boolean
  onToggle: () => void
  onEnabled: (enabled: boolean) => void
  onRemove: () => void
  onDuplicate?: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortId })
  const variants = Object.entries(def.variantLabels).map(([value, label]) => ({ value, label }))

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'bg-card rounded-xl border',
        isDragging && 'relative z-10 shadow-lg',
        !section.enabled && 'opacity-70',
      )}
      data-testid={`section-${section.type}`}
    >
      <div className="flex items-center gap-2 p-2.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="text-muted-foreground hover:bg-muted cursor-grab rounded p-1 active:cursor-grabbing"
          aria-label={`Arrastrar sección ${def.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <span className="truncate text-sm font-medium">{def.label}</span>
          <span className="text-muted-foreground hidden truncate text-xs sm:inline">
            {def.variantLabels[section.variant] ?? ''}
          </span>
          {section.responsive.hideOnMobile && (
            <Badge variant="outline" title="Oculta en móvil">
              <Smartphone /> oculta
            </Badge>
          )}
          {section.responsive.hideOnDesktop && (
            <Badge variant="outline" title="Oculta en escritorio">
              <Monitor /> oculta
            </Badge>
          )}
          <ChevronDown
            className={cn(
              'text-muted-foreground ml-auto size-4 shrink-0 transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
        <Switch
          checked={section.enabled}
          onCheckedChange={onEnabled}
          aria-label={`Mostrar sección ${def.label}`}
        />
        {onDuplicate && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDuplicate}
            aria-label={`Duplicar ${def.label}`}
          >
            <CopyPlus />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={`Eliminar ${def.label}`}
        >
          <Trash2 />
        </Button>
      </div>
      {open && (
        <div className="space-y-5 border-t p-4">
          <p className="text-muted-foreground text-xs">{def.description}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {variants.length > 1 && (
              <SelectField name={`${base}.variant`} label="Variante" options={variants} />
            )}
            <SelectField
              name={`${base}.style.background`}
              label="Fondo"
              options={SECTION_BACKGROUNDS.map((v) => ({ value: v, label: BACKGROUND_LABELS[v] }))}
            />
            <SelectField
              name={`${base}.style.spacing`}
              label="Espaciado"
              options={SECTION_SPACING.map((v) => ({ value: v, label: SPACING_LABELS[v] }))}
            />
            <SelectField
              name={`${base}.style.align`}
              label="Alineación"
              options={[
                { value: 'start', label: 'Izquierda' },
                { value: 'center', label: 'Centrada' },
              ]}
            />
          </div>
          <div className="space-y-4">
            {def.fields.map((descriptor) => (
              <DescriptorField
                key={descriptor.name}
                descriptor={descriptor}
                base={`${base}.content`}
              />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <SwitchField name={`${base}.responsive.hideOnMobile`} label="Ocultar en móvil" />
            <SwitchField name={`${base}.responsive.hideOnDesktop`} label="Ocultar en escritorio" />
          </div>
        </div>
      )}
    </li>
  )
}
