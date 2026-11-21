import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useFontReport } from '@/fonts/context'
import type { Mode, Theme } from './params'

/**
 * `#product-root` is the anchor later timelines and captures bind to.
 * Film mode is the 1280x720 authored canvas; app mode is fluid.
 * Theme is applied as an explicit state with colour transitions suppressed.
 */
export function ProductRoot({ theme, mode, children }: { theme: Theme; mode: Mode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const fonts = useFontReport()

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    // Switch with transitions disabled: set the guard, force style recalc, drop the guard.
    root.setAttribute('data-theme-switching', '')
    document.documentElement.dataset.theme = theme
    void root.offsetHeight
    root.removeAttribute('data-theme-switching')
  }, [theme])

  const failed = fonts.faces.filter((face) => face.state === 'unavailable')

  return (
    <div
      id="product-root"
      ref={ref}
      data-product-root=""
      data-theme={theme}
      data-mode={mode}
      data-fonts={fonts.status}
    >
      {fonts.status === 'unavailable' && (
        <div
          role="alert"
          className="border-b border-danger bg-surface p-4 type-data text-foreground"
          data-fonts-diagnostic=""
        >
          <p className="type-card">Capture blocked: bundled fonts unavailable</p>
          <ul className="mt-2">
            {failed.map(({ spec, reason }) => (
              <li key={spec.path}>
                {spec.family} {spec.weight} · {spec.path} · {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      {mode === 'film' && fonts.status === 'unavailable' ? null : (
        <div data-fonts-content="">{children}</div>
      )}
    </div>
  )
}
