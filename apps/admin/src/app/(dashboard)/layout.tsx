import { countAppointmentsByStatus } from '@repo/data-access'
import { can, ROLE_LABELS } from '@repo/domain'
import { requireUser } from '@/lib/auth'
import { initials } from '@/lib/format'
import { MobileNav } from '@/components/shell/mobile-nav'
import { NAV_ITEMS } from '@/components/shell/nav'
import { NavLinks } from '@/components/shell/sidebar'
import { UserMenu } from '@/components/shell/user-menu'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const items = NAV_ITEMS.filter((item) => can(user.role, item.permission))
  const counts = can(user.role, 'appointments:read') ? await countAppointmentsByStatus() : null
  const badges = counts?.new ? { '/appointments': counts.new } : undefined

  const userMenu = (
    <UserMenu
      name={user.name}
      email={user.email}
      roleLabel={ROLE_LABELS[user.role]}
      initials={initials(user.name || user.email)}
    />
  )

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[248px_1fr]">
      <aside className="border-sidebar-border bg-sidebar sticky top-0 hidden h-dvh flex-col border-r p-3 lg:flex">
        <div className="mb-5 flex items-center gap-2.5 px-2 pt-1">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-semibold">
            A
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Aprendizajes</p>
            <p className="text-muted-foreground text-xs">Backoffice</p>
          </div>
        </div>
        <NavLinks items={items} badges={badges} />
        <div className="border-sidebar-border mt-auto border-t pt-3">{userMenu}</div>
      </aside>
      <div className="min-w-0">
        <div className="bg-background/90 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur lg:hidden">
          <MobileNav items={items} badges={badges} />
          <span className="text-sm font-semibold">Aprendizajes</span>
          <div className="ml-auto w-44">{userMenu}</div>
        </div>
        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
