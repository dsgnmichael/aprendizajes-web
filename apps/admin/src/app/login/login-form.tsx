'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

const ERRORS: Record<string, string> = {
  CredentialsSignin: 'Email o contraseña incorrectos.',
  RateLimited: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
}

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl: string
  initialError?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(
    initialError ? (ERRORS[initialError] ?? 'No se pudo iniciar sesión.') : null,
  )

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await signIn('credentials', {
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
        redirect: false,
      })
      if (!result || result.error) {
        setError(ERRORS[result?.error ?? ''] ?? ERRORS.CredentialsSignin ?? null)
        return
      }
      router.replace(callbackUrl)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Ingresar
      </Button>
    </form>
  )
}
