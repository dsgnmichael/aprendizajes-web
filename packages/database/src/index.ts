export { ObjectId } from 'mongodb'
export * from './client'
export * from './collections'
export * from './indexes'
export type * from './models'

import { ObjectId } from 'mongodb'

/** Parses a hex id; returns null instead of throwing on malformed input. */
export function toObjectId(id: string | null | undefined): ObjectId | null {
  if (!id || !ObjectId.isValid(id) || !/^[a-f0-9]{24}$/i.test(id)) return null
  return new ObjectId(id)
}
