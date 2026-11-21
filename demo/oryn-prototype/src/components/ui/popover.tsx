import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentPropsWithoutRef } from 'react'
import { useOverlayContainer } from '@/components/ui/overlay-context'
import { cn } from '@/lib/utils'

/**
 * CMP-10 popover (Radix). 320px wide, 12px padding, 8px anchor offset, 8px radius, md
 * shadow, z-20, 150 ms opacity. Non-modal: the anchor stays visible and interactive.
 * Escape closes and Radix returns focus to the trigger. Collision handling keeps it on
 * screen. Content must never include excluded private material.
 */
export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverClose = PopoverPrimitive.Close

export function PopoverContent({
  className,
  anchor,
  ...props
}: ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { anchor?: string }) {
  const container = useOverlayContainer()
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        sideOffset={8}
        collisionPadding={8}
        align="start"
        data-anchor={anchor}
        className={cn(
          'z-20 w-80 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-150',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
