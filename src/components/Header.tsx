'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/equipo', label: 'Equipo' },
  { href: '/contacto', label: 'Contactos' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

        <nav className="hidden md:flex items-center gap-8 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-ink hover:text-purple-dark transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="/" className="flex items-center justify-center shrink-0">
          <Image
            src="/img/logo_aprendizajess.png"
            alt="Aprendizajes"
            width={130}
            height={50}
            className="h-12 w-auto"
            priority
          />
        </Link>

        <div className="hidden md:flex flex-1 justify-end">
          <Link
            href="/admin"
            className="rounded-full border border-ink px-5 py-1.5 text-sm font-semibold text-ink hover:bg-ink hover:text-cream transition-colors"
          >
            Login
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2"
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-neutral-200 bg-cream">
          <nav className="flex flex-col p-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-base font-bold text-ink"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="rounded-full border border-ink px-5 py-2 text-center text-sm font-semibold text-ink"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}