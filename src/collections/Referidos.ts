import type { CollectionConfig } from 'payload'

export const Referidos: CollectionConfig = {
  slug: 'referidos',
  labels: { singular: 'Referido', plural: 'Referidos' },
  admin: {
    useAsTitle: 'paciente_nombre',
    defaultColumns: ['paciente_nombre', 'codigo', 'estado', 'fecha'],
    group: 'Campana',
  },
  access: { read: () => true },
  fields: [
    { name: 'paciente_nombre', type: 'text', required: true, label: 'Nombre del paciente' },
    { name: 'paciente_contacto', type: 'text', required: true, label: 'Contacto (telefono o correo)' },
    { name: 'codigo', type: 'text', required: true, label: 'Codigo usado' },
    { name: 'colegio', type: 'relationship', relationTo: 'colegios', label: 'Colegio' },
    { name: 'especialista', type: 'relationship', relationTo: 'especialistas', label: 'Especialista' },
    { name: 'servicio', type: 'relationship', relationTo: 'servicios', label: 'Servicio' },
    { name: 'fecha', type: 'date', required: true, label: 'Fecha' },
    {
      name: 'estado',
      type: 'select',
      required: true,
      label: 'Estado',
      defaultValue: 'pendiente',
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Aplicado', value: 'aplicado' },
        { label: 'Vencido', value: 'vencido' },
      ],
    },
    { name: 'notas', type: 'textarea', label: 'Notas internas' },
  ],
}
