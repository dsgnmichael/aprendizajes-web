import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const REVIEWS = [
  {
    nombre: 'dariana lamadrid',
    calificacion: 5,
    texto: 'Excelentes profesionales dedicacion al 100% a la educacion de los ninos',
    fecha: '2026-09-04',
  },
  {
    nombre: 'Maria Fernanda Guevara',
    calificacion: 5,
    texto: 'Excelente profesionales... 100% recomendados',
    fecha: '2026-09-04',
  },
  {
    nombre: 'Karen Duarte',
    calificacion: 5,
    texto: 'Excelente atencion para los ninos, mucha paciencia, mucho amor, mucha constancia y motivacion con ellos de verdad que los vamos a extranar mucho. Dios los bendiga profes un abrazo grande...',
    fecha: '2026-09-04',
  },
  {
    nombre: 'Orangyali Tamayo',
    calificacion: 5,
    texto: 'Excelentes profesionales, la atencion a los ninos es maravillosa por un equipo de trabajo multidisciplinario que sin dudas nos ayudan a los padres en lo que necesiten nuestros hijos, refuerzo pedagogico, psicologia, psicopedagogia, tareas...',
    fecha: '2026-09-20',
  },
  {
    nombre: 'Rosa Rondon',
    calificacion: 5,
    texto: 'Tenemos 4 anos de apoyo con psicopedagogia y nos ha ido maravilloso. Jessica ha trabajado con mis dos hijos y como familia recomendamos su consultorio y a todo su equipo. Estamos muy agradecidos',
    fecha: '2026-09-20',
  },
  {
    nombre: 'katherine de sousa',
    calificacion: 5,
    texto: 'Extraordinaria atencion profesional, instalaciones optimas y una calidad humana de su personal increible.',
    fecha: '2026-09-20',
  },
  {
    nombre: 'Joselyn Guillen',
    calificacion: 5,
    texto: 'Jessica para nuestra familia fue una bendicion que apoyaras desde hace 7 anos con la educacion de nuestra hija y contar con tu apoyo y opinion profesional. Siempre agradecida. Familia Villafran Guillen',
    fecha: '2026-09-20',
  },
  {
    nombre: 'Ana Karina Armengol',
    calificacion: 5,
    texto: 'Excelente equipo, profesionales, empaticos y dedicados a cada nino. Mi hijo me comento que lo hacen sentir muy comodo y aprende divirtiendose',
    fecha: '2026-09-20',
  },
  {
    nombre: 'Jean Carlos Lopez Pittaluga',
    calificacion: 5,
    texto: 'Excelente son muy buenos',
    fecha: '2026-09-20',
  },
  {
    nombre: 'Hanoi Resplandor Farrera',
    calificacion: 5,
    texto: 'Excelente servicio y atencion para los peques.',
    fecha: '2026-10-02',
  },
  {
    nombre: 'Carla Vieira',
    calificacion: 5,
    texto: 'Son excelentes, atentos, comprometidos, responsables y siempre dispuestos a dar respuesta efectiva a nuestros requerimientos',
    fecha: '2026-09-20',
  },
  {
    nombre: 'Jesus Montilla',
    calificacion: 5,
    texto: '100000% Recomendados nos hacen sentir que somos parte de su Familia, aparte que son Excelentes Responsables y muy Diligentes',
    fecha: '2026-09-20',
  },
  {
    nombre: 'Francisco Pineda',
    calificacion: 5,
    texto: 'Excelente centro de educacion! Desde la direccion hasta las profesoras',
    fecha: '2026-09-04',
  },
  {
    nombre: 'NATHALY GRUBER',
    calificacion: 5,
    texto: 'Lo mejor que le puede haber pasado a mis hijos es su experiencia Aprendizajess 100% recomendado',
    fecha: '2026-09-04',
  },
  {
    nombre: 'Jose Luis Rojas',
    calificacion: 5,
    texto: 'Excelentes maestras, atencion personalizada y muy profesionales, los recomiendo 100%',
    fecha: '2023-10-04',
  },
  {
    nombre: 'maytte marcano',
    calificacion: 5,
    texto: 'Nuestra experiencia ha sido fabulosa, en Jess y su equipo encontramos una experiencia de amor, de acompanamiento y orientacion, son un grupo muy profesional, divertido y empatico, los recomendamos ampliamente.',
    fecha: '2026-09-04',
  },
  {
    nombre: 'Edwin Perez',
    calificacion: 5,
    texto: 'Excelentes instalaciones, personal calificado y profesional. Con alto profesionalismo en su desempeno...',
    fecha: '2026-04-04',
  },
  {
    nombre: 'Rosanna Di Rocco',
    calificacion: 5,
    texto: 'Excelente centro integral de atencion para los ninos. Areas de psicopedagogia como psicologia super recomendadas!!!!',
    fecha: '2026-09-13',
  },
  {
    nombre: 'Lisette Ramirez',
    calificacion: 5,
    texto: 'Superagradecida con el equipo de Aprendizajess. Lleve a mis morochos a terapia de lenguaje y atencion psicopedagogica, y los avances han sido excelentes. El trato es profesional, humano y con mucha paciencia. Sin duda, un espacio 100% recomendado para el desarrollo de los ninos.',
    fecha: '2026-09-04',
  },
  {
    nombre: 'Alessandra Fabi',
    calificacion: 5,
    texto: 'El personal es excepcional, siempre con una sonrisa y un trato amable. Las instalaciones muy bellas y comodas. Los ninos son felices en su lugar seguro...',
    fecha: '2026-09-04',
  },
]

async function importReviews() {
  console.log('Iniciando carga de resenas...')
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const review of REVIEWS) {
    try {
      const existing = await payload.find({
        collection: 'testimonios',
        where: { nombre: { equals: review.nombre } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log('Ya existe: ' + review.nombre)
        skipped++
        continue
      }

      await payload.create({
        collection: 'testimonios',
        data: {
          nombre: review.nombre,
          texto: review.texto,
          calificacion: review.calificacion,
          fecha: new Date(review.fecha).toISOString(),
          publicado: true,
        },
      })
      console.log('OK: ' + review.nombre)
      created++
    } catch (error) {
      console.error('Error con ' + review.nombre + ':', error)
    }
  }

  console.log('---')
  console.log('Creados: ' + created)
  console.log('Omitidos (ya existian): ' + skipped)
  console.log('Proceso completado.')
  process.exit(0)
}

importReviews().catch((err) => {
  console.error(err)
  process.exit(1)
})