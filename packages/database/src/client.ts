import { MongoClient, type Db } from 'mongodb'
import { env, requireEnv } from '@repo/config'

interface MongoCache {
  client?: MongoClient
  promise?: Promise<MongoClient>
}

// Reuse the connection across hot reloads and serverless invocations.
const globalForMongo = globalThis as typeof globalThis & { __mongo?: MongoCache }
const cache: MongoCache = (globalForMongo.__mongo ??= {})

export class DatabaseUnavailableError extends Error {
  override name = 'DatabaseUnavailableError'
}

export async function getMongoClient(): Promise<MongoClient> {
  if (cache.client) return cache.client
  if (!cache.promise) {
    const uri = requireEnv('MONGODB_URI', 'the database connection')
    const client = new MongoClient(uri, {
      appName: 'aprendizajess-platform',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })
    cache.promise = client
      .connect()
      .then((connected) => {
        cache.client = connected
        return connected
      })
      .catch((error: unknown) => {
        cache.promise = undefined
        // Never leak the connection string: only report the error class.
        throw new DatabaseUnavailableError(
          `Could not connect to MongoDB (${error instanceof Error ? error.name : 'unknown error'})`,
        )
      })
  }
  return cache.promise
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient()
  return client.db(env().MONGODB_DB_NAME)
}

export async function closeMongo(): Promise<void> {
  const client = cache.client ?? (cache.promise ? await cache.promise.catch(() => undefined) : undefined)
  cache.client = undefined
  cache.promise = undefined
  await client?.close()
}
