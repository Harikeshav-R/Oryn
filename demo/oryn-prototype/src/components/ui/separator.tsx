import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '@/lib/utils'

/**
 * CMP-12 separator: a 1px warm hairline. Decorative by default, so it is not announced;
 * pass `decorative={false}` for a structural divider that is.
 */
export function Separator({
  orientation = 'horizontal',
  decorative = true,
  className,
}: {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  className?: string
}) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      decorative={decorative}
      className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)}
    />
  )
}
