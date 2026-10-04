import type { CollectionConfig } from 'payload'

const crearSlug = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const Especialistas: CollectionConfig = {
  slug: 'especialistas',
  labels: { singular: 'Especialista', plural: 'Especialistas' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['foto', 'nombre', 'profesion', 'orden', 'activo'],
    group: 'Contenido',
    description:
      '\u00A1Hola! Aqu\u00ED puedes agregar, editar o eliminar a los especialistas. ' +
      'Llena las pesta\u00F1as de arriba a abajo y presiona Guardar (arriba a la derecha) cuando termines.',
  },
  access: { read: () => true },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && data.nombre && !data.slug) {
          data.slug = crearSlug(data.nombre)
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '1. Informaci\u00F3n b\u00E1sica',
          description: 'Datos principales de la persona.',
          fields: [
            {
              name: 'nombre',
              type: 'text',
              required: true,
              label: 'Nombre completo',
              admin: {
                placeholder: 'Ej: Jessica De Sousa',
                description: 'Nombre y apellido como quieres que aparezca en la web.',
              },
            },
            {
              name: 'profesion',
              type: 'text',
              required: true,
              label: 'Profesi\u00F3n',
              admin: { placeholder: 'Ej: Psicopedagoga', description: 'La profesi\u00F3n principal.' },
            },
            {
              name: 'colegiatura',
              type: 'text',
              label: 'N\u00FAmero de colegiatura',
              admin: { placeholder: 'Ej: CPV 12345', description: 'Opcional. N\u00FAmero que acredita profesionalmente.' },
            },
            {
              name: 'anos_experiencia',
              type: 'number',
              label: 'A\u00F1os de experiencia',
              admin: { placeholder: 'Ej: 14', description: 'Opcional. Se muestra como "M\u00E1s de X a\u00F1os".' },
            },
          ],
        },
        {
          label: '2. Fotos',
          description: 'Sube las fotos del especialista.',
          fields: [
            {
              name: 'foto',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Foto principal (grande)',
              admin: {
                description: 'Foto grande y de buena calidad (vertical o cuadrada). Se usa en el panel morado principal.',
              },
            },
            {
              name: 'foto_circular',
              type: 'upload',
              relationTo: 'media',
              required: false,
              label: 'Foto circular (para el carrusel)',
              admin: {
                description: 'FOTO QUE SE VE EN EL CARRUSEL de la p\u00E1gina de inicio. Debe ser circular o cuadrada, con la cara centrada.',
              },
            },
          ],
        },
        {
          label: '3. Presentaci\u00F3n',
          description: 'Textos que aparecen en la web.',
          fields: [
            {
              name: 'frase',
              type: 'text',
              label: 'Frase personal',
              admin: {
                placeholder: 'Ej: Aprender puede ser divertido.',
                description: 'Frase corta que aparece grande sobre el recuadro morado.',
              },
            },
            {
              name: 'bio',
              type: 'textarea',
              label: 'Biograf\u00EDa corta',
              admin: {
                placeholder:
                  'Ej: Psicopedagoga con m\u00E1s de 14 a\u00F1os acompa\u00F1ando a ni\u00F1os y adolescentes en su proceso de aprendizaje.',
                description: 'Un p\u00E1rrafo de 3 a 5 l\u00EDneas. Aparece debajo de la frase.',
              },
            },
            {
              name: 'especialidades',
              type: 'array',
              label: 'Especialidades e iconos',
              maxRows: 3,
              labels: { singular: 'Especialidad', plural: 'Especialidades' },
              admin: {
                description:
                  'Hasta 3 especialidades. Cada una lleva un texto Y un icono. El icono se muestra arriba del texto en el recuadro morado.',
                initCollapsed: false,
              },
              fields: [
                {
                  name: 'texto',
                  type: 'text',
                  required: true,
                  label: 'Texto',
                  admin: { placeholder: 'Ej: Emocional y Conductual' },
                },
                {
                  name: 'icono',
                  type: 'select',
                  label: 'Icono',
                  required: false,
                  defaultValue: 'nino',
                  options: [
                    { label: 'Ni\u00F1o/a', value: 'nino' },
                    { label: 'Cerebro', value: 'cerebro' },
                    { label: 'Calendario', value: 'calendario' },
                    { label: 'Coraz\u00F3n', value: 'corazon' },
                    { label: 'Libro', value: 'libro' },
                    { label: 'L\u00E1piz', value: 'lapiz' },
                    { label: 'Burbuja (lenguaje)', value: 'burbuja' },
                    { label: 'Mano', value: 'mano' },
                    { label: 'Video (online)', value: 'video' },
                    { label: 'Estrella', value: 'estrella' },
                  ],
                  admin: {
                    description: 'Elige el icono que acompa\u00F1a este texto.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: '4. Configuraci\u00F3n avanzada',
          description: 'Opciones t\u00E9cnicas. Normalmente no necesitas tocar nada aqu\u00ED.',
          fields: [
            {
              name: 'nfc_id',
              type: 'text',
              label: 'C\u00F3digo NFC',
              admin: {
                placeholder: 'Ej: NFC-JESSICA-001',
                description: 'Opcional. Se usa para identificar la tarjeta f\u00EDsica NFC.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL amigable (slug)',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Se genera autom\u00E1ticamente a partir del nombre.',
      },
    },
    {
      name: 'orden',
      type: 'number',
      label: 'Orden',
      defaultValue: 10,
      admin: { position: 'sidebar', description: 'N\u00FAmero menor = aparece primero en el carrusel.' },
    },
    {
      name: 'activo',
      type: 'checkbox',
      label: 'Mostrar en la web',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Si lo desmarcas, no aparece en la web p\u00FAblica.' },
    },
  ],
}