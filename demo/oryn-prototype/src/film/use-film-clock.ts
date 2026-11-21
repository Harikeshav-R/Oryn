import { createContext, useContext } from 'react'
import { sampleMotion } from './motion'
import type { EasingName, FilmClock, SampledMotion } from './types'

/** Outside a film the clock is stopped at frame 0 and motion is on: components render their resting state. */
export const STOPPED_CLOCK: FilmClock = Object.freeze({ frame: 0, seconds: 0, reducedMotion: false })

export const FilmClockContext = createContext<FilmClock>(STOPPED_CLOCK)

/** `useFilmClock()`: the current frame, its seconds and the reduced-motion flag. A pure read of context. */
export function useFilmClock(): FilmClock {
  return useContext(FilmClockContext)
}

/** `sampleMotion(startFrame, durationFrames, easing)` read at the current film clock. */
export function useSampledMotion(startFrame: number, durationFrames: number, easing: EasingName): SampledMotion {
  return sampleMotion(startFrame, durationFrames, easing)(useFilmClock())
}
