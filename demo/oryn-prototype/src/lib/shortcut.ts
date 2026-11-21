import { useEffect, useRef } from 'react'

/**
 * `⌘K` / `Ctrl+K` opener. The handler receives the element that had focus, so the palette
 * can return focus to it when it closes. The listener is a plain keydown: nothing here
 * reads a clock or schedules work.
 */
export function useCommandShortcut(onOpen: (opener: HTMLElement | null) => void): void {
  const latest = useRef(onOpen)
  useEffect(() => {
    latest.current = onOpen
  }, [onOpen])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        const active = document.activeElement
        latest.current(active instanceof HTMLElement ? active : null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
