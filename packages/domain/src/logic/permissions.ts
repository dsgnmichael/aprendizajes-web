import type { Role } from '../constants'

export const PERMISSIONS = [
  'dashboard:read',
  'professionals:read',
  'professionals:write',
  'professionals:publish',
  'professionals:archive',
  'professionals:delete',
  'testimonials:write',
  'landing:write',
  'landing:publish',
  'appointments:read',
  'appointments:write',
  'media:write',
  'settings:write',
  'integrations:configure',
  'integrations:connect',
  'users:manage',
  'audit:read',
] as const
export type Permission = (typeof PERMISSIONS)[number]

const EDITOR: Permission[] = [
  'dashboard:read',
  'professionals:read',
  'professionals:write',
  'professionals:publish',
  'testimonials:write',
  'landing:write',
  'landing:publish',
  'appointments:read',
  'appointments:write',
  'media:write',
]

const ADMIN: Permission[] = [
  ...EDITOR,
  'professionals:archive',
  'professionals:delete',
  'settings:write',
  'integrations:configure',
  'audit:read',
]

/**
 * Role → permission matrix.
 * - SUPER_ADMIN: everything.
 * - ADMIN: everything except security-critical operations (user management
 *   and connecting/disconnecting OAuth integrations).
 * - EDITOR: content only (professionals, testimonials, media, appointments).
 */
export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set(PERMISSIONS),
  ADMIN: new Set(ADMIN),
  EDITOR: new Set(EDITOR),
}

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
}
