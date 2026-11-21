/**
 * Tab order inside a modal layer. `current` is the index of the focused element in the layer's
 * ordered focusable list, or -1 when focus is outside it: focus then re-enters at the first
 * element (forward) or the last (backward). Focus never leaves the layer.
 */
export function nextFocusIndex(count: number, current: number, backwards: boolean): number {
  if (count <= 0) return -1
  if (current < 0 || current >= count) return backwards ? count - 1 : 0
  return backwards ? (current - 1 + count) % count : (current + 1) % count
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** Focusable descendants in document order; a hidden or natively disabled element is skipped. */
export function focusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => !element.hasAttribute('disabled') && element.getClientRects().length > 0)
}

/** Handle a Tab key inside `container`: cycle focus within it. Returns true when the key was handled. */
export function trapTab(event: { readonly key: string; readonly shiftKey: boolean; preventDefault: () => void }, container: HTMLElement | null): boolean {
  if (event.key !== 'Tab' || container === null) return false
  const items = focusables(container)
  event.preventDefault()
  const target = items[nextFocusIndex(items.length, items.indexOf(document.activeElement as HTMLElement), event.shiftKey)]
  target?.focus()
  return true
}
