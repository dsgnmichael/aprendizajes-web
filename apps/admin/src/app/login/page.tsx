import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { safeRedirectPath } from '@repo/domain'
import { getSession } from '@/lib/auth'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Iniciar sesión' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams
  const callbackUrl = safeRedirectPath(
    typeof params.callbackUrl === 'string' ? params.callbackUrl : '/',
    '/',
  )
  if (await getSession()) redirect(callbackUrl)
  const error = typeof params.error === 'string' ? params.error : undefined

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-lg text-sm font-semibold">
              A
            </span>
            <div>
              <p className="text-sm font-semibold">Aprendizajess</p>
              <p className="text-muted-foreground text-xs">Backoffice</p>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Inicia sesión</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Gestiona profesionales, páginas y solicitudes de cita.
          </p>
          <LoginForm callbackUrl={callbackUrl} initialError={error} />
          <p className="text-muted-foreground mt-8 text-xs">
            Acceso restringido. Las cuentas las crea un super admin.
          </p>
        </div>
      </section>
      <aside
        className="relative hidden overflow-hidden bg-[oklch(0.24_0.08_300)] lg:block"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,oklch(0.45_0.15_300/.6),transparent_55%),radial-gradient(circle_at_20%_80%,oklch(0.6_0.12_60/.25),transparent_50%)]" />
        <div className="absolute inset-x-12 bottom-12 text-white">
          <p className="max-w-md text-3xl leading-tight font-medium tracking-tight">
            Cada perfil es la primera conversación con una familia.
          </p>
          <p className="mt-3 text-sm text-white/70">
            Edita en borrador, revisa la vista previa y publica cuando esté listo.
          </p>
        </div>
      </aside>
    </main>
  )
}
