import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@repo/ui/components/button'

export function Pagination({
  page,
  pageSize,
  total,
  params,
  basePath,
}: {
  page: number
  pageSize: number
  total: number
  params: Record<string, string | undefined>
  basePath: string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  const href = (p: number) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v)
    sp.set('page', String(p))
    return `${basePath}?${sp}`
  }
  return (
    <nav
      aria-label="Paginación"
      className="text-muted-foreground mt-4 flex items-center justify-between text-sm"
    >
      <span>
        {total} resultados · página {page} de {pages}
      </span>
      <div className="flex gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          aria-disabled={page <= 1}
          className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
        >
          <Link href={href(page - 1)}>
            <ChevronLeft /> Anterior
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          aria-disabled={page >= pages}
          className={page >= pages ? 'pointer-events-none opacity-50' : undefined}
        >
          <Link href={href(page + 1)}>
            Siguiente <ChevronRight />
          </Link>
        </Button>
      </div>
    </nav>
  )
}
