import type { CollectionConfig } from 'payload'

export const Promociones: CollectionConfig = {
  slug: 'promociones',
  labels: { singular: 'Promocion', plural: 'Promociones' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'codigo', 'fecha_fin', 'activo'],
    group: 'Campana',
  },
  access: { read: () => true },
  fields: [
    { name: 'titulo', type: 'text', required: true, label: 'Titulo de la promocion' },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'Slug' },
    { name: 'descripcion', type: 'textarea', required: true, label: 'Descripcion' },
    { name: 'imagen', type: 'upload', relationTo: 'media', label: 'Imagen' },
    { name: 'fecha_inicio', type: 'date', required: true, label: 'Fecha de inicio' },
    { name: 'fecha_fin', type: 'date', required: true, label: 'Fecha de finalizacion' },
    { name: 'descuento', type: 'text', label: 'Descuento (ej: 20% primera consulta)' },
    { name: 'codigo', type: 'text', label: 'Codigo de la promocion' },
    { name: 'colegio', type: 'relationship', relationTo: 'colegios', label: 'Colegio asociado' },
    { name: 'reglas', type: 'textarea', label: 'Reglas y condiciones' },
    { name: 'activo', type: 'checkbox', label: 'Activa?', defaultValue: true },
  ],
}
