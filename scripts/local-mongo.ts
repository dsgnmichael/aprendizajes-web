/**
 * Zero-install local MongoDB for development and E2E tests.
 * Uses mongodb-memory-server's binary with a PERSISTENT data dir (.mongo-data)
 * so data survives restarts. For production use MongoDB Atlas.
 *
 *   pnpm db:local            # mongodb://127.0.0.1:27017
 *   MONGO_PORT=27018 pnpm db:local
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { MongoMemoryServer } from 'mongodb-memory-server'

const port = Number(process.env.MONGO_PORT ?? 27017)
const dbPath = path.resolve(process.env.MONGO_DATA_DIR ?? '.mongo-data')
mkdirSync(dbPath, { recursive: true })

const server = await MongoMemoryServer.create({
  instance: { port, dbPath, storageEngine: 'wiredTiger', ip: '127.0.0.1' },
})

console.info(`MongoDB ready at ${server.getUri()} (data: ${dbPath})`)
console.info('Press Ctrl+C to stop.')

const stop = async () => {
  await server.stop({ doCleanup: false })
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
