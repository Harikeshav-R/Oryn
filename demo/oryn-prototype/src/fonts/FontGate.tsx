import { useEffect, useState, type ReactNode } from 'react'
import { FontContext } from './context'
import { LOADING_REPORT, verifyFonts, type FontReport } from './faces'

declare global {
  interface Window {
    /** Capture contract: wait for status "loaded"; "unavailable" must block the capture. */
    __ORYN_FONTS__?: FontReport
  }
}

/**
 * Loads and verifies the ten bundled faces, then publishes the result on
 * `window.__ORYN_FONTS__`, `<html data-fonts>` and React context.
 * No timers: readiness is the real `document.fonts` promise chain.
 */
export function FontGate({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<FontReport>(LOADING_REPORT)

  useEffect(() => {
    let current = true
    document.documentElement.dataset.fonts = 'loading'
    window.__ORYN_FONTS__ = LOADING_REPORT
    void verifyFonts().then((next) => {
      if (!current) return
      document.documentElement.dataset.fonts = next.status
      window.__ORYN_FONTS__ = next
      setReport(next)
    })
    return () => {
      current = false
    }
  }, [])

  return <FontContext.Provider value={report}>{children}</FontContext.Provider>
}
