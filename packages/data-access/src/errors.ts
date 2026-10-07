export class NotFoundError extends Error {
  override name = 'NotFoundError'
}

/** Unique constraint or optimistic concurrency conflicts. */
export class ConflictError extends Error {
  override name = 'ConflictError'
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message)
  }
}

export class DomainRuleError extends Error {
  override name = 'DomainRuleError'
}

export function isDuplicateKeyError(error: unknown): error is { code: 11000; keyPattern?: Record<string, unknown> } {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000
}
