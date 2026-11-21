import { FPS } from '@/lib/frame'
import type { EasingName, SampledMotion } from './types'

/**
 * Fixed film environment (RT-03). Capture launches the page with this locale, time zone,
 * viewport and device scale factor, and with the bundled font files only; nothing in the
 * runtime reads the host's.
 */
export const FILM_FPS = FPS
export const FILM_LOCALE = 'en-US'
export const FILM_TIME_ZONE = 'America/New_York'
export const FILM_VIEWPORT = Object.freeze({ width: 1280, height: 720 })
export const FILM_DEVICE_SCALE_FACTOR = 2

/** Milliseconds to frames at 30 fps, unrounded. */
export const msToFrames = (ms: number): number => (ms * FPS) / 1000

/** Cubic Bezier easing through (0,0) and (1,1), solved by bisection with a fixed iteration count. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const bezier = (s: number, a: number, b: number): number => {
    const u = 1 - s
    return 3 * u * u * s * a + 3 * u * s * s * b + s * s * s
  }
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let low = 0
    let high = 1
    let s = t
    for (let i = 0; i < 40; i += 1) {
      s = (low + high) / 2
      if (bezier(s, x1, x2) < t) low = s
      else high = s
    }
    return bezier(s, y1, y2)
  }
}

const EASINGS: Readonly<Record<EasingName, (t: number) => number>> = {
  linear: (t) => Math.min(1, Math.max(0, t)),
  /** Product UI transition: cubic-bezier(.4, 0, .2, 1). */
  product: cubicBezier(0.4, 0, 0.2, 1),
  /** Reveal: cubic-bezier(.16, 1, .3, 1). */
  reveal: cubicBezier(0.16, 1, 0.3, 1),
}

export function ease(name: EasingName, t: number): number {
  return EASINGS[name](t)
}

/**
 * `sampleMotion(startFrame, durationFrames, easing)` returns a pure reader: give it the film clock
 * (or any `{ frame, reducedMotion }`) and it returns the eased progress. The fraction is clamped
 * to the local frame window; reduced motion has no in-between: progress is 0 before the start and 1 from it.
 */
export function sampleMotion(
  startFrame: number,
  durationFrames: number,
  easing: EasingName,
): (clock: { readonly frame: number; readonly reducedMotion?: boolean }) => SampledMotion {
  return ({ frame, reducedMotion = false }) => {
    const elapsed = frame - startFrame
    const complete = elapsed >= durationFrames
    if (reducedMotion || durationFrames <= 0) return { progress: elapsed >= 0 ? 1 : 0, active: false, complete: elapsed >= 0 }
    if (elapsed < 0) return { progress: 0, active: false, complete: false }
    return { progress: complete ? 1 : ease(easing, elapsed / durationFrames), active: !complete, complete }
  }
}

/** Reveal stagger: 60 ms per item rounded to whole frames, never past the 360 ms cap (10 frames = 333 ms). */
export function staggerDelayFrames(index: number): number {
  return Math.min(Math.round(index * msToFrames(60)), Math.floor(msToFrames(360)))
}
