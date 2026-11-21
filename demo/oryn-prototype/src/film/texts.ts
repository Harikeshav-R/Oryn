import { FPS } from '@/lib/frame'
import { typedCount, typingSchedule } from '@/lib/typing'
import type { TypedView, TypeEvent } from './types'

/** Frames a replaced selection stays visible before typing starts (300 ms) when the event names `before`. */
export const SELECT_HOLD_FRAMES = 9
/** Caret on/off half-period once typing ends: 15 frames = 500 ms. Derived from the frame, never from a clock. */
export const CARET_HALF_PERIOD_FRAMES = 15

/** Frame of the first typed character's earliest appearance. */
export const typingStartFrame = (event: TypeEvent): number => event.frame + (event.selectHoldFrames ?? (event.before === undefined ? 0 : SELECT_HOLD_FRAMES))

/** Frame on which the last character is shown. */
export function typingCompleteFrame(event: TypeEvent): number {
  const schedule = typingSchedule(event.text, event.seed, event.target, event.charsPerSecond)
  const last = schedule[schedule.length - 1] ?? 0
  return typingStartFrame(event) + Math.ceil(last * FPS)
}

/**
 * Field text for one type event at `frame`. The revealed prefix is a pure function of
 * `(text, seed, target, charsPerSecond, frame - start)`; the caret is solid while typing and
 * blinks on a frame-derived square wave after it ends. Reduced motion shows the full text and a solid caret.
 */
export function typedViewAt(event: TypeEvent, overlays: Readonly<Record<string, boolean>>, frame: number, reducedMotion: boolean): TypedView {
  const chars = Array.from(event.text)
  const start = typingStartFrame(event)
  const schedule = typingSchedule(event.text, event.seed, event.target, event.charsPerSecond)
  const count = reducedMotion ? chars.length : typedCount(schedule, (frame - start) / FPS)
  const complete = count === chars.length
  const selected = !reducedMotion && event.before !== undefined && count === 0 && frame < start + (schedule[0] ?? 0) * FPS
  const completeFrame = start + Math.ceil((schedule[schedule.length - 1] ?? 0) * FPS)

  let caret: boolean
  if (selected) caret = false
  else if (reducedMotion || !complete) caret = true
  else caret = Math.floor((frame - completeFrame) / CARET_HALF_PERIOD_FRAMES) % 2 === 0
  if (overlays[`caret:${event.target}`] === false) caret = false

  return {
    target: event.target,
    text: selected ? (event.before as string) : chars.slice(0, count).join(''),
    full: event.text,
    count,
    selected,
    complete,
    caret,
  }
}

/** Each target's view from its latest started type event. Sorted events in, so a later event replaces an earlier one. */
export function textsAt(
  events: readonly TypeEvent[],
  overlays: Readonly<Record<string, boolean>>,
  frame: number,
  reducedMotion: boolean,
): Readonly<Record<string, TypedView>> {
  const latest = new Map<string, TypeEvent>()
  for (const event of events) {
    if (event.frame > frame) break
    latest.set(event.target, event)
  }
  const views: Record<string, TypedView> = {}
  for (const [target, event] of latest) views[target] = typedViewAt(event, overlays, frame, reducedMotion)
  return views
}
