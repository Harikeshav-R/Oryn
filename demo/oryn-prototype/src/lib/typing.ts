import { FPS } from './frame'

/**
 * Deterministic film typing (RT-03 subset needed by CMP-04). Characters appear at
 * 28-34 chars/s. Each character's interval comes from a stateless hash of
 * (seed, target, index), so the revealed prefix is a pure function of the frame:
 * seeking forward, backward or rendering a single frame gives identical characters.
 * Intervals are positive, so character times are strictly monotonic.
 */
export const TYPE_MIN_CPS = 28
export const TYPE_MAX_CPS = 34
/** Nominal rate used when an event does not name one: the midpoint of the range. */
export const TYPE_DEFAULT_CPS = 31

/** FNV-1a over the target text and indices, finished with an integer avalanche. No state, no Math.random. */
export function seededHash(seed: number, target: string, index: number): number {
  let h = 0x811c9dc5 ^ seed
  for (let i = 0; i < target.length; i += 1) {
    h = Math.imul(h ^ target.charCodeAt(i), 0x01000193)
  }
  h = Math.imul(h ^ index, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/** `seededHash` scaled to [0, 1). */
export function seededUnit(seed: number, target: string, index: number): number {
  return seededHash(seed, target, index) / 0x100000000
}

/**
 * Seconds after typing starts at which each character (by code point) appears. The per-character
 * rate is `charsPerSecond` plus a bounded jitter, so it never leaves 28-34 chars/s. Intervals are
 * positive, so the schedule is strictly increasing. A stateless function of its arguments.
 */
export function typingSchedule(text: string, seed: number, target: string, charsPerSecond = TYPE_DEFAULT_CPS): readonly number[] {
  if (!(charsPerSecond >= TYPE_MIN_CPS && charsPerSecond <= TYPE_MAX_CPS)) {
    throw new RangeError(`charsPerSecond ${charsPerSecond} is outside ${TYPE_MIN_CPS}-${TYPE_MAX_CPS}.`)
  }
  const jitter = Math.min(charsPerSecond - TYPE_MIN_CPS, TYPE_MAX_CPS - charsPerSecond)
  const low = charsPerSecond - jitter
  const chars = Array.from(text)
  const schedule: number[] = []
  let t = 0
  for (let i = 0; i < chars.length; i += 1) {
    t += 1 / (low + seededUnit(seed, target, i) * 2 * jitter)
    schedule.push(t)
  }
  return schedule
}

/** Number of characters whose time is at or before `elapsedSeconds`. */
export function typedCount(schedule: readonly number[], elapsedSeconds: number): number {
  let shown = 0
  while (shown < schedule.length && (schedule[shown] as number) <= elapsedSeconds) shown += 1
  return shown
}

/** Text revealed `frame - startFrame` frames after the type event starts. Counts code points, never splits one. */
export function typedText(text: string, seed: number, target: string, frame: number, startFrame = 0, charsPerSecond = TYPE_DEFAULT_CPS): string {
  const elapsed = (frame - startFrame) / FPS
  if (elapsed <= 0) return ''
  const shown = typedCount(typingSchedule(text, seed, target, charsPerSecond), elapsed)
  return Array.from(text).slice(0, shown).join('')
}
