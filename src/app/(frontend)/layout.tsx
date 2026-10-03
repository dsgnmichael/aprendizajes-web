import React from 'react'
import './styles.css'
import Header from '@/components/Header'

export const metadata = {
  description: 'Consultorio integral: psicopedagogia, psicologia, terapia ocupacional, lenguaje y tareas dirigidas.',
  title: 'Aprendizajes | Consultorio Integral',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es">
      <body className="bg-cream text-ink font-sans antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}