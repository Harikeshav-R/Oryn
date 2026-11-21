import type { Action, StateId, State, Rejection } from '@/state/types'

/**
 * RT-03 / FRT-01 / FRT-02 / FRT-03 contracts. Everything here is plain JSON-serialisable data:
 * a timeline lives in `film/<cut>/<clip-id>.timeline.json` and is the only input to the film.
 * Frames are integers at 30 fps; coordinates are authored CSS pixels in the 1280x720 viewport.
 */

export type Vec2 = readonly [number, number]
/** Camera as `[x, y, zoom]`: the world point at the viewport centre and the scale. Identity is `[640, 360, 1]`. */
export type CameraTuple = readonly [number, number, number]

export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type EasingName = 'linear' | 'product' | 'reveal'

/** Reducer fields an anchor may be bound to, so "selected" always comes from reducer state. */
export type SelectionField = 'selectedCase' | 'selectedScenario' | 'commitmentDue' | 'commitmentConfirmedDue' | 'actorId'

export interface AnchorSpec {
  /** Rectangle in world (authored) coordinates. The camera maps it to CSS viewport coordinates. */
  readonly rect: Rect
  /** Outline corner radius in CSS px; 4-6 to match the target. Default 4. */
  readonly radius?: number
  /** The anchor is `selected` while this reducer field equals `equals`. */
  readonly selects?: { readonly field: SelectionField; readonly equals: string }
}

interface EventBase {
  /** Clip-local frame, an integer from 0 to `durationFrames - 1`. */
  readonly frame: number
  /** Stable order among events on the same frame. */
  readonly seq: number
  /** Storyboard or inventory entry the event realises (an `H-nnn` or `L-nnn` line). Required for capture. */
  readonly entry?: string
}

export interface ActionEvent extends EventBase {
  readonly type: 'action'
  readonly action: Action
  /** Set only for a scripted blocked action; the reducer must then reject it. */
  readonly expect?: 'rejected'
}

export interface CameraEvent extends EventBase {
  readonly type: 'camera'
  readonly from: CameraTuple
  readonly to: CameraTuple
  readonly duration: number
  readonly easing: 'reveal'
}

export interface CursorEvent extends EventBase {
  readonly type: 'cursor'
  readonly from: Vec2
  readonly c1: Vec2
  readonly c2: Vec2
  readonly to: Vec2
  /** Frames of travel: 0 places the pointer, otherwise 11-27 (350-900 ms). */
  readonly duration: number
  readonly click: boolean
  /** Anchor the tip must land inside; it also receives the hover outline. */
  readonly target?: string
  /** A click on a non-reducer surface (a mock third-party app). Otherwise a click needs an action at the landing frame. */
  readonly inert?: true
}

export interface TypeEvent extends EventBase {
  readonly type: 'type'
  readonly target: string
  readonly text: string
  readonly charsPerSecond: number
  readonly seed: number
  /** Existing field text, shown selected until the first replacement character. */
  readonly before?: string
  /** Frames the selection is shown before typing starts. Default 9 with `before`, else 0. */
  readonly selectHoldFrames?: number
}

export interface OverlayEvent extends EventBase {
  readonly type: 'overlay'
  /** `cursor`, `anchor:<name>` or `caret:<target>`. */
  readonly id: string
  readonly visible: boolean
}

/** Keyboard focus or an explicit film-only selection (for example a spreadsheet cell). `null` clears it. */
export interface OutlineEvent extends EventBase {
  readonly type: 'outline'
  readonly target: string | null
  readonly mode: 'focus' | 'selected'
}

export type FilmEvent = ActionEvent | CameraEvent | CursorEvent | TypeEvent | OverlayEvent | OutlineEvent

export interface Timeline {
  readonly fps: 30
  readonly durationFrames: number
  readonly seed: number
  readonly cut: string
  readonly clipId: string
  /** Storyboard scene the clip realises (for example `H4a`). Required for capture. */
  readonly scene?: string
  /** Product theme for the whole clip. Default `light`. A heal clip's in-clip light-to-dark wipe is not captured here. */
  readonly theme?: 'light' | 'dark'
  /** Absolute film frame of clip-local frame 0 at 30 fps. Required for capture; the clip itself always starts at local frame 0. */
  readonly filmStartFrame?: number
  /** Image files under `public/` (relative paths) that must exist and decode before frame 0. */
  readonly assets?: readonly string[]
  /** The clip begins at the state reached by replaying the canonical prerequisites of this phase. */
  readonly startAt?: StateId
  /** Real third-party footage (for example the Bob review): no overlay cursor and no synthetic typing. */
  readonly liveFootage?: true
  readonly anchors: Readonly<Record<string, AnchorSpec>>
  /** Sorted by `(frame, seq)`; `(frame, seq)` is unique. */
  readonly events: readonly FilmEvent[]
}

export interface FilmClock {
  readonly frame: number
  readonly seconds: number
  readonly reducedMotion: boolean
}

export interface SampledMotion {
  readonly progress: number
  readonly active: boolean
  readonly complete: boolean
}

export interface Camera {
  readonly x: number
  readonly y: number
  readonly zoom: number
}

export type CursorPhase = 'hidden' | 'travel' | 'press' | 'hover' | 'rest'

export interface ClickRing {
  /** 0 to 1 over 260 ms. */
  readonly progress: number
  readonly radius: number
  /** Ink alpha, falling to 0. */
  readonly alpha: number
}

export interface CursorView {
  readonly visible: boolean
  readonly phase: CursorPhase
  /** Hot spot (the arrow tip) in CSS viewport pixels, or null while hidden. */
  readonly x: number | null
  readonly y: number | null
  /** 0.97 for 90 ms after a click lands, else 1. */
  readonly pressScale: number
  readonly ring: ClickRing | null
  /** Anchor under the tip once the pointer has arrived on a named target. */
  readonly target: string | null
}

export interface AnchorSample {
  /** CSS viewport rectangle after the camera, or null when hidden. */
  readonly rect: Rect | null
  readonly visible: boolean
}

export type OutlineKind = 'hover' | 'focus' | 'selected'

export interface OutlineView {
  readonly anchor: string
  readonly kind: OutlineKind
  /** The target in CSS viewport pixels. */
  readonly target: Rect
  /** Outer border box: the target grown by 2 px, drawn as a 2 px border so the target interior stays clear. */
  readonly box: Rect
  /** Keyboard focus only: a second 2 px ring 2 px outside `box`. */
  readonly ring: Rect | null
  /** Selection only: a 6 px square handle at the target's lower-right corner, outside it. */
  readonly handle: Rect | null
  readonly width: 2
  readonly radius: number
  readonly alpha: number
}

export interface TypedView {
  readonly target: string
  /** Text now shown in the field. */
  readonly text: string
  readonly full: string
  readonly count: number
  /** `before` is selected and no replacement character has appeared yet. */
  readonly selected: boolean
  readonly complete: boolean
  readonly caret: boolean
}

export interface OrbitView {
  /** Reducer `isRunning`. The only thing that makes the arc cyan. */
  readonly running: boolean
  /** Frames since the run began; 0 when stopped or under reduced motion. Feed to `Orbit`. */
  readonly frame: number
  readonly phase: number
}

export interface FrameView {
  readonly camera: Camera
  readonly cursor: CursorView
  readonly anchors: Readonly<Record<string, AnchorSample>>
  readonly outlines: readonly OutlineView[]
  readonly texts: Readonly<Record<string, TypedView>>
  readonly overlays: Readonly<Record<string, boolean>>
  readonly orbit: OrbitView
}

export interface TimelineRejection {
  readonly frame: number
  readonly seq: number
  readonly rejection: Rejection
}

/** An accepted action with the clip-local frame it landed on, so a surface can time its own 150 ms motion. */
export interface AppliedAction {
  readonly frame: number
  readonly seq: number
  readonly action: Action
}

export interface ResolvedFrame {
  readonly frame: number
  readonly seconds: number
  /** Reducer state after every action at or before `frame`, replayed from the initial snapshot. */
  readonly state: State
  /** Scripted blocked actions (`expect: 'rejected'`) already applied by this frame. */
  readonly rejections: readonly TimelineRejection[]
  /** Accepted actions up to `frame` in `(frame, seq)` order. */
  readonly applied: readonly AppliedAction[]
  readonly view: FrameView
}

export interface ResolveOptions {
  readonly reducedMotion?: boolean
}

export interface GeometryView {
  readonly camera: Camera
  readonly cursor: CursorView
  readonly anchors: Readonly<Record<string, AnchorSample>>
}
