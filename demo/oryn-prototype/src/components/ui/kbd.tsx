import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * CMP-12 keycap: semantic `<kbd>`, 22px high, 6px horizontal padding, 4px radius, mono 11/16.
 * Keycaps explain a shortcut; they are never controls and take no focus.
 */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-sm border bg-surface-2 px-1.5 type-micro text-foreground',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
