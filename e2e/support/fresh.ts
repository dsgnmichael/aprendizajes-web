import { expect, type APIRequestContext } from '@playwright/test'

/**
 * Waits until public pages render the expected data. After an on-demand
 * invalidation the first request regenerates the page; polling makes the
 * suite independent of regeneration timing and of the persistent on-disk
 * cache left by previous runs.
 */
export async function expectFresh(request: APIRequestContext, paths: string[], mustContain: string[]) {
  for (const path of paths) {
    await expect
      .poll(
        async () => {
          const html = await (await request.get(path, { headers: { 'cache-control': 'no-cache' } })).text()
          return mustContain.every((s) => html.includes(s))
        },
        { timeout: 20_000, intervals: [250, 500, 1000] },
      )
      .toBe(true)
  }
}
