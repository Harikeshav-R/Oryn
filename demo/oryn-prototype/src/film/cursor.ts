import { seededUnit } from '@/lib/typing'
import { ease, msToFrames } from './motion'
import type { ClickRing, CursorEvent, CursorPhase, CursorView, Vec2 } from './types'

/** FRT-01 timings in whole frames at 30 fps. Travel 350-900 ms: 10.5 rounds up to 11, 27 is exactly 900 ms. */
export const TRAVEL_MIN_FRAMES = Math.ceil(msToFrames(350))
export const TRAVEL_MAX_FRAMES = Math.floor(msToFrames(900))
/** Press 90 ms at scale .97. */
export const PRESS_FRAMES = Math.round(msToFrames(90))
export const PRESS_SCALE = 0.97
/** Click ring 260 ms, expanding and fading. */
export const RING_FRAMES = msToFrames(260)
/** Hover and outline fades 150 ms. */
export const HOVER_FRAMES = msToFrames(150)
export const OVERSHOOT_MIN = 0.01
export const OVERSHOOT_MAX = 0.03
/** Fraction of the travel at which the overshoot peaks; the pointer then settles on the target. */
export const OVERSHOOT_PEAK = 0.8
export const RING_START_RADIUS = 4
export const RING_END_RADIUS = 20
export const RING_START_ALPHA = 0.32

const cubic = (a: number, b: number, c: number, d: number, u: number): number => {
  const v = 1 - u
  return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d
}

/** Overshoot fraction in [1%, 3%] of the travel distance, derived from the timeline seed and the event identity. */
export function overshootOf(timelineSeed: number, event: Pick<CursorEvent, 'frame' | 'seq'>): number {
  return OVERSHOOT_MIN + (OVERSHOOT_MAX - OVERSHOOT_MIN) * seededUnit(timelineSeed, `cursor:${event.frame}:${event.seq}`, 0)
}

/**
 * Pointer position at travel fraction `t` in [0, 1]: a cubic Bezier through the event's four
 * points with product easing, overshooting the target by `overshoot` x distance at 80% of the
 * travel along the end tangent and settling exactly on `to` at t = 1.
 */
export function cursorPoint(event: CursorEvent, overshoot: number, t: number): Vec2 {
  const { from, c1, c2, to } = event
  const clamped = Math.min(1, Math.max(0, t))
  const u =
    clamped < OVERSHOOT_PEAK
      ? (1 + overshoot) * ease('product', clamped / OVERSHOOT_PEAK)
      : 1 + overshoot * (1 - ease('product', (clamped - OVERSHOOT_PEAK) / (1 - OVERSHOOT_PEAK)))
  if (u <= 1) {
    return [cubic(from[0], c1[0], c2[0], to[0], u), cubic(from[1], c1[1], c2[1], to[1], u)]
  }
  const distance = Math.hypot(to[0] - from[0], to[1] - from[1])
  let dx = to[0] - c2[0]
  let dy = to[1] - c2[1]
  if (dx === 0 && dy === 0) {
    dx = to[0] - from[0]
    dy = to[1] - from[1]
  }
  const length = Math.hypot(dx, dy)
  if (length === 0) return [to[0], to[1]]
  return [to[0] + (dx / length) * (u - 1) * distance, to[1] + (dy / length) * (u - 1) * distance]
}

export const landingFrame = (event: Pick<CursorEvent, 'frame' | 'duration'>): number => event.frame + event.duration

/** The ring `framesSinceLanding` frames after a click lands, or null once its 260 ms have passed. */
export function clickRing(framesSinceLanding: number): ClickRing | null {
  if (framesSinceLanding < 0 || framesSinceLanding >= RING_FRAMES) return null
  const progress = framesSinceLanding / RING_FRAMES
  return {
    progress,
    radius: RING_START_RADIUS + (RING_END_RADIUS - RING_START_RADIUS) * ease('product', progress),
    alpha: RING_START_ALPHA * (1 - progress),
  }
}

/** Ink ring colour: the foreground ink at `alpha`. Neutral by construction; never the arc cyan. */
export const ringInk = (alpha: number): string => `color-mix(in srgb, var(--foreground) ${(alpha * 100).toFixed(2)}%, transparent)`

export const HIDDEN_CURSOR: CursorView = Object.freeze({
  visible: false,
  phase: 'hidden',
  x: null,
  y: null,
  pressScale: 1,
  ring: null,
  target: null,
})

/**
 * Pointer state at `frame` from the cursor events sorted by `(frame, seq)`. A pure function of the
 * events and the frame: seeking never depends on a previously computed frame. Reduced motion snaps
 * the pointer to each event's destination at the event frame, with no press scale and no ring.
 */
export function cursorAt(
  events: readonly CursorEvent[],
  timelineSeed: number,
  frame: number,
  reducedMotion: boolean,
  shown: boolean,
): CursorView {
  let active: CursorEvent | undefined
  for (const event of events) {
    if (event.frame <= frame) active = event
    else break
  }
  if (!active || !shown) return HIDDEN_CURSOR

  const landing = landingFrame(active)
  let x: number
  let y: number
  let phase: CursorPhase
  let target: string | null = null
  if (!reducedMotion && frame < landing) {
    const [px, py] = cursorPoint(active, overshootOf(timelineSeed, active), (frame - active.frame) / active.duration)
    x = px
    y = py
    phase = 'travel'
  } else {
    x = active.to[0]
    y = active.to[1]
    target = active.target ?? null
    phase = target === null ? 'rest' : 'hover'
  }

  let pressScale = 1
  let ring: ClickRing | null = null
  if (!reducedMotion) {
    for (const event of events) {
      if (!event.click) continue
      const since = frame - landingFrame(event)
      if (since < 0) continue
      if (since < PRESS_FRAMES) {
        pressScale = PRESS_SCALE
        if (event === active) phase = 'press'
      }
      const candidate = clickRing(since)
      if (candidate) ring = candidate
    }
  }
  return { visible: true, phase, x, y, pressScale, ring, target }
}
