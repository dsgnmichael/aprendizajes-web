'use client'

import type { NavItem, SocialLinks as Social } from '@repo/domain'
import { Menu, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useState } from 'react'
import { SocialLinks } from '@/components/ui/SocialLinks'

/** Full-height mobile navigation (focus trapped, Esc to close). */
export function MobileMenu({ items, organizationName, social }: { items: NavItem[]; organizationName: string; social: Social }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="-mr-2 grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-brand-mist md:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={24} aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="fixed inset-0 z-[60] flex flex-col bg-brand text-on-brand data-[state=open]:animate-[fade-in_200ms_ease-out] md:hidden">
          <div className="flex h-[var(--header-h)] items-center justify-between px-4">
            <Dialog.Title className="script text-3xl text-brand-soft">{organizationName}</Dialog.Title>
            <Dialog.Close className="grid size-11 place-items-center rounded-full hover:bg-on-brand/10" aria-label="Cerrar menú">
              <X size={24} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Navegación principal</Dialog.Description>
          <nav aria-label="Principal" className="flex-1 overflow-y-auto px-6 pt-6">
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={item.id} className="motion-safe:animate-[rise_var(--dur-slow)_var(--ease-out)_both]" style={{ animationDelay: `${60 + i * 60}ms` }}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-14 items-center text-[2.2rem] leading-none font-black tracking-tight uppercase italic"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-4 pt-4 pb-[calc(1.5rem+var(--safe-bottom))]">
            <SocialLinks social={social} owner={organizationName} tone="onBrand" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
