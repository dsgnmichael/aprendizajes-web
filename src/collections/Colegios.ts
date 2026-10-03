import type { CollectionConfig } from 'payload'

export const Colegios: CollectionConfig = {
  slug: 'colegios',
  labels: { singular: 'Colegio', plural: 'Colegios' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'codigo_referido', 'activo'],
    group: 'Campana',
  },
  access: { read: () => true },
  fields: [
    { name: 'nombre', type: 'text', required: true, label: 'Nombre del colegio' },
    { name: 'contacto', type: 'text', label: 'Persona de contacto' },
    { name: 'telefono', type: 'text', label: 'Telefono' },
    { name: 'correo', type: 'email', label: 'Correo electronico' },
    { name: 'direccion', type: 'text', label: 'Direccion' },
    { name: 'codigo_referido', type: 'text', required: true, unique: true, label: 'Codigo de referido (ej: SANJOSE2026)' },
    { name: 'activo', type: 'checkbox', label: 'Activo?', defaultValue: true },
  ],
}
