'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarClock,
  Image as ImageIcon,
  LayoutDashboard,
  PanelsTopLeft,
  MessageSquareQuote,
  PlugZap,
  ScrollText,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import type { NavItem } from './nav'

const ICONS = {
  dashboard: LayoutDashboard,
  homePage: PanelsTopLeft,
  professionals: UsersRound,
  testimonials: MessageSquareQuote,
  appointments: CalendarClock,
  integrations: PlugZap,
  media: ImageIcon,
  settings: Settings2,
  users: ShieldCheck,
  audit: ScrollText,
} as const

export function NavLinks({
  items,
  badges,
  onNavigate,
}: {
  items: NavItem[]
  badges?: Partial<Record<string, number>>
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon]
        const active =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const badge = badges?.[item.href]
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group text-sidebar-foreground/80 hover:text-sidebar-foreground flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors hover:bg-black/[0.04]',
              active && 'bg-card text-foreground ring-border font-medium shadow-xs ring-1',
            )}
          >
            <Icon
              className={cn('text-muted-foreground size-4', active && 'text-primary')}
              aria-hidden
            />
            <span className="flex-1">{item.label}</span>
            {badge ? (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[11px] leading-5 font-medium">
                {badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
