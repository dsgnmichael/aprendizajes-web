import { ZodError } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions, type SessionUser } from '@repo/auth'
import { ConflictError, DomainRuleError, NotFoundError } from '@repo/data-access'
import { can, type Permission } from '@repo/domain'
import { ProviderError } from '@repo/integrations/google'
import { MediaValidationError } from '@repo/integrations/media'

export type ActionResult<T = undefined> =
  | { ok: true; data: T; warning?: string }
  | { ok: false; error: string; field?: string }

export class ActionError extends Error {
  override name = 'ActionError'
}

/** Return value for actions that succeeded with a non-fatal warning. */
export class WithWarning<T> {
  constructor(
    readonly data: T,
    readonly warning?: string,
  ) {}
}

/**
 * Wraps every server action: re-checks the session and permission on the
 * server (never trust the UI), and maps known errors to safe messages. Unknown
 * errors are logged server-side and returned as a generic message.
 */
export async function runAction<T>(
  permission: Permission,
  fn: (user: SessionUser) => Promise<T | WithWarning<T>>,
): Promise<ActionResult<T>> {
  const session = await getServerSession(authOptions())
  const user = session?.user
  if (!user?.id) return { ok: false, error: 'Tu sesión expiró. Vuelve a iniciar sesión.' }
  if (!can(user.role, permission))
    return { ok: false, error: 'No tienes permisos para esta acción.' }
  try {
    const result = await fn(user)
    if (result instanceof WithWarning)
      return { ok: true, data: result.data, warning: result.warning }
    return { ok: true, data: result }
  } catch (error) {
    return toActionError(error)
  }
}

export function toActionError(error: unknown): { ok: false; error: string; field?: string } {
  if (error instanceof ConflictError) return { ok: false, error: error.message, field: error.field }
  if (
    error instanceof NotFoundError ||
    error instanceof DomainRuleError ||
    error instanceof ActionError
  ) {
    return { ok: false, error: error.message }
  }
  if (error instanceof MediaValidationError) return { ok: false, error: error.message }
  if (error instanceof ProviderError) {
    return {
      ok: false,
      error: error.reauthRequired
        ? 'La autorización de Google expiró. Vuelve a conectar.'
        : `Google respondió con un error (${error.message}).`,
    }
  }
  if (error instanceof ZodError) {
    const issue = error.issues[0]
    return {
      ok: false,
      error: issue ? `${issue.path.join('.') || 'Datos'}: ${issue.message}` : 'Datos inválidos',
      field: issue?.path.join('.'),
    }
  }
  console.error(
    '[admin action]',
    error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error',
  )
  return { ok: false, error: 'Ocurrió un error inesperado. Intenta nuevamente.' }
}
