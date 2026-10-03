import type { CollectionConfig } from 'payload'

export const Testimonios: CollectionConfig = {
  slug: 'testimonios',
  labels: { singular: 'Testimonio', plural: 'Testimonios' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'calificacion', 'publicado'],
    group: 'Contenido',
  },
  access: { read: () => true },
  fields: [
    { name: 'nombre', type: 'text', required: true, label: 'Nombre o iniciales' },
    { name: 'texto', type: 'textarea', required: true, label: 'Testimonio' },
    { name: 'calificacion', type: 'number', min: 1, max: 5, label: 'Calificacion (1 a 5)', defaultValue: 5 },
    { name: 'especialista', type: 'relationship', relationTo: 'especialistas', label: 'Especialista mencionado' },
    { name: 'servicio', type: 'relationship', relationTo: 'servicios', label: 'Servicio mencionado' },
    { name: 'fecha', type: 'date', label: 'Fecha del testimonio' },
    { name: 'publicado', type: 'checkbox', label: 'Mostrar en la web?', defaultValue: true },
  ],
}
