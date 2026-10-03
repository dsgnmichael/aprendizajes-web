import type { GlobalConfig } from 'payload'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Contenido de la pagina de inicio',
  admin: { group: 'Sitio' },
  access: { read: () => true },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            { name: 'hero_titulo', type: 'text', label: 'Titulo principal' },
            { name: 'hero_subtitulo', type: 'textarea', label: 'Subtitulo' },
            { name: 'hero_imagen', type: 'upload', relationTo: 'media', label: 'Imagen de fondo' },
            { name: 'hero_cta_texto', type: 'text', label: 'Texto del boton', defaultValue: 'Agendar cita' },
            { name: 'hero_cta_url', type: 'text', label: 'Enlace del boton' },
          ],
        },
        {
          label: 'Barra de confianza',
          fields: [
            { name: 'anos_experiencia', type: 'text', label: 'Anos de experiencia' },
            { name: 'familias_atendidas', type: 'text', label: 'Familias atendidas' },
            { name: 'calificacion_promedio', type: 'text', label: 'Calificacion promedio' },
          ],
        },
        {
          label: 'Bloque Colegios',
          fields: [
            { name: 'mostrar_bloque_colegios', type: 'checkbox', label: 'Mostrar bloque de colegios?', defaultValue: false },
            { name: 'colegios_titulo', type: 'text', label: 'Titulo del bloque' },
            { name: 'colegios_texto', type: 'textarea', label: 'Texto del bloque' },
            { name: 'colegios_imagen', type: 'upload', relationTo: 'media', label: 'Imagen del bloque' },
          ],
        },
      ],
    },
  ],
}
