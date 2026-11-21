import { FPS, orbitPhase } from '@/lib/frame'
import { TYPE_MAX_CPS, TYPE_MIN_CPS } from '@/lib/typing'
import { createInitialState, isRunning, reconstruct, transition, isStateId } from '@/state'
import type { Action, Rejection, State } from '@/state'
import {
  TRAVEL_MAX_FRAMES,
  TRAVEL_MIN_FRAMES,
  OVERSHOOT_PEAK,
  cursorAt,
  landingFrame,
} from './cursor'
import {
  anchorsAt,
  cameraAt,
  containsPoint,
  fadeAt,
  ofType,
  outlineChanges,
  overlaysAt,
  resolveOutlines,
} from './geometry'
import { textsAt } from './texts'
import type {
  AnchorSpec,
  CameraEvent,
  FilmEvent,
  GeometryView,
  OrbitView,
  OutlineKind,
  ResolvedFrame,
  ResolveOptions,
  SelectionField,
  Timeline,
  TimelineRejection,
} from './types'

/** Total order of film events: `(frame, seq)`. `Array.prototype.sort` is stable, so equal keys keep file order. */
export const compareEvents = (a: Pick<FilmEvent, 'frame' | 'seq'>, b: Pick<FilmEvent, 'frame' | 'seq'>): number => a.frame - b.frame || a.seq - b.seq

export const sortEvents = (events: readonly FilmEvent[]): readonly FilmEvent[] => [...events].sort(compareEvents)

// ---------------------------------------------------------------------------
// State: replayed from the immutable initial snapshot, never from a prior frame
// ---------------------------------------------------------------------------

export function initialStateOf(timeline: Pick<Timeline, 'startAt'>): State {
  return timeline.startAt === undefined || timeline.startAt === 'ST01' ? createInitialState() : reconstruct(timeline.startAt)
}

export function selectionValue(state: State, field: SelectionField): string | null {
  switch (field) {
    case 'selectedCase':
      return state.selectedCase
    case 'selectedScenario':
      return state.selectedScenario
    case 'commitmentDue':
      return state.commitment.due
    case 'commitmentConfirmedDue':
      return state.commitment.confirmedDue
    case 'actorId':
      return state.actorId
  }
}

export interface ActionOutcome {
  readonly frame: number
  readonly seq: number
  readonly action: Action
  readonly expect: 'rejected' | undefined
  readonly rejection: Rejection | null
}

export interface Fold {
  readonly state: State
  readonly outcomes: readonly ActionOutcome[]
  /** Frame at which the current run began, or null while stopped. */
  readonly runningSince: number | null
  /** Anchor name to the frame its reducer selection began. */
  readonly selectedSince: Readonly<Record<string, number>>
}

/** Apply every action event at or before `frame`, in `(frame, seq)` order, to the initial snapshot. */
export function foldActions(timeline: Timeline, sorted: readonly FilmEvent[], frame: number): Fold {
  let state = initialStateOf(timeline)
  let runningSince: number | null = isRunning(state) ? 0 : null
  const selectedSince: Record<string, number> = {}
  const selecting = Object.entries(timeline.anchors).filter((entry): entry is [string, AnchorSpec & { selects: NonNullable<AnchorSpec['selects']> }] => entry[1].selects !== undefined)
  for (const [name, spec] of selecting) if (selectionValue(state, spec.selects.field) === spec.selects.equals) selectedSince[name] = 0
  const outcomes: ActionOutcome[] = []

  for (const event of sorted) {
    if (event.frame > frame) break
    if (event.type !== 'action') continue
    const result = transition(state, event.action)
    state = result.state
    outcomes.push({ frame: event.frame, seq: event.seq, action: event.action, expect: event.expect, rejection: result.ok ? null : result.rejection })

    const running = isRunning(state)
    if (!running) runningSince = null
    else if (runningSince === null) runningSince = event.frame
    for (const [name, spec] of selecting) {
      const matches = selectionValue(state, spec.selects.field) === spec.selects.equals
      if (!matches) delete selectedSince[name]
      else if (!(name in selectedSince)) selectedSince[name] = event.frame
    }
  }
  return { state, outcomes, runningSince, selectedSince }
}

// ---------------------------------------------------------------------------
// View: geometry, outlines, text, orbit
// ---------------------------------------------------------------------------

function checkFrame(timeline: Timeline, frame: number): void {
  if (!Number.isInteger(frame) || frame < 0 || frame >= timeline.durationFrames) {
    throw new RangeError(`Frame ${frame} is outside 0-${timeline.durationFrames - 1} of ${timeline.cut}/${timeline.clipId}.`)
  }
}

/** Camera, pointer and named anchors only: no reducer replay. This is what the sidecar samples every frame. */
export function sampleGeometry(timeline: Timeline, frame: number, options: ResolveOptions = {}): GeometryView {
  checkFrame(timeline, frame)
  return geometryAt(timeline, sortEvents(timeline.events), frame, options.reducedMotion === true)
}

function geometryAt(timeline: Timeline, sorted: readonly FilmEvent[], frame: number, reduced: boolean): GeometryView & { readonly overlays: Readonly<Record<string, boolean>> } {
  const overlays = overlaysAt(ofType(sorted, 'overlay'), frame)
  const camera = cameraAt(ofType(sorted, 'camera'), frame, reduced)
  const cursor = timeline.liveFootage ? cursorAt([], timeline.seed, frame, reduced, false) : cursorAt(ofType(sorted, 'cursor'), timeline.seed, frame, reduced, overlays.cursor !== false)
  return { camera, cursor, anchors: anchorsAt(timeline.anchors, camera, overlays), overlays }
}

/**
 * `resolveFrame(timeline, frame)`: sort events by `(frame, seq)`, reduce all actions up to `frame`
 * from the immutable initial state, then derive the view and the active interpolations from the
 * frame alone. Nothing carries over from any earlier call, so any seek order gives the same result.
 */
export function resolveFrame(timeline: Timeline, frame: number, options: ResolveOptions = {}): ResolvedFrame {
  checkFrame(timeline, frame)
  const reduced = options.reducedMotion === true
  const sorted = sortEvents(timeline.events)
  const fold = foldActions(timeline, sorted, frame)
  const geometry = geometryAt(timeline, sorted, frame, reduced)

  const outlineEvents = ofType(sorted, 'outline')
  const cursorEvents = ofType(sorted, 'cursor')
  const hoverChanges = cursorEvents.flatMap((event) => [
    { frame: event.frame, target: null },
    { frame: landingFrame(event), target: event.target ?? null },
  ])
  const candidates: { anchor: string; kind: OutlineKind; alpha: number }[] = []
  if (geometry.cursor.visible) for (const f of fadeAt(hoverChanges, frame, reduced)) candidates.push({ anchor: f.target, kind: 'hover', alpha: f.alpha })
  for (const f of fadeAt(outlineChanges(outlineEvents, 'focus'), frame, reduced)) candidates.push({ anchor: f.target, kind: 'focus', alpha: f.alpha })
  for (const f of fadeAt(outlineChanges(outlineEvents, 'selected'), frame, reduced)) candidates.push({ anchor: f.target, kind: 'selected', alpha: f.alpha })
  for (const [anchor, since] of Object.entries(fold.selectedSince)) {
    candidates.push({ anchor, kind: 'selected', alpha: reduced ? 1 : fadeAt([{ frame: since, target: anchor }], frame, false)[0]?.alpha ?? 1 })
  }

  const running = isRunning(fold.state)
  const orbitFrame = running && !reduced && fold.runningSince !== null ? frame - fold.runningSince : 0
  const orbit: OrbitView = { running, frame: orbitFrame, phase: orbitPhase(orbitFrame) }

  const { overlays, ...rest } = geometry
  const rejections: TimelineRejection[] = fold.outcomes.flatMap((outcome) => (outcome.rejection ? [{ frame: outcome.frame, seq: outcome.seq, rejection: outcome.rejection }] : []))
  const applied = fold.outcomes.flatMap((outcome) => (outcome.rejection ? [] : [{ frame: outcome.frame, seq: outcome.seq, action: outcome.action }]))
  return {
    frame,
    seconds: frame / FPS,
    state: fold.state,
    rejections,
    applied,
    view: {
      ...rest,
      outlines: resolveOutlines(candidates, rest.anchors, timeline.anchors),
      texts: timeline.liveFootage ? {} : textsAt(ofType(sorted, 'type'), overlays, frame, reduced),
      overlays,
      orbit,
    },
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SLUG = /^[a-z0-9][a-z0-9-]*$/
const UINT32_MAX = 0xffffffff

/**
 * Authoring checks the capture must pass before it runs. Returns every problem found, empty when sound:
 * event order and uniqueness, FRT-01 travel and landing, click/action coincidence, scripted rejections,
 * type rates and live-footage purity.
 */
export function validateTimeline(timeline: Timeline): readonly string[] {
  const problems: string[] = []
  const add = (message: string): void => void problems.push(message)
  if (timeline.fps !== 30) add(`fps must be 30, got ${String(timeline.fps)}.`)
  if (!Number.isInteger(timeline.durationFrames) || timeline.durationFrames <= 0) add('durationFrames must be a positive integer.')
  if (!Number.isInteger(timeline.seed) || timeline.seed < 0 || timeline.seed > UINT32_MAX) add('seed must be an unsigned 32-bit integer.')
  if (!SLUG.test(timeline.cut) || !SLUG.test(timeline.clipId)) add('cut and clipId must be lowercase slugs.')
  if (timeline.startAt !== undefined && !isStateId(timeline.startAt)) add(`startAt ${String(timeline.startAt)} is not a state.`)

  for (const [name, spec] of Object.entries(timeline.anchors)) {
    const { x, y, width, height } = spec.rect
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) add(`anchor ${name} needs a finite rectangle with positive size.`)
    if (spec.radius !== undefined && (spec.radius < 4 || spec.radius > 6)) add(`anchor ${name} radius must be 4-6 px.`)
  }

  const events = timeline.events
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i] as FilmEvent
    const label = `event ${i} (${event.type} @ ${event.frame}/${event.seq})`
    if (!Number.isInteger(event.frame) || event.frame < 0 || event.frame >= timeline.durationFrames) add(`${label}: frame is outside 0-${timeline.durationFrames - 1}.`)
    if (!Number.isInteger(event.seq) || event.seq < 0) add(`${label}: seq must be a non-negative integer.`)
    const previous = events[i - 1]
    if (previous) {
      const order = compareEvents(previous, event)
      if (order > 0) add(`${label}: events must be sorted by (frame, seq).`)
      if (order === 0) add(`${label}: duplicates the (frame, seq) of the event before it.`)
    }
  }

  const sorted = sortEvents(events)
  const cameraEvents = ofType(sorted, 'camera')
  const cursorEvents = ofType(sorted, 'cursor')

  if (timeline.liveFootage && (cursorEvents.length > 0 || ofType(sorted, 'type').length > 0)) {
    add('live footage never carries an overlay cursor or synthetic typing.')
  }

  cameraEvents.forEach((event, i) => {
    const label = `camera @ ${event.frame}/${event.seq}`
    if (!Number.isInteger(event.duration) || event.duration < 0 || event.frame + event.duration > timeline.durationFrames - 1) add(`${label}: duration must end inside the clip.`)
    if (!(event.from[2] > 0 && event.to[2] > 0)) add(`${label}: zoom must be positive.`)
    const expected = cameraAt(cameraEvents.slice(0, i) as readonly CameraEvent[], event.frame, false)
    const [fx, fy, fz] = event.from
    if (Math.abs(fx - expected.x) > 1e-9 || Math.abs(fy - expected.y) > 1e-9 || Math.abs(fz - expected.zoom) > 1e-9) add(`${label}: from must equal the camera when the move starts.`)
  })

  const actionFrames = new Set(ofType(sorted, 'action').map((event) => event.frame))
  cursorEvents.forEach((event, i) => {
    const label = `cursor @ ${event.frame}/${event.seq}`
    const landing = landingFrame(event)
    const placed = event.duration === 0
    if (!Number.isInteger(event.duration) || !(placed || (event.duration >= TRAVEL_MIN_FRAMES && event.duration <= TRAVEL_MAX_FRAMES))) {
      add(`${label}: travel must be 0 (placed) or ${TRAVEL_MIN_FRAMES}-${TRAVEL_MAX_FRAMES} frames (350-900 ms), got ${event.duration}.`)
    }
    if (placed && (event.from[0] !== event.to[0] || event.from[1] !== event.to[1] || event.click)) add(`${label}: a placed pointer needs from = to and no click.`)
    if (landing > timeline.durationFrames - 1) add(`${label}: lands after the last frame.`)
    const next = cursorEvents[i + 1]
    if (next && next.frame < landing) add(`${label}: the next pointer move starts before this one lands.`)
    // A placed pointer (duration 0) is a hard-cut jump to a new spot, so only travelling moves must continue from where the last one ended.
    if (next && next.duration !== 0 && (next.from[0] !== event.to[0] || next.from[1] !== event.to[1])) add(`${label}: the next pointer move must start where this one ended, at ${event.to[0]},${event.to[1]}.`)
    if (event.click && event.inert !== true && !actionFrames.has(landing)) add(`${label}: a click needs a reducer action at its landing frame ${landing}, or inert: true.`)
    if (event.target !== undefined) {
      if (!(event.target in timeline.anchors)) {
        add(`${label}: target ${event.target} is not an anchor.`)
      } else if (landing <= timeline.durationFrames - 1 && Number.isInteger(event.duration)) {
        const first = event.frame + Math.floor(event.duration * OVERSHOOT_PEAK)
        const lastHover = Math.min(next ? next.frame - 1 : Infinity, timeline.durationFrames - 1)
        for (let f = first; f <= lastHover; f += 1) {
          const geometry = geometryAt(timeline, sorted, f, false)
          const rect = geometry.anchors[event.target]?.rect
          const { x, y } = geometry.cursor
          if (!rect || x === null || y === null || !containsPoint(rect, x, y)) {
            add(`${label}: the tip is ${f <= landing ? 'outside' : 'no longer inside'} ${event.target} at frame ${f}.`)
            break
          }
        }
      }
    }
  })

  for (const event of ofType(sorted, 'type')) {
    const label = `type ${event.target} @ ${event.frame}/${event.seq}`
    if (event.text.length === 0) add(`${label}: text is empty.`)
    if (!(event.charsPerSecond >= TYPE_MIN_CPS && event.charsPerSecond <= TYPE_MAX_CPS)) add(`${label}: charsPerSecond must be ${TYPE_MIN_CPS}-${TYPE_MAX_CPS}.`)
    if (!Number.isInteger(event.seed) || event.seed < 0 || event.seed > UINT32_MAX) add(`${label}: seed must be an unsigned 32-bit integer.`)
  }
  for (const event of ofType(sorted, 'outline')) {
    if (event.target !== null && !(event.target in timeline.anchors)) add(`outline @ ${event.frame}/${event.seq}: ${event.target} is not an anchor.`)
  }

  if (problems.length === 0) {
    const fold = foldActions(timeline, sorted, timeline.durationFrames - 1)
    for (const outcome of fold.outcomes) {
      const label = `action ${outcome.action.type} @ ${outcome.frame}/${outcome.seq}`
      if (outcome.expect === 'rejected' && !outcome.rejection) add(`${label}: scripted as rejected but the reducer accepted it.`)
      if (outcome.expect !== 'rejected' && outcome.rejection) add(`${label}: rejected by the reducer (${outcome.rejection.guard}): ${outcome.rejection.reason}`)
    }
  }
  return problems
}

// ---------------------------------------------------------------------------
// Parsing a timeline file
// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function fail(path: string, expected: string): never {
  throw new TypeError(`Timeline ${path}: expected ${expected}.`)
}
const num = (value: unknown, path: string): number => (typeof value === 'number' && Number.isFinite(value) ? value : fail(path, 'a finite number'))
const str = (value: unknown, path: string): string => (typeof value === 'string' ? value : fail(path, 'a string'))
const bool = (value: unknown, path: string): boolean => (typeof value === 'boolean' ? value : fail(path, 'a boolean'))
const tuple = (value: unknown, length: 2 | 3, path: string): readonly number[] =>
  Array.isArray(value) && value.length === length ? value.map((item, i) => num(item, `${path}[${i}]`)) : fail(path, `${length} numbers`)

function parseRect(value: unknown, path: string): AnchorSpec['rect'] {
  if (!isRecord(value)) return fail(path, 'a rectangle')
  return { x: num(value.x, `${path}.x`), y: num(value.y, `${path}.y`), width: num(value.width, `${path}.width`), height: num(value.height, `${path}.height`) }
}

function parseEvent(value: unknown, path: string): FilmEvent {
  if (!isRecord(value)) return fail(path, 'an event object')
  const base = { frame: num(value.frame, `${path}.frame`), seq: num(value.seq, `${path}.seq`), ...(value.entry === undefined ? {} : { entry: str(value.entry, `${path}.entry`) }) }
  switch (value.type) {
    case 'action': {
      if (!isRecord(value.action) || typeof value.action.type !== 'string') return fail(`${path}.action`, 'an action with a string type')
      const expect = value.expect === undefined ? {} : value.expect === 'rejected' ? { expect: 'rejected' as const } : fail(`${path}.expect`, "'rejected'")
      return { ...base, type: 'action', action: value.action as unknown as Action, ...expect }
    }
    case 'camera': {
      const from = tuple(value.from, 3, `${path}.from`)
      const to = tuple(value.to, 3, `${path}.to`)
      if (value.easing !== 'reveal') return fail(`${path}.easing`, "'reveal'")
      return { ...base, type: 'camera', from: [from[0] as number, from[1] as number, from[2] as number], to: [to[0] as number, to[1] as number, to[2] as number], duration: num(value.duration, `${path}.duration`), easing: 'reveal' }
    }
    case 'cursor': {
      const point = (key: 'from' | 'c1' | 'c2' | 'to') => {
        const [px, py] = tuple(value[key], 2, `${path}.${key}`)
        return [px as number, py as number] as const
      }
      return {
        ...base,
        type: 'cursor',
        from: point('from'),
        c1: point('c1'),
        c2: point('c2'),
        to: point('to'),
        duration: num(value.duration, `${path}.duration`),
        click: bool(value.click, `${path}.click`),
        ...(value.target === undefined ? {} : { target: str(value.target, `${path}.target`) }),
        ...(value.inert === undefined ? {} : value.inert === true ? { inert: true as const } : fail(`${path}.inert`, 'true')),
      }
    }
    case 'type':
      return {
        ...base,
        type: 'type',
        target: str(value.target, `${path}.target`),
        text: str(value.text, `${path}.text`),
        charsPerSecond: num(value.charsPerSecond, `${path}.charsPerSecond`),
        seed: num(value.seed, `${path}.seed`),
        ...(value.before === undefined ? {} : { before: str(value.before, `${path}.before`) }),
        ...(value.selectHoldFrames === undefined ? {} : { selectHoldFrames: num(value.selectHoldFrames, `${path}.selectHoldFrames`) }),
      }
    case 'overlay':
      return { ...base, type: 'overlay', id: str(value.id, `${path}.id`), visible: bool(value.visible, `${path}.visible`) }
    case 'outline': {
      if (value.mode !== 'focus' && value.mode !== 'selected') return fail(`${path}.mode`, "'focus' or 'selected'")
      return { ...base, type: 'outline', target: value.target === null ? null : str(value.target, `${path}.target`), mode: value.mode }
    }
    default:
      return fail(`${path}.type`, 'action, camera, cursor, type, overlay or outline')
  }
}

const SELECTION_FIELDS: readonly SelectionField[] = ['selectedCase', 'selectedScenario', 'commitmentDue', 'commitmentConfirmedDue', 'actorId']

/** Shape-check a parsed `*.timeline.json` at the trust boundary. Semantic checks are `validateTimeline`. */
export function parseTimeline(value: unknown): Timeline {
  if (!isRecord(value)) return fail('root', 'an object')
  if (value.fps !== 30) return fail('fps', '30')
  if (!isRecord(value.anchors)) return fail('anchors', 'an object')
  if (!Array.isArray(value.events)) return fail('events', 'an array')
  const anchors: Record<string, AnchorSpec> = {}
  for (const [name, raw] of Object.entries(value.anchors)) {
    if (!isRecord(raw)) return fail(`anchors.${name}`, 'an anchor object')
    let selects: AnchorSpec['selects']
    if (raw.selects !== undefined) {
      if (!isRecord(raw.selects) || !SELECTION_FIELDS.includes(raw.selects.field as SelectionField)) return fail(`anchors.${name}.selects.field`, SELECTION_FIELDS.join(', '))
      selects = { field: raw.selects.field as SelectionField, equals: str(raw.selects.equals, `anchors.${name}.selects.equals`) }
    }
    anchors[name] = {
      rect: parseRect(raw.rect, `anchors.${name}.rect`),
      ...(raw.radius === undefined ? {} : { radius: num(raw.radius, `anchors.${name}.radius`) }),
      ...(selects ? { selects } : {}),
    }
  }
  const startAt = value.startAt === undefined ? undefined : str(value.startAt, 'startAt')
  if (startAt !== undefined && !isStateId(startAt)) return fail('startAt', 'a state id')
  if (value.assets !== undefined && !Array.isArray(value.assets)) return fail('assets', 'an array of paths')
  const assets = value.assets === undefined ? undefined : (value.assets as unknown[]).map((item, i) => str(item, `assets[${i}]`))
  return {
    fps: 30,
    durationFrames: num(value.durationFrames, 'durationFrames'),
    seed: num(value.seed, 'seed'),
    cut: str(value.cut, 'cut'),
    clipId: str(value.clipId, 'clipId'),
    ...(startAt === undefined ? {} : { startAt }),
    ...(value.scene === undefined ? {} : { scene: str(value.scene, 'scene') }),
    ...(value.theme === undefined ? {} : value.theme === 'light' || value.theme === 'dark' ? { theme: value.theme } : fail('theme', "'light' or 'dark'")),
    ...(value.filmStartFrame === undefined ? {} : { filmStartFrame: num(value.filmStartFrame, 'filmStartFrame') }),
    ...(assets === undefined ? {} : { assets }),
    ...(value.liveFootage === undefined ? {} : value.liveFootage === true ? { liveFootage: true as const } : fail('liveFootage', 'true')),
    anchors,
    events: value.events.map((event, i) => parseEvent(event, `events[${i}]`)),
  }
}
