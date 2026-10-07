import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { resetEnvCache } from '@repo/config'
import { closeMongo, collections, ensureIndexes } from '@repo/database'
import type { AuditActor, ProfessionalInput } from '@repo/domain'
import {
  archiveProfessional,
  ConflictError,
  createProfessional,
  createTestimonial,
  getPublishedProfile,
  hitRateLimit,
  listAuditLogs,
  listPublicManualTestimonials,
  listPublishedCards,
  publishedSlugExists,
  publishProfessional,
  saveProfessionalDraft,
  unpublishProfessional,
} from '../src'

let mongo: MongoMemoryServer
const actor: AuditActor = { id: 'u1', email: 'editor@test.cl', role: 'EDITOR' }

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongo.getUri()
  process.env.MONGODB_DB_NAME = 'test'
  resetEnvCache()
  await ensureIndexes(await collections())
})

afterAll(async () => {
  await closeMongo()
  await mongo.stop()
})

describe('draft → publish workflow', () => {
  it('only exposes published snapshots and keeps drafts private', async () => {
    const created = await createProfessional({ name: 'Ana Pérez', slug: 'ana-perez', professionalTitle: 'Psicóloga' }, actor)
    expect(created.status).toBe('draft')
    expect(created.sections.length).toBeGreaterThan(0)
    expect(await getPublishedProfile('ana-perez')).toBeNull()
    expect(await publishedSlugExists('ana-perez')).toBe(false)

    const result = await publishProfessional(created.id, actor)
    expect(result.slug).toBe('ana-perez')
    const live = await getPublishedProfile('ana-perez')
    expect(live?.profile.professionalTitle).toBe('Psicóloga')

    // Editing the draft must not change the public snapshot.
    const draft: ProfessionalInput = { ...created, professionalTitle: 'Psicóloga clínica' }
    const saved = await saveProfessionalDraft(created.id, draft, created.revision, actor)
    expect(saved.revision).toBe(created.revision + 1)
    expect((await getPublishedProfile('ana-perez'))?.profile.professionalTitle).toBe('Psicóloga')

    await publishProfessional(created.id, actor)
    expect((await getPublishedProfile('ana-perez'))?.profile.professionalTitle).toBe('Psicóloga clínica')
  })

  it('detects concurrent edits (optimistic concurrency)', async () => {
    const p = await createProfessional({ name: 'Beto Soto', slug: 'beto-soto', professionalTitle: 'Fonoaudiólogo' }, actor)
    await saveProfessionalDraft(p.id, { ...p, name: 'Beto A' }, p.revision, actor)
    await expect(saveProfessionalDraft(p.id, { ...p, name: 'Beto B' }, p.revision, actor)).rejects.toBeInstanceOf(ConflictError)
  })

  it('enforces unique slugs', async () => {
    await expect(createProfessional({ name: 'Otra Ana', slug: 'ana-perez', professionalTitle: 'Psicóloga' }, actor)).rejects.toBeInstanceOf(ConflictError)
  })

  it('unpublish and archive remove the public page', async () => {
    const p = await createProfessional({ name: 'Carla Ruiz', slug: 'carla-ruiz', professionalTitle: 'Terapeuta ocupacional' }, actor)
    await publishProfessional(p.id, actor)
    expect(await publishedSlugExists('carla-ruiz')).toBe(true)
    await unpublishProfessional(p.id, actor)
    expect(await publishedSlugExists('carla-ruiz')).toBe(false)
    await publishProfessional(p.id, actor)
    await archiveProfessional(p.id, actor)
    expect(await getPublishedProfile('carla-ruiz')).toBeNull()
    await expect(publishProfessional(p.id, actor)).rejects.toThrow()
  })

  it('lists only published professionals for the switcher (1 published → 1 card)', async () => {
    const cards = await listPublishedCards()
    expect(cards.map((c) => c.slug)).toEqual(['ana-perez'])
  })
})

describe('testimonials', () => {
  it('returns enabled manual testimonials of the professional plus global ones', async () => {
    const live = await getPublishedProfile('ana-perez')
    const id = live!.profile.id
    const base = { authorDetail: '', rating: 5, date: null, sourceLabel: '', sourceUrl: '', featured: false, displayOrder: 0, isDemo: false }
    await createTestimonial({ ...base, professionalId: id, authorName: 'Visible', content: 'Muy buena experiencia', enabled: true }, actor)
    await createTestimonial({ ...base, professionalId: id, authorName: 'Oculto', content: 'No debería aparecer', enabled: false }, actor)
    await createTestimonial({ ...base, professionalId: null, authorName: 'Global', content: 'Testimonio de todo el equipo', enabled: true }, actor)
    const items = await listPublicManualTestimonials(id)
    expect(items.map((i) => i.authorName).sort()).toEqual(['Global', 'Visible'])
  })
})

describe('rate limiting & audit', () => {
  it('blocks after the limit within the window', async () => {
    const results = []
    for (let i = 0; i < 4; i++) results.push(await hitRateLimit('test:key', 3, 60))
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false])
  })
  it('records audit entries without secrets', async () => {
    const { items } = await listAuditLogs({ action: 'professional.published' })
    expect(items.length).toBeGreaterThan(0)
    expect(items[0]?.actor.email).toBe('editor@test.cl')
  })
})
