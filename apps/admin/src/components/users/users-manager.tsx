'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { ROLE_LABELS, ROLES, userCreateSchema, type Role, type UserCreate } from '@repo/domain'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Switch } from '@repo/ui/components/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'
import { createUserAction, setUserActiveAction, setUserRoleAction } from '@/actions/users'
import { SelectField, TextField } from '@/components/editor/fields'
import { handleResult } from '@/components/use-action-toast'

export interface UserRow {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  lastLoginLabel: string
}

const ROLE_HELP: Record<Role, string> = {
  SUPER_ADMIN: 'Todo, incluida la seguridad (usuarios y conexión OAuth).',
  ADMIN:
    'Gestión general: contenido, configuración, integraciones (sin conectar OAuth) y auditoría.',
  EDITOR: 'Contenido: profesionales, testimonios, media y solicitudes.',
}

function CreateUserDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const form = useForm<UserCreate>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { name: '', email: '', role: 'EDITOR', password: '' },
  })
  const submit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await createUserAction(values)
      handleResult(result, 'Usuario creado')
      if (result.ok) {
        setOpen(false)
        form.reset()
        router.refresh()
      }
    }),
  )
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>Comparte la contraseña inicial por un canal seguro.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <TextField name="name" label="Nombre" />
            <TextField name="email" label="Email" type="email" />
            <SelectField
              name="role"
              label="Rol"
              options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
            />
            <TextField
              name="password"
              label="Contraseña inicial"
              type="password"
              help="Mínimo 12 caracteres, con letras y números."
            />
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}

export function UsersManager({
  users,
  currentUserId,
}: {
  users: UserRow[]
  currentUserId: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const run = (promise: ReturnType<typeof setUserRoleAction>, msg: string) =>
    startTransition(async () => {
      handleResult(await promise, msg)
      router.refresh()
    })

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ul className="text-muted-foreground space-y-1 text-xs">
          {ROLES.map((r) => (
            <li key={r}>
              <span className="text-foreground font-medium">{ROLE_LABELS[r]}:</span> {ROLE_HELP[r]}
            </li>
          ))}
        </ul>
        <CreateUserDialog />
      </div>
      <div className="bg-card overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden md:table-cell">Último acceso</TableHead>
              <TableHead className="text-right">Activo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <p className="font-medium">
                    {u.name} {u.id === currentUserId && <Badge variant="outline">Tú</Badge>}
                  </p>
                  <p className="text-muted-foreground text-xs">{u.email}</p>
                </TableCell>
                <TableCell>
                  <Select
                    value={u.role}
                    onValueChange={(role) => run(setUserRoleAction(u.id, role), 'Rol actualizado')}
                  >
                    <SelectTrigger className="w-40" aria-label={`Rol de ${u.email}`}>
                      <SelectValue>{ROLE_LABELS[u.role]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                  {u.lastLoginLabel}
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={u.active}
                    disabled={u.id === currentUserId}
                    onCheckedChange={(active) =>
                      run(
                        setUserActiveAction(u.id, active),
                        active ? 'Usuario activado' : 'Usuario desactivado',
                      )
                    }
                    aria-label={`Activo: ${u.email}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
