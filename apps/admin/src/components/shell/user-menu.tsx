'use client'

import { signOut } from 'next-auth/react'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'

export function UserMenu({
  name,
  email,
  roleLabel,
  initials,
}: {
  name: string
  email: string
  roleLabel: string
  initials: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus-visible:ring-ring flex w-full items-center gap-2.5 rounded-md p-2 text-left outline-none hover:bg-black/[0.04] focus-visible:ring-2"
        aria-label="Menú de usuario"
      >
        <Avatar className="size-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name || email}</span>
          <span className="text-muted-foreground block truncate text-xs">{roleLabel}</span>
        </span>
        <ChevronsUpDown className="text-muted-foreground size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{name}</span>
          <span className="text-muted-foreground block text-xs">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/login' })}>
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
