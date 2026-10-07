'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

export interface FilterSelect {
  name: string
  label: string
  options: { value: string; label: string }[]
}

const ALL = '__all'

/** Search + selects synced to the URL query string (server pages read them). */
export function ListFilters({
  searchPlaceholder,
  selects = [],
}: {
  searchPlaceholder?: string
  selects?: FilterSelect[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(params.get('q') ?? '')

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '' || value === ALL) sp.delete(key)
      else sp.set(key, value)
    }
    sp.delete('page')
    startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ''}`))
  }

  useEffect(() => {
    if ((params.get('q') ?? '') === q) return
    const t = setTimeout(() => update({ q }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce only on input changes
  }, [q])

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      {searchPlaceholder && (
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
            aria-label={searchPlaceholder}
            type="search"
          />
        </div>
      )}
      {selects.map((select) => {
        const value = params.get(select.name) ?? ALL
        const current =
          select.options.find((o) => o.value === value)?.label ?? `${select.label}: todos`
        return (
          <Select
            key={select.name}
            value={value}
            onValueChange={(next) => update({ [select.name]: next })}
          >
            <SelectTrigger className="sm:w-56" aria-label={select.label}>
              <SelectValue placeholder={select.label}>{current}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{select.label}: todos</SelectItem>
              {select.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      })}
      {pending && (
        <Loader2 className="text-muted-foreground size-4 animate-spin" aria-label="Actualizando" />
      )}
    </div>
  )
}
