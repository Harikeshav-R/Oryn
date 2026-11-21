import { cn } from '@/lib/utils'

/** CMP-07 row density: 32px dense, 40px comfortable. */
export type TableDensity = 'dense' | 'comfortable'

/** Row classes: hover <=150ms background, selected adds the 2px inset signal rail. */
export function rowClass(density: TableDensity, selected: boolean) {
  return cn(
    'relative border-b transition-colors hover:bg-surface-2',
    density === 'dense' ? 'h-8' : 'h-10',
    // 2px inset neutral signal rail on the selected row.
    selected && 'bg-surface-2 shadow-[inset_2px_0_0_var(--signal)]',
  )
}
