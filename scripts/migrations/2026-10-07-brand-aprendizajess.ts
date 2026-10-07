/**
 * Data migration: brand name "Aprendizajes" → "Aprendizajess".
 *
 *   pnpm db:migrate:brand            # dry run: reports what would change
 *   pnpm db:migrate:brand --apply    # writes the changes
 *
 * Idempotent. Only string values are rewritten, only whole-word, capitalised
 * "Aprendizajes" not already followed by "s" and not part of a URL path.
 * Published revision history (profileRevisions / homePageRevisions) is left
 * untouched on purpose: it is an audit trail of what was published.
 * Users, credentials and integrations are never read or modified.
 */
import { closeMongo, collections } from '@repo/database'
import type { Document } from 'mongodb'

const apply = process.argv.includes('--apply')
const PATTERN = /(?<![\w/])Aprendizajes(?!s)/g

function rewrite(value: unknown): { value: unknown; changes: number } {
  if (typeof value === 'string') {
    const matches = value.match(PATTERN)?.length ?? 0
    return { value: matches ? value.replace(PATTERN, 'Aprendizajess') : value, changes: matches }
  }
  if (Array.isArray(value)) {
    let changes = 0
    const out = value.map((v) => {
      const r = rewrite(v)
      changes += r.changes
      return r.value
    })
    return { value: out, changes }
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && value.constructor === Object) {
    let changes = 0
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      const r = rewrite(v)
      changes += r.changes
      out[k] = r.value
    }
    return { value: out, changes }
  }
  return { value, changes: 0 }
}

async function main() {
  const c = await collections()
  const targets: { name: string; fields: string[]; coll: { find: () => { toArray: () => Promise<Document[]> }; updateOne: (f: Document, u: Document) => Promise<unknown> } }[] = [
    { name: 'siteSettings', fields: ['organizationName', 'tagline', 'logo', 'favicon', 'footer', 'copy', 'seo', 'organization', 'navigation'], coll: c.siteSettings as never },
    { name: 'homePage', fields: ['draft', 'published'], coll: c.homePage as never },
    { name: 'professionals', fields: ['name', 'professionalTitle', 'scriptTitle', 'credentials', 'shortDescription', 'biography', 'images', 'specialties', 'targetAudience', 'modalities', 'services', 'location', 'appointment', 'seo', 'sections'], coll: c.professionals as never },
    { name: 'publishedProfiles', fields: ['profile'], coll: c.publishedProfiles as never },
    { name: 'testimonials', fields: ['authorName', 'authorDetail', 'content', 'sourceLabel'], coll: c.testimonials as never },
    { name: 'media', fields: ['alt'], coll: c.media as never },
  ]
  let total = 0
  for (const t of targets) {
    const docs = await t.coll.find().toArray()
    for (const doc of docs) {
      const set: Record<string, unknown> = {}
      let changes = 0
      for (const field of t.fields) {
        if (!(field in doc)) continue
        const r = rewrite(doc[field])
        if (r.changes) {
          set[field] = r.value
          changes += r.changes
        }
      }
      if (!changes) continue
      total += changes
      console.info(`${apply ? 'update' : 'would update'} ${t.name} ${String(doc._id)}: ${changes} occurrence(s) in ${Object.keys(set).join(', ')}`)
      if (apply) await t.coll.updateOne({ _id: doc._id }, { $set: set })
    }
  }
  console.info(`${total} occurrence(s) ${apply ? 'updated' : 'found (dry run, use --apply to write)'}.`)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => closeMongo())
