import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  const payload = await getPayload({ config })
  
  const { docs: especialistas } = await payload.find({
    collection: 'especialistas',
    where: { activo: { equals: true } },
    sort: 'orden',
    limit: 50,
  })

  const { docs: testimonios } = await payload.find({
    collection: 'testimonios',
    where: { publicado: { equals: true } },
    sort: '-fecha',
    limit: 20,
  })

  return <HomeClient especialistas={especialistas as any} testimonios={testimonios as any} />
}