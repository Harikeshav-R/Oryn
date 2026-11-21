import { sampleMotion } from '@/film'
import type { Rect, ResolvedFrame, TypedView } from '@/film'
import type { Action, ActionType, State } from '@/state'

/**
 * BOB-04 product screens. Every screen is a pure function of `{ state, film }`:
 * the clickable app (ProductApp) and the film capture (FilmSurface) render the same components
 * from the same reducer state. A screen never keeps business or presentation state of its own.
 *
 * - `dispatch` is absent in a film: handlers must use `act(props, action)` so a film click is a no-op.
 * - `film` is absent in the clickable app. With `film`, a screen must not use CSS transitions or
 *   animations (capture is frame-exact); it derives its own 150 ms motion with `openProgress`.
 * - No timers, no randomness, no network, no `Date`, no portals, no autoFocus tricks in film mode.
 */
export interface FilmContext {
  readonly frame: number
  readonly reducedMotion: boolean
  /** Clip-local frame of the last accepted action of `type`, or null when none has landed yet. */
  readonly lastApplied: (type: ActionType) => number | null
  /** Typed-text views by target (FRT-03). A field shows its view while it is typing; absent in a test context. */
  readonly texts?: Readonly<Record<string, TypedView>>
}

export interface ProductProps {
  readonly state: State
  readonly dispatch?: (action: Action) => void
  readonly film?: FilmContext
  /**
   * The clickable app's own run clock: frames since the running (or cancelled) evaluation began. A film has none
   * (it derives the same count from its frame and the landing frame of the run action); absent means 0.
   */
  readonly runFrame?: number
}


/** The frame and the last frame each action type landed on, read from a resolved film frame. */
export function filmContextOf(resolved: ResolvedFrame, reducedMotion = false): FilmContext {
  const lastApplied = (type: ActionType): number | null => {
    for (let i = resolved.applied.length - 1; i >= 0; i -= 1) {
      const entry = resolved.applied[i]
      if (entry && entry.action.type === type) return entry.frame
    }
    return null
  }
  return { frame: resolved.frame, reducedMotion, lastApplied, texts: resolved.view.texts }
}

/** Run an action from a handler. Absent `dispatch` (film) does nothing. */
export const act = (props: Pick<ProductProps, 'dispatch'>, action: Action): void => props.dispatch?.(action)

/**
 * 150 ms product transition progress (0 to 1) since the last accepted action of `type`; 1 outside a film.
 * An action that lands on clip frame 0 is the replayed start state (the previous clip already showed it), so it has no entry motion.
 */
export function motionProgress(film: FilmContext | undefined, type: ActionType): number {
  if (!film) return 1
  const since = film.lastApplied(type)
  if (since === null || since === 0) return 1
  return sampleMotion(since, 4.5, 'product')(film).progress
}

/** Authored 1280x720 geometry (inventory SC12-FRAME, SC02, SC03, APP-11, APP-12). Absolute CSS pixels. */
export const CANVAS = Object.freeze({ width: 1280, height: 720 })

export const SHELL = Object.freeze({
  sidebar: { x: 0, y: 0, width: 240, height: 720 } satisfies Rect,
  topbar: { x: 240, y: 0, width: 1040, height: 56 } satisfies Rect,
  breadcrumbs: { x: 264, y: 72, width: 700, height: 24 } satisfies Rect,
  content: { x: 264, y: 112, width: 992, height: 584 } satisfies Rect,
})

export const ENROLLMENT = Object.freeze({
  card: { x: 320, y: 100, width: 640, height: 520 } satisfies Rect,
})

export const PRIVACY = Object.freeze({
  /** Left settings column and right summary inside SHELL.content, 24 px gap. */
  left: { x: 264, y: 112, width: 600, height: 584 } satisfies Rect,
  right: { x: 888, y: 112, width: 368, height: 584 } satisfies Rect,
  dialogMaxWidth: 512,
})

export const DESKTOP = Object.freeze({
  menuBar: { x: 0, y: 0, width: 1280, height: 28 } satisfies Rect,
  wallpaper: { x: 0, y: 28, width: 1280, height: 692 } satisfies Rect,
  dock: { x: 360, y: 646, width: 560, height: 64 } satisfies Rect,
  /** APP-11 browser bar, directly below the menu bar. Content starts at y 76. */
  browserBar: { x: 0, y: 28, width: 1280, height: 48 } satisfies Rect,
  companionMenu: { x: 950, y: 28, width: 310, height: 232 } satisfies Rect,
  trayIcon: { x: 1100, y: 14 },
})

/**
 * Film anchor names each screen renders (`data-film-anchor="<name>"`). A timeline anchor must have
 * an element on every frame: a screen renders each of its anchors always and hides the ones its
 * current step does not show with `display: none`; the film surface adds hidden stand-ins for
 * anchors that belong to another screen.
 */
export const filmAnchor = (name: string): { readonly 'data-film-anchor': string } => ({ 'data-film-anchor': name })
