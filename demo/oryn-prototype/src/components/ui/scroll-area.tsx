import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * CMP-14 scroll area. The scrollbar is hidden by the product-wide rule, but overflow is
 * not: the region scrolls by wheel, touch and keyboard. It is a focusable named region so
 * arrow keys, Page Up/Down and Space scroll it without a pointer. Overscroll is contained
 * so reaching an edge never scrolls the surface behind it.
 */
export function ScrollArea({
  label,
  className,
  children,
}: {
  /** Accessible name of the scrolling region. */
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      data-scroll-area=""
      className={cn('overflow-y-auto overscroll-contain rounded-sm', className)}
    >
      {children}
    </div>
  )
}
