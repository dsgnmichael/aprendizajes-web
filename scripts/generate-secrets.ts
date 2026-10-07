/** Prints fresh random values for the secret environment variables. */
import { randomBytes } from 'node:crypto'

const b64 = (n: number) => randomBytes(n).toString('base64url')

console.info(`AUTH_SECRET=${b64(32)}`)
console.info(`REVALIDATION_SECRET=${b64(32)}`)
console.info(`PREVIEW_SECRET=${b64(32)}`)
console.info(`INTEGRATION_ENCRYPTION_KEY=${randomBytes(32).toString('base64')}`)
console.info(`CRON_SECRET=${b64(24)}`)
