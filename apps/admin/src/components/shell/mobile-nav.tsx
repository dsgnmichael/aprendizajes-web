'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@repo/ui/components/sheet'
import type { NavItem } from './nav'
import { NavLinks } from './sidebar'

export function MobileNav({
  items,
  badges,
}: {
  items: NavItem[]
  badges?: Partial<Record<string, number>>
}) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-sidebar p-4">
        <SheetTitle className="mb-2 px-2 text-sm">Aprendizajess · Backoffice</SheetTitle>
        <NavLinks items={items} badges={badges} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
