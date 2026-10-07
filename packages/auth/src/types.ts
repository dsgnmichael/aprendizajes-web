import type { Role } from '@repo/domain'
import type { DefaultSession } from 'next-auth'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: SessionUser
  }
  interface User {
    id: string
    role: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string
    role?: Role
    /** Unix seconds when role/active status was last re-validated against the DB. */
    checkedAt?: number
  }
}
