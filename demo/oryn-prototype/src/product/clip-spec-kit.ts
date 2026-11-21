import type { Rect, Vec2 } from '@/film'
import type { Action } from '@/state'
import type { Cut, Move } from './clip-specs'

/** Small builders shared by the BOB-05 and BOB-06 clip specs (`clip-specs-work.ts`, `clip-specs-discovery.ts`). */

export const centre = (rect: Rect): Vec2 => [Math.round(rect.x + rect.width / 2), Math.round(rect.y + rect.height / 2)]

export function named<K extends string>(rects: Readonly<Record<K, Rect>>, names: readonly K[]): Readonly<Record<string, Rect>> {
  const picked: Record<string, Rect> = {}
  for (const name of names) picked[name] = rects[name]
  return picked
}

/** A hard cut of the pointer: it is at `to` from `frame`, with no travel. */
export const place = (frame: number, to: Vec2): Move => ({ frame, duration: 0, to })

/** One pointer travel of `duration` frames ending at `to`, optionally on a `target` anchor and landing a click's actions. */
export const go = (frame: number, duration: number, to: Vec2, target?: string, click?: readonly Action[]): Move => ({
  frame,
  duration,
  to,
  ...(target === undefined ? {} : { target }),
  ...(click === undefined ? {} : { click }),
})

/** Screen actions with no pointer: the storyboard's hard cuts. */
export const cut = (frame: number, ...actions: readonly Action[]): Cut => ({ frame, actions })

/** Storyboard entry covering a clip-local frame, `span` frames per entry from `first`. */
export const entryEvery = (prefix: 'H' | 'L', first: number, span: number) => (frame: number): string =>
  `${prefix}-${String(first + Math.floor(frame / span)).padStart(3, '0')}`

export const OPEN = (screen: Extract<Action, { type: 'OPEN_SCREEN' }>['screen']): Action => ({ type: 'OPEN_SCREEN', screen })
