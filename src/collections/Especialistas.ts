import type { CollectionConfig } from 'payload'

export const Especialistas: CollectionConfig = {
  slug: 'especialistas',
  labels: {
    singular: 'Especialista',
    plural: 'Especialistas',
  },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'profesion', 'activo'],
    group: 'Contenido',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'nombre', type: 'text', required: true, label: 'Nombre completo' },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'Slug (URL)' },
    { name: 'profesion', type: 'text', required: true, label: 'Profesion' },
    { name: 'colegiatura', type: 'text', label: 'Numero de colegiatura' },
    { name: 'foto', type: 'upload', relationTo: 'media', required: true, label: 'Foto principal' },
    { name: 'frase', type: 'text', label: 'Frase personal' },
    { name: 'bio', type: 'textarea', label: 'Biografia corta' },
    {
      name: 'especialidades',
      type: 'array',
      label: 'Especialidades',
      maxRows: 3,
      fields: [{ name: 'texto', type: 'text', required: true, label: 'Texto' }],
    },
    { name: 'anos_experiencia', type: 'number', label: 'Anos de experiencia' },
    { name: 'servicios', type: 'relationship', relationTo: 'servicios', hasMany: true, label: 'Servicios' },
    { name: 'whatsapp', type: 'text', label: 'WhatsApp' },
    { name: 'correo', type: 'email', label: 'Correo electronico' },
    { name: 'instagram', type: 'text', label: 'Instagram' },
    { name: 'atiende_online', type: 'checkbox', label: 'Atiende online?', defaultValue: false },
    { name: 'nfc_id', type: 'text', label: 'Codigo NFC' },
    { name: 'orden', type: 'number', label: 'Orden', defaultValue: 0 },
    { name: 'activo', type: 'checkbox', label: 'Mostrar en la web?', defaultValue: true },
  ],
}
