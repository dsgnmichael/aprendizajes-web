export class ProviderError extends Error {
  override name = 'ProviderError'
  constructor(
    message: string,
    readonly status?: number,
    readonly reauthRequired = false,
  ) {
    super(message)
  }
}

export type FetchLike = typeof fetch

/** JSON fetch with timeout; error messages never include credentials. */
export async function fetchJson<T>(fetcher: FetchLike, url: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetcher(url, { ...init, cache: 'no-store', signal: init.signal ?? AbortSignal.timeout(8000) })
  } catch (error) {
    throw new ProviderError(`Network error (${error instanceof Error ? error.name : 'unknown'})`)
  }
  if (!response.ok) {
    let detail = ''
    try {
      const body = (await response.json()) as { error?: { status?: string; message?: string } | string }
      detail = typeof body.error === 'string' ? body.error : (body.error?.status ?? '')
    } catch {
      /* ignore */
    }
    throw new ProviderError(
      `Google API ${response.status}${detail ? ` ${detail}` : ''}`,
      response.status,
      response.status === 401 || detail === 'invalid_grant',
    )
  }
  return (await response.json()) as T
}
