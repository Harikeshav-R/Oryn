import { cn } from '@/lib/utils'

/**
 * CMP-14 skeleton: a static surface-2 block that takes the final content geometry, so
 * nothing moves when real content arrives. No shimmer: it is static in film and in
 * reduced motion, and neutral in both themes.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" data-skeleton="" className={cn('rounded-sm bg-surface-2', className)} />
}
