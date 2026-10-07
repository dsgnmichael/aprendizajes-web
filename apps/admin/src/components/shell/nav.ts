import type { Permission } from '@repo/domain'

export interface NavItem {
  href: string
  label: string
  icon:
    | 'dashboard'
    | 'homePage'
    | 'professionals'
    | 'testimonials'
    | 'appointments'
    | 'integrations'
    | 'media'
    | 'settings'
    | 'users'
    | 'audit'
  permission: Permission
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: 'dashboard', permission: 'dashboard:read' },
  {
    href: '/home-page',
    label: 'Página de inicio',
    icon: 'homePage',
    permission: 'landing:write',
  },
  {
    href: '/professionals',
    label: 'Profesionales',
    icon: 'professionals',
    permission: 'professionals:read',
  },
  {
    href: '/testimonials',
    label: 'Testimonios',
    icon: 'testimonials',
    permission: 'testimonials:write',
  },
  {
    href: '/appointments',
    label: 'Solicitudes',
    icon: 'appointments',
    permission: 'appointments:read',
  },
  {
    href: '/integrations',
    label: 'Integraciones',
    icon: 'integrations',
    permission: 'integrations:configure',
  },
  { href: '/media', label: 'Media', icon: 'media', permission: 'media:write' },
  { href: '/settings', label: 'Configuración', icon: 'settings', permission: 'settings:write' },
  { href: '/users', label: 'Usuarios', icon: 'users', permission: 'users:manage' },
  { href: '/audit', label: 'Auditoría', icon: 'audit', permission: 'audit:read' },
]
