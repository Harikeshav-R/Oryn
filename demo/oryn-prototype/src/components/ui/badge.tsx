import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Plain metadata chip (CMP-06). 24px, 4px radius, 8px padding. It implies no status:
 * anything meaningful (approved, verified, running...) is a StatusBadge with a glyph.
 */
const badgeVariants = cva('inline-flex h-6 items-center whitespace-nowrap rounded-sm border px-2 type-data text-foreground', {
  variants: {
    variant: {
      neutral: 'border-transparent bg-surface-2',
      outline: 'border-border bg-transparent',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export function Badge({
  variant,
  className,
  children,
}: VariantProps<typeof badgeVariants> & { className?: string; children: ReactNode }) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
}
