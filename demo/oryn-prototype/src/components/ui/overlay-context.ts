import { createContext, useContext } from 'react'

/**
 * The element a drawer or dialog renders into. A tooltip or popover owned by a modal
 * surface portals here instead of to the body, so it layers above its owner and stays
 * inside the focus trap. Outside a modal the value is `null` and portals use the body.
 */
export const OverlayContainerContext = createContext<HTMLElement | null>(null)

export function useOverlayContainer(): HTMLElement | undefined {
  return useContext(OverlayContainerContext) ?? undefined
}
