import { execFileSync } from 'node:child_process'
import { MongoClient } from 'mongodb'

/** Drops and re-seeds the isolated E2E database before the suite. */
export default async function globalSetup() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
  const dbName = process.env.MONGODB_DB_NAME ?? 'aprendizajess_e2e'
  if (!dbName.endsWith('_e2e')) throw new Error('Refusing to drop a non-E2E database')
  const client = await MongoClient.connect(uri)
  await client.db(dbName).dropDatabase()
  await client.close()
  execFileSync('pnpm', ['exec', 'tsx', 'scripts/seed.ts'], { stdio: 'inherit', env: process.env })
}
