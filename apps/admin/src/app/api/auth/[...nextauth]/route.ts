import NextAuth from 'next-auth'
import { authOptions } from '@repo/auth'

type Handler = (req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>

// Built per request so env validation happens at runtime, not at build time.
const handler: Handler = (req, ctx) => (NextAuth(authOptions()) as Handler)(req, ctx)

export { handler as GET, handler as POST }
