import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cloneElement, useId, type ReactElement, type ReactNode } from 'react'
import { useOverlayContainer } from '@/components/ui/overlay-context'
import { cn } from '@/lib/utils'

/**
 * CMP-10 tooltip (Radix). Ink fill, contrasting 11/16 mono, 4px radius, 8px padding,
 * 150 ms opacity, z-20. It opens after 400 ms of hover or at once on keyboard focus.
 *
 * A tooltip is supplemental, never the only name. The same text is always present as a
 * visually hidden description on the trigger, so a screen reader or a keyboard user gets
 * it with or without hover. `open` controls the state for film frames; omit it for
 * interactive use. The trigger must be focusable and carry its own accessible name.
 */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={400} skipDelayDuration={0}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

export function Tooltip({
  content,
  children,
  open,
  onOpenChange,
  side = 'top',
  anchor,
  className,
}: {
  content: string
  /** A single focusable element. */
  children: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Film anchor on the floating surface, e.g. `gate-provenance`. */
  anchor?: string
  className?: string
}) {
  const textId = useId()
  const container = useOverlayContainer()
  return (
    <>
      <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger asChild>
          {cloneElement(children, { 'aria-describedby': textId })}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={container}>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            collisionPadding={8}
            data-anchor={anchor}
            className={cn(
              'z-20 max-w-[320px] rounded-sm bg-foreground p-2 type-micro text-background',
              'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0',
              'data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0 duration-150',
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
      <span id={textId} className="sr-only">
        {content}
      </span>
    </>
  )
}
