import { closeMongo, collections, ensureIndexes } from '@repo/database'

await ensureIndexes(await collections())
console.info('Indexes ensured.')
await closeMongo()
