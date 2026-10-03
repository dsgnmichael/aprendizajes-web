import type { GlobalConfig } from 'payload'

export const Configuracion: GlobalConfig = {
  slug: 'configuracion',
  label: 'Configuracion del sitio',
  admin: { group: 'Sitio' },
  access: { read: () => true },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identidad',
          fields: [
            { name: 'nombre_consultorio', type: 'text', defaultValue: 'Aprendizajes', label: 'Nombre del consultorio' },
            { name: 'eslogan', type: 'text', label: 'Eslogan' },
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo principal' },
            { name: 'historia', type: 'textarea', label: 'Historia del consultorio' },
            { name: 'mision', type: 'textarea', label: 'Mision' },
            { name: 'vision', type: 'textarea', label: 'Vision' },
          ],
        },
        {
          label: 'Contacto',
          fields: [
            { name: 'direccion', type: 'text', label: 'Direccion' },
            { name: 'punto_referencia', type: 'text', label: 'Punto de referencia' },
            { name: 'telefono', type: 'text', label: 'Telefono' },
            { name: 'whatsapp', type: 'text', label: 'WhatsApp' },
            { name: 'correo', type: 'email', label: 'Correo electronico' },
            { name: 'instagram', type: 'text', label: 'Instagram' },
            { name: 'horarios', type: 'textarea', label: 'Horarios de atencion' },
            { name: 'google_maps_embed', type: 'textarea', label: 'Enlace de Google Maps (embed)' },
            { name: 'google_maps_url', type: 'text', label: 'Enlace de Google Maps (normal)' },
            { name: 'google_review_url', type: 'text', label: 'Enlace para dejar resena en Google' },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'seo_titulo', type: 'text', label: 'Titulo SEO' },
            { name: 'seo_descripcion', type: 'textarea', label: 'Descripcion SEO' },
            { name: 'seo_imagen', type: 'upload', relationTo: 'media', label: 'Imagen para redes sociales' },
          ],
        },
      ],
    },
  ],
}
