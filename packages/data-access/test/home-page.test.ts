import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { resetEnvCache } from '@repo/config'
import { closeMongo, collections, ensureIndexes } from '@repo/database'
import type { AuditActor } from '@repo/domain'
import {
  ConflictError,
  getHomePageDraft,
  getPublishedHomePage,
  listHomePageRevisions,
  publishHomePage,
  restoreHomePageRevision,
  saveHomePageDraft,
} from '../src'

let mongo: MongoMemoryServer
const actor: AuditActor = { id: 'u1', email: 'editor@test.cl', role: 'EDITOR' }

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongo.getUri()
  process.env.MONGODB_DB_NAME = 'home'
  resetEnvCache()
  await ensureIndexes(await collections())
})
afterAll(async () => {
  await closeMongo()
  await mongo.stop()
})

const heroTitle = (page: { sections: { type: string; content: unknown }[] }) =>
  (page.sections.find((s) => s.type === 'landingHero')?.content as { title: string }).title

describe('home page draft → publish', () => {
  it('starts with a default draft and nothing published', async () => {
    const draft = await getHomePageDraft()
    expect(draft.revision).toBe(0)
    expect(draft.sections.length).toBeGreaterThan(5)
    expect(await getPublishedHomePage()).toBeNull()
  })

  it('keeps the public page unchanged until publishing', async () => {
    const draft = await getHomePageDraft()
    const withTitle = (title: string) => ({
      ...draft,
      sections: draft.sections.map((s) => (s.type === 'landingHero' ? { ...s, content: { ...s.content, title } } : s)),
    })
    const v1 = await saveHomePageDraft(withTitle('Primera versión'), 0, actor)
    await publishHomePage(actor)
    expect(heroTitle((await getPublishedHomePage())!)).toBe('Primera versión')

    const v2 = await saveHomePageDraft(withTitle('Segunda versión'), v1.revision, actor)
    expect(heroTitle((await getPublishedHomePage())!)).toBe('Primera versión')
    await expect(saveHomePageDraft(withTitle('Conflicto'), v1.revision, actor)).rejects.toBeInstanceOf(ConflictError)

    await publishHomePage(actor)
    expect(heroTitle((await getPublishedHomePage())!)).toBe('Segunda versión')
    expect((await listHomePageRevisions()).map((r) => r.revision)).toEqual([2, 1])

    const restored = await restoreHomePageRevision(1, v2.revision, actor)
    expect(heroTitle(restored)).toBe('Primera versión')
    expect(heroTitle((await getPublishedHomePage())!)).toBe('Segunda versión')
  })
})
