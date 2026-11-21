import { useMemo, type ReactNode } from 'react'
import { FPS } from '@/lib/frame'
import { FilmClockContext } from './use-film-clock'
import type { FilmClock } from './types'

/** The only source of film time. `frame` comes from the capture or scrubber, never from a timer or `Date`. */
export function FilmClockProvider({ frame, reducedMotion = false, children }: { frame: number; reducedMotion?: boolean; children: ReactNode }) {
  const clock = useMemo<FilmClock>(() => ({ frame, seconds: frame / FPS, reducedMotion }), [frame, reducedMotion])
  return <FilmClockContext.Provider value={clock}>{children}</FilmClockContext.Provider>
}
