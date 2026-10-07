import { listUsers } from '@repo/data-access'
import { PageHeader } from '@/components/shell/page-header'
import { UsersManager } from '@/components/users/users-manager'
import { requirePermission } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'

export const metadata = { title: 'Usuarios' }

export default async function UsersPage() {
  const user = await requirePermission('users:manage')
  const users = await listUsers()
  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Acceso al backoffice. El sitio público no tiene login."
      />
      <UsersManager
        currentUserId={user.id}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active,
          lastLoginLabel: formatDateTime(u.lastLoginAt),
        }))}
      />
    </>
  )
}
