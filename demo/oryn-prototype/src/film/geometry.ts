import { FILM_VIEWPORT, ease } from './motion'
import { HOVER_FRAMES } from './cursor'
import type {
  AnchorSample,
  AnchorSpec,
  Camera,
  CameraEvent,
  FilmEvent,
  OutlineEvent,
  OutlineKind,
  OutlineView,
  OverlayEvent,
  Rect,
} from './types'

export const IDENTITY_CAMERA: Camera = Object.freeze({ x: FILM_VIEWPORT.width / 2, y: FILM_VIEWPORT.height / 2, zoom: 1 })
const VIEWPORT_RECT: Rect = { x: 0, y: 0, width: FILM_VIEWPORT.width, height: FILM_VIEWPORT.height }

/** Outline stroke, and the gap between the focus ring and the outline box. */
export const OUTLINE_WIDTH = 2
export const HANDLE_SIZE = 6
export const DEFAULT_OUTLINE_RADIUS = 4

export const ofType = <T extends FilmEvent['type']>(events: readonly FilmEvent[], type: T): readonly Extract<FilmEvent, { type: T }>[] =>
  events.filter((event): event is Extract<FilmEvent, { type: T }> => event.type === type)

/** Camera at `frame`: the active event's eased interpolation, or its destination under reduced motion. */
export function cameraAt(events: readonly CameraEvent[], frame: number, reducedMotion: boolean): Camera {
  let active: CameraEvent | undefined
  for (const event of events) {
    if (event.frame <= frame) active = event
    else break
  }
  if (!active) return IDENTITY_CAMERA
  const [fx, fy, fz] = active.from
  const [tx, ty, tz] = active.to
  if (reducedMotion || active.duration <= 0 || frame >= active.frame + active.duration) return { x: tx, y: ty, zoom: tz }
  const p = ease(active.easing, (frame - active.frame) / active.duration)
  return { x: fx + (tx - fx) * p, y: fy + (ty - fy) * p, zoom: fz + (tz - fz) * p }
}

/** World rectangle to CSS viewport rectangle: translate so the camera point is centred, then scale. */
export function toViewport(rect: Rect, camera: Camera): Rect {
  return {
    x: (rect.x - camera.x) * camera.zoom + FILM_VIEWPORT.width / 2,
    y: (rect.y - camera.y) * camera.zoom + FILM_VIEWPORT.height / 2,
    width: rect.width * camera.zoom,
    height: rect.height * camera.zoom,
  }
}

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

export function containsPoint(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

export const grow = (rect: Rect, by: number): Rect => ({ x: rect.x - by, y: rect.y - by, width: rect.width + 2 * by, height: rect.height + 2 * by })

/** Overlay visibility at `frame`: the last event for each id wins. Ids never mentioned are absent. */
export function overlaysAt(events: readonly OverlayEvent[], frame: number): Readonly<Record<string, boolean>> {
  const visible: Record<string, boolean> = {}
  for (const event of events) {
    if (event.frame > frame) break
    visible[event.id] = event.visible
  }
  return visible
}

/** Named anchors after the camera. A hidden anchor carries `rect: null`; it is never fabricated. */
export function anchorsAt(
  anchors: Readonly<Record<string, AnchorSpec>>,
  camera: Camera,
  overlays: Readonly<Record<string, boolean>>,
): Readonly<Record<string, AnchorSample>> {
  const samples: Record<string, AnchorSample> = {}
  for (const [name, spec] of Object.entries(anchors)) {
    const rect = toViewport(spec.rect, camera)
    const visible = overlays[`anchor:${name}`] !== false && intersects(rect, VIEWPORT_RECT)
    samples[name] = visible ? { rect, visible } : { rect: null, visible }
  }
  return samples
}

// ---------------------------------------------------------------------------
// FRT-02 outlines
// ---------------------------------------------------------------------------

interface Change {
  readonly frame: number
  readonly target: string | null
}

export interface Fading {
  readonly target: string
  readonly alpha: number
}

/**
 * Fade-in of the current target and fade-out of the previous one over 150 ms, from an ordered
 * list of target changes. Reduced motion is instant. Opacity only: no pulse, no loop.
 */
export function fadeAt(changes: readonly Change[], frame: number, reducedMotion: boolean): readonly Fading[] {
  let index = -1
  for (let i = 0; i < changes.length; i += 1) {
    if ((changes[i] as Change).frame <= frame) index = i
    else break
  }
  if (index < 0) return []
  const current = changes[index] as Change
  const progress = reducedMotion ? 1 : ease('product', (frame - current.frame) / HOVER_FRAMES)
  const out: Fading[] = []
  if (current.target !== null) out.push({ target: current.target, alpha: progress })
  const previous = index > 0 ? (changes[index - 1] as Change) : undefined
  if (previous?.target && previous.target !== current.target && !reducedMotion && progress < 1) {
    out.push({ target: previous.target, alpha: 1 - progress })
  }
  return out
}

export const outlineChanges = (events: readonly OutlineEvent[], mode: OutlineEvent['mode']): readonly Change[] =>
  events.filter((event) => event.mode === mode).map(({ frame, target }) => ({ frame, target }))

/**
 * Outline geometry for one target rectangle. The 2 px stroke is drawn outside the target, so
 * the value inside is never covered. Focus adds a second ring and selection adds a corner handle,
 * so the three states differ by shape, not only by colour or opacity.
 */
export function outlineFor(anchor: string, kind: OutlineKind, target: Rect, radius: number, alpha: number): OutlineView {
  const box = grow(target, OUTLINE_WIDTH)
  return {
    anchor,
    kind,
    target,
    box,
    ring: kind === 'focus' ? grow(box, OUTLINE_WIDTH * 2) : null,
    handle: kind === 'selected' ? { x: target.x + target.width, y: target.y + target.height, width: HANDLE_SIZE, height: HANDLE_SIZE } : null,
    width: OUTLINE_WIDTH,
    radius,
    alpha,
  }
}

const PRIORITY: Readonly<Record<OutlineKind, number>> = { focus: 0, selected: 1, hover: 2 }

/** One outline per anchor, focus over selected over hover, ordered by that priority. */
export function resolveOutlines(
  candidates: readonly { readonly anchor: string; readonly kind: OutlineKind; readonly alpha: number }[],
  anchors: Readonly<Record<string, AnchorSample>>,
  specs: Readonly<Record<string, AnchorSpec>>,
): readonly OutlineView[] {
  const best = new Map<string, { kind: OutlineKind; alpha: number }>()
  for (const candidate of candidates) {
    if (candidate.alpha <= 0) continue
    const held = best.get(candidate.anchor)
    if (!held || PRIORITY[candidate.kind] < PRIORITY[held.kind]) best.set(candidate.anchor, { kind: candidate.kind, alpha: candidate.alpha })
  }
  const views: OutlineView[] = []
  for (const [anchor, { kind, alpha }] of best) {
    const rect = anchors[anchor]?.rect
    if (!rect) continue
    views.push(outlineFor(anchor, kind, rect, specs[anchor]?.radius ?? DEFAULT_OUTLINE_RADIUS, alpha))
  }
  return views.sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || (a.anchor < b.anchor ? -1 : a.anchor > b.anchor ? 1 : 0))
}
