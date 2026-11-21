import { useEffect } from 'react'
import { filmAnchor } from './contract'

/**
 * Moves focus to the anchored control `anchor` while a modal layer is open and gives it back to the opener when the layer closes.
 * Inert in a film (`interactive` false): a film has no focus. Renders nothing, so the screen around it stays a pure function of its props.
 */
export function FocusOnOpen({ open, interactive, anchor }: { readonly open: boolean; readonly interactive: boolean; readonly anchor: string }) {
  useEffect(() => {
    if (!open || !interactive) return undefined
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const [name, value] = Object.entries(filmAnchor(anchor))[0] as [string, string]
    document.querySelector<HTMLElement>(`[${name}="${value}"]`)?.focus()
    return () => opener?.focus()
  }, [open, interactive, anchor])
  return null
}
