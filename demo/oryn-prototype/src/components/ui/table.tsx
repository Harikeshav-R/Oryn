import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { OrbitNode } from '@/components/domain/orbit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * CMP-07 dense table primitives on native table semantics. Header 32px (sticky, z-10),
 * rows 32px dense or 40px comfortable, 12px cell padding, 1px separators, mono 12/18
 * with tabular numerals. Numeric cells right-align. No layout animation, no loop.
 */

export function Table({ className, ...props }: ComponentPropsWithoutRef<'table'>) {
  return <table className={cn('w-full table-fixed border-collapse type-data', className)} {...props} />
}

export type SortDirection = 'none' | 'asc' | 'desc'

/**
 * Column header. With `onSort` the label becomes a button that exposes the direction
 * through `aria-sort` on the header and an icon plus text in its accessible name.
 */
export function Th({
  numeric,
  className,
  sortDirection,
  onSort,
  children,
  ...props
}: ComponentPropsWithoutRef<'th'> & { numeric?: boolean; sortDirection?: SortDirection; onSort?: () => void }) {
  const Icon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ChevronsUpDown
  return (
    <th
      scope="col"
      aria-sort={onSort ? (sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none') : undefined}
      className={cn(
        'sticky top-0 z-10 h-8 border-b bg-background px-3 font-medium',
        numeric ? 'text-right' : 'text-left',
        className,
      )}
      {...props}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          className={cn('inline-flex items-center gap-1 rounded-sm', numeric && 'flex-row-reverse')}
        >
          <span>{children}</span>
          <Icon aria-hidden="true" className={cn('size-3.5', sortDirection === 'none' && 'text-muted-foreground')} strokeWidth={1.75} />
          <span className="sr-only">
            {sortDirection === 'asc' ? ', sorted ascending' : sortDirection === 'desc' ? ', sorted descending' : ', not sorted'}
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  )
}

export function Td({ numeric, className, ...props }: ComponentPropsWithoutRef<'td'> & { numeric?: boolean }) {
  return <td className={cn('overflow-hidden px-3 py-0 align-middle', numeric && 'text-right', className)} {...props} />
}

/** Non-ready table states. Each carries a reason; the error and empty states offer a recovery action. */
export type TableState = 'ready' | 'loading' | 'empty' | 'error' | 'unauthorized'

export interface TableStateCopy {
  reason: string
  action?: { label: string; onAction?: () => void }
}

export function TableStateRow({
  state,
  colSpan,
  copy,
  frame = 0,
}: {
  state: Exclude<TableState, 'ready'>
  colSpan: number
  copy: TableStateCopy
  frame?: number
}): ReactNode {
  return (
    <tr data-table-state={state}>
      <td colSpan={colSpan} className="px-3 py-6">
        <div role={state === 'error' ? 'alert' : 'status'} className="flex items-center gap-3 type-body">
          {state === 'loading' && <OrbitNode frame={frame} running={false} size={24} decorative />}
          <span>{copy.reason}</span>
          {copy.action && (
            <Button variant="outline" size="sm" onClick={copy.action.onAction}>
              {copy.action.label}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
