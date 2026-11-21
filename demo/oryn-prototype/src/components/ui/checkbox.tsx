import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * CMP-13 checkbox (Radix): 16x16, 4px radius, foreground check, neutral surface, never cyan.
 * Pair it with a `<label htmlFor>` that spans the row so the click region is the whole row.
 *
 * `locked` is a mandatory, always-on choice (for example a mandatory exclusion). Unlike
 * `disabled`, it stays in the tab order so its reason can be reached; it can never change.
 */
export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked'> {
  checked: boolean
  locked?: boolean
}

export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(function Checkbox(
  { checked, locked = false, onCheckedChange, className, ...props },
  ref,
) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      onCheckedChange={locked ? undefined : onCheckedChange}
      aria-disabled={locked || undefined}
      data-locked={locked ? 'true' : undefined}
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-trace bg-surface text-background transition-colors',
        'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground',
        'data-[locked=true]:cursor-not-allowed data-[locked=true]:border-border data-[locked=true]:bg-surface-2 data-[locked=true]:text-muted-foreground',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
