import type { CollectionConfig } from 'payload'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Pregunta Frecuente', plural: 'Preguntas Frecuentes' },
  admin: {
    useAsTitle: 'pregunta',
    defaultColumns: ['pregunta', 'categoria', 'orden'],
    group: 'Contenido',
  },
  access: { read: () => true },
  fields: [
    { name: 'pregunta', type: 'text', required: true, label: 'Pregunta' },
    { name: 'respuesta', type: 'textarea', required: true, label: 'Respuesta' },
    {
      name: 'categoria',
      type: 'select',
      required: true,
      label: 'Categoria',
      options: [
        { label: 'General', value: 'general' },
        { label: 'Servicios', value: 'servicios' },
        { label: 'Pagos', value: 'pagos' },
        { label: 'Promociones', value: 'promociones' },
      ],
    },
    { name: 'servicio', type: 'relationship', relationTo: 'servicios', label: 'Servicio relacionado' },
    { name: 'orden', type: 'number', label: 'Orden', defaultValue: 0 },
  ],
}
