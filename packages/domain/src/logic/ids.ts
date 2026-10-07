const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Short random id for embedded items (sections, services…). Not security-sensitive. */
export function shortId(prefix = '', length = 8): string {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  let id = ''
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length]
  return prefix ? `${prefix}_${id}` : id
}
