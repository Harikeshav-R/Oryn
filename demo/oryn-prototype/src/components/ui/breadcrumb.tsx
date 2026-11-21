import { Fragment, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

/**
 * CMP-12 breadcrumb: mono 12/18, slash separators, ancestors are links (Enter navigates),
 * the current page is plain text with `aria-current="page"` and is never a link. Separators
 * are decorative. A breadcrumb is navigation only: it is never a role or authority switch.
 */
export interface Crumb {
  label: string
  /** Hash target for an ancestor. Ignored on the final (current) crumb. */
  href?: string
}

export function Breadcrumb({
  items,
  onNavigate,
  className,
}: {
  items: readonly Crumb[]
  /** Called when an ancestor is activated; the default navigation is prevented. */
  onNavigate?: (crumb: Crumb) => void
  className?: string
}) {
  return (
    <nav aria-label="Breadcrumb" data-anchor="breadcrumbs" className={className}>
      <ol className="flex min-h-7 flex-wrap items-center gap-x-2 type-data text-muted-foreground">
        {items.map((crumb, index) => {
          const current = index === items.length - 1
          return (
            <Fragment key={`${index}-${crumb.label}`}>
              <li className="inline-flex items-center">
                {current ? (
                  <span aria-current="page" className="text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <a
                    href={crumb.href ?? '#'}
                    onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                      event.preventDefault()
                      onNavigate?.(crumb)
                    }}
                    className={cn('rounded-sm underline-offset-4 hover:text-foreground hover:underline')}
                  >
                    {crumb.label}
                  </a>
                )}
              </li>
              {!current && (
                <li aria-hidden="true" role="presentation" className="inline-flex items-center">
                  /
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
