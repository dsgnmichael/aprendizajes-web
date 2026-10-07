import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  breadcrumbs?: { href?: string; label: string }[]
  actions?: React.ReactNode
}) {
  return (
    <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Ruta"
            className="text-muted-foreground mb-1.5 flex items-center gap-1 text-xs"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3" aria-hidden />}
                {crumb.href ? (
                  <Link className="hover:text-foreground" href={crumb.href}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {title && <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>}
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
