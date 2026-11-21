import * as SwitchPrimitive from '@radix-ui/react-switch'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * CMP-13 switch (Radix): 36x20 track, 16px thumb, 150 ms thumb travel (reduced motion:
 * immediate). On is foreground, off is neutral; never cyan. Its label is a separate
 * `<label htmlFor>`, so the switch needs `id`.
 */
export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>>(
  function Switch({ className, ...props }, ref) {
    return (
      <SwitchPrimitive.Root
        ref={ref}
        className={cn(
          'inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-trace bg-surface-2 p-0.5 transition-colors',
          'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 rounded-full bg-foreground transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-background" />
      </SwitchPrimitive.Root>
    )
  },
)
