import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useState, type ComponentPropsWithoutRef, type ReactNode, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { OverlayContainerContext } from '@/components/ui/overlay-context'
import { cn } from '@/lib/utils'

/**
 * CMP-09 drawer and dialog (Radix Dialog).
 *
 * z-order: backdrop z-40, panel z-50, black 80% scrim, lg floating shadow, 150 ms opacity
 * fade (reduced motion: immediate, from the global rule). No transform is used, so a
 * tooltip portalled into the panel keeps correct fixed positioning.
 *
 * Modal behaviour comes from Radix: focus is trapped, Tab cycles, Escape closes, siblings
 * are inert and scroll is locked. Focus returns to the opener: either the trigger or
 * `returnFocusRef` when the surface is opened programmatically (film, deep link).
 * Initial focus lands on Close, so Enter on open can never trigger a decision.
 */
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const scrim =
  'fixed inset-0 z-40 bg-black/80 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-150'

const panelMotion =
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-150'

interface SurfaceProps extends Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  title: string
  /** Names what the surface is for. Visible under the title. */
  description: string
  /** Film anchor, e.g. `approval-drawer`. */
  anchor?: string
  footer?: ReactNode
  returnFocusRef?: RefObject<HTMLElement | null>
}

function Heading({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-w-0">
      <DialogPrimitive.Title className="font-sans text-[18px] font-medium leading-6 tracking-[-0.01em]">
        {title}
      </DialogPrimitive.Title>
      <DialogPrimitive.Description className="mt-1 type-data text-muted-foreground">
        {description}
      </DialogPrimitive.Description>
    </div>
  )
}

function CloseButton() {
  return (
    <DialogPrimitive.Close asChild>
      <Button variant="ghost" size="icon" icon={<X />} aria-label="Close" />
    </DialogPrimitive.Close>
  )
}

function Surface({
  surface,
  title,
  description,
  anchor,
  footer,
  returnFocusRef,
  className,
  children,
  onCloseAutoFocus,
  ...rest
}: SurfaceProps & { surface: 'drawer' | 'dialog' }) {
  // The panel element is state, not a ref, so portalled children re-render once it exists.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null)
  const isDrawer = surface === 'drawer'

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={scrim} />
      <DialogPrimitive.Content
        ref={setPanel}
        data-anchor={anchor}
        data-surface={surface}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event)
          if (event.defaultPrevented || !returnFocusRef?.current) return
          event.preventDefault()
          returnFocusRef.current.focus()
        }}
        className={cn(
          'z-50 flex flex-col border bg-surface text-foreground shadow-lg',
          panelMotion,
          isDrawer
            ? 'fixed right-0 top-0 h-screen w-[480px] max-w-full rounded-none border-y-0 border-r-0'
            : 'fixed inset-0 m-auto h-fit max-h-[calc(100%-32px)] w-[calc(100%-32px)] max-w-[512px] rounded-lg',
          className,
        )}
        {...rest}
      >
        <OverlayContainerContext.Provider value={panel}>
          <div
            className={cn(
              'flex shrink-0 items-start justify-between gap-4',
              isDrawer ? 'border-b px-6 py-4' : 'px-6 pb-2 pt-6',
            )}
          >
            <Heading title={title} description={description} />
            <CloseButton />
          </div>
          {/* Overscroll is contained so a scrolled body never moves the page behind the scrim. */}
          <div data-overlay-body="" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {children}
          </div>
          {footer && (
            <div
              data-overlay-footer=""
              className={cn(
                'flex shrink-0 items-center justify-end gap-2 border-t px-6',
                isDrawer ? 'h-16' : 'py-4',
              )}
            >
              {footer}
            </div>
          )}
        </OverlayContainerContext.Provider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** Right drawer `[800,0,480,720]`: header, scrolling body, sticky 64px footer. */
export function DrawerContent(props: SurfaceProps) {
  return <Surface surface="drawer" {...props} />
}

/** Centered dialog, max 512px, 24px padding. */
export function DialogContent(props: SurfaceProps) {
  return <Surface surface="dialog" {...props} />
}
