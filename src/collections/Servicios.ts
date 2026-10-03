import type { CollectionConfig } from 'payload'

export const Servicios: CollectionConfig = {
  slug: 'servicios',
  labels: {
    singular: 'Servicio',
    plural: 'Servicios',
  },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'activo', 'orden'],
    group: 'Contenido',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'nombre', type: 'text', required: true, label: 'Nombre del servicio' },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'Slug (URL)' },
    { name: 'descripcion_corta', type: 'textarea', required: true, label: 'Descripcion corta' },
    { name: 'descripcion_larga', type: 'textarea', label: 'Descripcion larga' },
    { name: 'imagen', type: 'upload', relationTo: 'media', label: 'Imagen del servicio' },
    { name: 'icono', type: 'upload', relationTo: 'media', label: 'Icono' },
    { name: 'edades', type: 'text', label: 'Edades que atiende' },
    {
      name: 'motivos_consulta',
      type: 'array',
      label: 'Motivos de consulta',
      fields: [{ name: 'texto', type: 'text', required: true, label: 'Motivo' }],
    },
    { name: 'duracion_sesion', type: 'text', label: 'Duracion de la sesion' },
    { name: 'frecuencia', type: 'text', label: 'Frecuencia recomendada' },
    { name: 'anos_experiencia', type: 'text', label: 'Experiencia' },
    { name: 'especialistas', type: 'relationship', relationTo: 'especialistas', hasMany: true, label: 'Especialistas que lo imparten' },
    { name: 'mostrar_precio', type: 'checkbox', label: 'Mostrar precio?', defaultValue: false },
    { name: 'precio', type: 'text', label: 'Precio (si aplica)' },
    { name: 'orden', type: 'number', label: 'Orden', defaultValue: 0 },
    { name: 'activo', type: 'checkbox', label: 'Mostrar en la web?', defaultValue: true },
  ],
}
