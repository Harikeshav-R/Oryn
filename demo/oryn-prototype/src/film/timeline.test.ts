import { describe, expect, test } from 'bun:test'
import sampleJson from '../../film/sample/runtime-check.timeline.json'
import { ORBIT_FRAMES, orbitPhase } from '@/lib/frame'
import { CANONICAL_SCRIPT, isRunning } from '@/state'
import { buildSidecar, parseTimeline, resolveFrame, sampleGeometry, toViewport, validateTimeline } from './index'
import { cameraAt } from './geometry'
import type { CameraEvent, CursorEvent, FilmEvent, ResolvedFrame, Timeline } from './types'

const sample: Timeline = parseTimeline(sampleJson)
const anchor = (name: string) => (sample.anchors[name] as Timeline['anchors'][string]).rect

/** Seeded generator for seek orders: a test input, not film code. */
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const snapshot = (resolved: ResolvedFrame): string => JSON.stringify(resolved)

function expectProblem(timeline: Timeline, fragment: string): void {
  expect(validateTimeline(timeline).some((problem) => problem.includes(fragment))).toBe(true)
}

const withEvents = (events: readonly FilmEvent[], extra: Partial<Timeline> = {}): Timeline => ({ ...sample, events, ...extra })

describe('sample timeline', () => {
  test('is a sound film: every authoring check passes', () => {
    expect(validateTimeline(sample)).toEqual([])
  })

  test('is sorted by (frame, seq) with unique keys, as written to disk', () => {
    const keys = sample.events.map((event) => event.frame * 1000 + event.seq)
    expect(keys).toEqual([...keys].sort((a, b) => a - b))
    expect(new Set(keys).size).toBe(keys.length)
  })

  test('rejects a malformed file at the boundary', () => {
    expect(() => parseTimeline({ ...sampleJson, fps: 60 })).toThrow('fps')
    expect(() => parseTimeline({ ...sampleJson, events: [{ frame: 1, seq: 0, type: 'teleport' }] })).toThrow('events[0].type')
    expect(() => parseTimeline({ ...sampleJson, startAt: 'ST99' })).toThrow('startAt')
  })
})

describe('seeking', () => {
  const long: Timeline = { ...sample, durationFrames: 900 }

  test('frame 720 resolves identically after any seek order', () => {
    const fresh = snapshot(resolveFrame(long, 720))
    const next = lcg(7)
    for (let round = 0; round < 6; round += 1) {
      const frames = Array.from({ length: 40 }, () => Math.floor(next() * 900))
      for (const frame of frames) resolveFrame(long, frame)
      expect(snapshot(resolveFrame(long, 720))).toBe(fresh)
    }
  })

  test('a reverse sweep reproduces every frame of the forward sweep', () => {
    const forward = Array.from({ length: sample.durationFrames }, (_, frame) => snapshot(resolveFrame(sample, frame)))
    for (let frame = sample.durationFrames - 1; frame >= 0; frame -= 1) {
      expect(snapshot(resolveFrame(sample, frame))).toBe(forward[frame] as string)
    }
  })

  test('reducing from the initial snapshot makes a backward seek restore the earlier state', () => {
    const early = resolveFrame(sample, 100)
    resolveFrame(sample, 400)
    const again = resolveFrame(sample, 100)
    expect(again.state).toEqual(early.state)
    expect(again.state.commitment.due).toBe('Fri 17:00')
    expect(again.state.selectedCase).toBe('INV-48219')
  })

  test('refuses a frame outside the clip', () => {
    expect(() => resolveFrame(sample, -1)).toThrow(RangeError)
    expect(() => resolveFrame(sample, sample.durationFrames)).toThrow(RangeError)
    expect(() => resolveFrame(sample, 1.5)).toThrow(RangeError)
  })
})

describe('event order', () => {
  const select = (caseId: string, seq: number): FilmEvent => ({ frame: 20, seq, type: 'action', action: { type: 'SELECT_CASE', caseId } })

  test('same-frame events apply in seq order wherever they sit in the file', () => {
    const forward = withEvents([select('INV-48219', 0), select('INV-48220', 1)])
    const shuffled = withEvents([select('INV-48220', 1), select('INV-48219', 0)])
    expect(resolveFrame(forward, 20).state.selectedCase).toBe('INV-48220')
    expect(snapshot(resolveFrame(shuffled, 20))).toBe(snapshot(resolveFrame(forward, 20)))
  })

  test('validation flags unsorted and duplicated (frame, seq)', () => {
    expectProblem(withEvents([select('INV-48220', 1), select('INV-48219', 0)]), 'sorted')
    expectProblem(withEvents([select('INV-48219', 0), select('INV-48220', 0)]), 'duplicates')
  })
})

describe('click and reducer action coincide (FRT-01)', () => {
  test('the pointer presses on the frame the action lands, with the ring starting then', () => {
    const before = resolveFrame(sample, 29)
    const at = resolveFrame(sample, 30)
    expect(before.state.selectedCase).toBeNull()
    expect(before.view.cursor.phase).toBe('travel')
    expect(before.view.cursor.ring).toBeNull()
    expect(at.state.selectedCase).toBe('INV-48219')
    expect(at.view.cursor.phase).toBe('press')
    expect(at.view.cursor.pressScale).toBe(0.97)
    expect(at.view.cursor.ring?.progress).toBe(0)
  })

  test('press lasts 90 ms and the ring 260 ms, then the pointer rests hovering its target', () => {
    expect(resolveFrame(sample, 32).view.cursor.pressScale).toBe(0.97)
    expect(resolveFrame(sample, 33).view.cursor.pressScale).toBe(1)
    expect(resolveFrame(sample, 37).view.cursor.ring).not.toBeNull()
    expect(resolveFrame(sample, 38).view.cursor.ring).toBeNull()
    expect(resolveFrame(sample, 38).view.cursor.phase).toBe('hover')
    expect(resolveFrame(sample, 38).view.cursor.target).toBe('invoice-number')
  })

  test('the tip lands inside the named target', () => {
    for (const event of sample.events.filter((e): e is CursorEvent => e.type === 'cursor' && e.target !== undefined)) {
      const frame = event.frame + event.duration
      const { cursor, anchors } = sampleGeometry(sample, frame)
      const rect = anchors[event.target as string]?.rect
      expect(rect).not.toBeNull()
      expect(cursor.x).toBe(event.to[0])
      expect(cursor.y).toBe(event.to[1])
      const r = rect as NonNullable<typeof rect>
      expect(cursor.x as number).toBeGreaterThanOrEqual(r.x)
      expect(cursor.x as number).toBeLessThanOrEqual(r.x + r.width)
      expect(cursor.y as number).toBeGreaterThanOrEqual(r.y)
      expect(cursor.y as number).toBeLessThanOrEqual(r.y + r.height)
    }
  })

  test('the pointer is hidden before its first move and nothing is fabricated', () => {
    const { cursor } = resolveFrame(sample, 5).view
    expect(cursor).toMatchObject({ visible: false, phase: 'hidden', x: null, y: null })
  })

  describe('validation', () => {
    const move = sample.events.find((e): e is CursorEvent => e.type === 'cursor' && e.frame === 12) as CursorEvent
    const patch = (change: Partial<CursorEvent>): Timeline => withEvents(sample.events.map((e) => (e === move ? { ...move, ...change } : e)))

    test('a click with no reducer action at its landing frame is rejected unless inert', () => {
      expectProblem(withEvents(sample.events.filter((e) => !(e.type === 'action' && e.frame === 30))), 'needs a reducer action at its landing frame 30')
    })

    test('a tip outside its named target is rejected', () => {
      expectProblem(patch({ to: [400, 132] }), 'tip is outside invoice-number')
    })

    test('travel outside 350-900 ms is rejected', () => {
      expectProblem(patch({ duration: 10 }), 'travel must be')
      expectProblem(patch({ duration: 28 }), 'travel must be')
    })

    test('a pan that carries the hovered target away from a still pointer is rejected', () => {
      expectProblem(withEvents(sample.events.filter((e) => !(e.type === 'cursor' && e.frame === 186))), 'no longer inside confirm-button')
    })

    test('a pointer move that does not start where the last one ended is rejected', () => {
      const jump = sample.events.map((e) => (e.type === 'cursor' && e.frame === 45 ? { ...e, from: [10, 10] as const } : e))
      expectProblem(withEvents(jump), 'must start where this one ended')
    })

    test('typing outside 28-34 chars/s is rejected', () => {
      const slow = sample.events.map((e) => (e.type === 'type' && e.target === 'url-pill' ? { ...e, charsPerSecond: 40 } : e))
      expectProblem(withEvents(slow), 'charsPerSecond must be 28-34')
    })
  })
})

describe('scripted rejections', () => {
  const blocked: FilmEvent = { frame: 40, seq: 0, type: 'action', action: { type: 'APPROVE_RELEASE' } }

  test('an action the reducer rejects must be scripted as rejected, and then keeps the previous state', () => {
    expectProblem(withEvents([blocked]), 'rejected by the reducer')
    const scripted = withEvents([{ ...blocked, expect: 'rejected' }])
    expect(validateTimeline(scripted)).toEqual([])
    const resolved = resolveFrame(scripted, 40)
    expect(resolved.rejections).toHaveLength(1)
    expect(resolved.rejections[0]?.rejection.action).toBe('APPROVE_RELEASE')
    expect(resolved.state.phase).toBe('ST03')
    expect(resolveFrame(scripted, 39).rejections).toEqual([])
  })

  test('an action scripted as rejected that the reducer accepts is rejected by validation', () => {
    const accepted: FilmEvent = { frame: 40, seq: 0, type: 'action', action: { type: 'SELECT_CASE', caseId: 'INV-48219' }, expect: 'rejected' }
    expectProblem(withEvents([accepted]), 'scripted as rejected')
  })
})

describe('typing and the deadline (FRT-03)', () => {
  test('the deadline changes only after the edit action, never while it is being typed', () => {
    for (const frame of [100, 116, 124, 130, 149]) expect(resolveFrame(sample, frame).state.commitment.due).toBe('Fri 17:00')
    const during = resolveFrame(sample, 128).view.texts['deadline-field']
    expect(during?.complete).toBe(false)
    expect(resolveFrame(sample, 140).view.texts['deadline-field']).toMatchObject({ text: 'Fri 12:00', complete: true })
    expect(resolveFrame(sample, 150).state.commitment.due).toBe('Fri 12:00')
    expect(resolveFrame(sample, 176).state.commitment).toMatchObject({ status: 'confirmed', confirmedDue: 'Fri 12:00' })
  })

  test('the selected old deadline is shown before the first replacement character', () => {
    expect(resolveFrame(sample, 116).view.texts['deadline-field']).toMatchObject({ text: 'Fri 17:00', selected: true, caret: false })
    expect(resolveFrame(sample, 100).view.texts['deadline-field']).toBeUndefined()
  })

  test('the same frame shows the same prefix in any order and the typed strings are exact', () => {
    const prefix = (frame: number) => resolveFrame(sample, frame).view.texts['url-pill']?.text
    const first = [400, 410, 420, 430].map(prefix)
    const back = [430, 420, 410, 400].map(prefix).reverse()
    expect(back).toEqual(first)
    expect(resolveFrame(sample, 479).view.texts['url-pill']?.text).toBe('https://github.com/Harikeshav-R/Oryn')
    expect(resolveFrame(sample, 479).view.texts['intent-field']?.text).toBe('Reconcile supplier invoices against purchase orders and stage the result in the ERP.')
  })

  test('the caret is solid while typing and blinks on a frame-derived wave afterwards', () => {
    const caret = (frame: number) => resolveFrame(sample, frame).view.texts['url-pill']?.caret
    expect(caret(410)).toBe(true)
    const done = Array.from({ length: 80 }, (_, i) => 400 + i).find((f) => resolveFrame(sample, f).view.texts['url-pill']?.complete) as number
    expect(caret(done)).toBe(true)
    expect(caret(done + 15)).toBe(false)
    expect(caret(done + 30)).toBe(true)
  })
})

describe('outlines (FRT-02)', () => {
  const outlineFor = (frame: number, name: string) => resolveFrame(sample, frame).view.outlines.find((o) => o.anchor === name)

  test('selection comes from reducer state: absent before the action, present after', () => {
    expect(outlineFor(29, 'invoice-number')?.kind).not.toBe('selected')
    expect(outlineFor(40, 'invoice-number')?.kind).toBe('selected')
    expect(resolveFrame(sample, 40).state.selectedCase).toBe('INV-48219')
  })

  test('the outline tracks its target through the camera pan', () => {
    for (let frame = 190; frame <= 260; frame += 1) {
      const resolved = resolveFrame(sample, frame)
      const outline = resolved.view.outlines.find((o) => o.anchor === 'invoice-amount' && o.kind === 'selected')
      expect(outline).toBeDefined()
      const events = sample.events.filter((e): e is CameraEvent => e.type === 'camera')
      const expected = toViewport(anchor('invoice-amount'), cameraAt(events, frame, false))
      expect(outline?.target).toEqual(expected)
    }
    const panned = resolveFrame(sample, 230).view.anchors['invoice-amount']?.rect as { x: number }
    expect(panned.x).not.toBe(anchor('invoice-amount').x)
  })

  test('the 2 px stroke surrounds the target and never covers it', () => {
    for (const frame of [40, 70, 115, 235]) {
      for (const o of resolveFrame(sample, frame).view.outlines) {
        expect(o.box).toEqual({ x: o.target.x - 2, y: o.target.y - 2, width: o.target.width + 4, height: o.target.height + 4 })
        expect(o.width).toBe(2)
        if (o.handle) {
          const overlaps = o.handle.x < o.target.x + o.target.width && o.handle.y < o.target.y + o.target.height
          expect(overlaps).toBe(false)
        }
      }
    }
  })

  test('hover, keyboard focus and selection differ by shape, not only by colour', () => {
    const hover = outlineFor(178, 'confirm-button') // pointer arrived at 176, fading in
    const focus = outlineFor(120, 'deadline-field')
    const selected = outlineFor(70, 'invoice-amount')
    expect(hover?.kind).toBe('hover')
    expect(hover).toMatchObject({ ring: null, handle: null })
    expect(focus?.kind).toBe('focus')
    expect(focus?.ring).not.toBeNull()
    expect(selected?.kind).toBe('selected')
    expect(selected?.handle).not.toBeNull()
  })

  test('focus does not mutate data: only the edit and confirm actions change the commitment', () => {
    expect(resolveFrame(sample, 110).state.commitment).toEqual(resolveFrame(sample, 100).state.commitment)
  })

  test('a fade is opacity only, 150 ms, reaching full by 5 frames', () => {
    const alpha = (frame: number) => outlineFor(frame, 'deadline-field')?.alpha ?? 0
    expect(alpha(110)).toBe(0)
    expect(alpha(111)).toBeGreaterThan(0)
    expect(alpha(111)).toBeLessThan(alpha(113))
    expect(alpha(115)).toBe(1)
  })
})

describe('reduced motion', () => {
  test('keeps every label: full text, snapped pointer, no ring, instant outlines, static orbit', () => {
    const reduced = resolveFrame(sample, 125, { reducedMotion: true })
    expect(reduced.view.texts['deadline-field']).toMatchObject({ text: 'Fri 12:00', complete: true, selected: false, caret: true })
    expect(reduced.view.cursor).toMatchObject({ x: 200, y: 276, ring: null, pressScale: 1 })
    expect(reduced.view.outlines.find((o) => o.anchor === 'deadline-field')?.alpha).toBe(1)
    expect(reduced.view.orbit.frame).toBe(0)
    expect(resolveFrame(sample, 478, { reducedMotion: true }).view.texts['url-pill']?.text).toBe('https://github.com/Harikeshav-R/Oryn')
  })

  test('the camera snaps to its destination at the event frame', () => {
    expect(resolveFrame(sample, 200, { reducedMotion: true }).view.camera).toEqual({ x: 560, y: 330, zoom: 1.25 })
    expect(resolveFrame(sample, 199, { reducedMotion: true }).view.camera).toEqual({ x: 640, y: 360, zoom: 1 })
  })

  test('does not change the reducer state', () => {
    for (const frame of [30, 150, 300]) {
      expect(resolveFrame(sample, frame, { reducedMotion: true }).state).toEqual(resolveFrame(sample, frame).state)
    }
  })
})

describe('execution orbit (no idle cyan)', () => {
  const full: Timeline = {
    ...sample,
    cut: 'sample',
    clipId: 'canonical',
    startAt: undefined,
    anchors: {},
    durationFrames: CANONICAL_SCRIPT.length * 3 + 10,
    events: CANONICAL_SCRIPT.map((action, index): FilmEvent => ({ frame: index * 3, seq: 0, type: 'action', action })),
  }

  test('the canonical script is a sound film and the orbit is running exactly while the reducer executes', () => {
    expect(validateTimeline(full)).toEqual([])
    let sawRunning = false
    for (let frame = 0; frame < full.durationFrames; frame += 1) {
      const { state, view } = resolveFrame(full, frame)
      expect(view.orbit.running).toBe(isRunning(state))
      if (!view.orbit.running) expect(view.orbit.frame).toBe(0)
      sawRunning ||= view.orbit.running
    }
    expect(sawRunning).toBe(true)
  })

  test('reduced motion keeps the running label but freezes the orbit at its start', () => {
    const running = Array.from({ length: full.durationFrames }, (_, f) => f).filter((f) => resolveFrame(full, f).view.orbit.running)
    expect(running.length).toBeGreaterThan(0)
    for (const frame of running) expect(resolveFrame(full, frame, { reducedMotion: true }).view.orbit).toEqual({ running: true, frame: 0, phase: 0 })
  })

  test('ends neutral and static once execution stops', () => {
    const last = resolveFrame(full, full.durationFrames - 1)
    expect(isRunning(last.state)).toBe(false)
    expect(last.view.orbit).toEqual({ running: false, frame: 0, phase: 0 })
  })

  test('a run counts its orbit from the frame it began, 54 frames per 1.8 s turn', () => {
    const start = Array.from({ length: full.durationFrames }, (_, f) => f).find((f) => resolveFrame(full, f).view.orbit.running) as number
    expect(resolveFrame(full, start).view.orbit.frame).toBe(0)
    expect(ORBIT_FRAMES).toBe(54)
    expect(orbitPhase(54)).toBe(0)
    expect(orbitPhase(27)).toBe(0.5)
    const later = resolveFrame(full, start + 2)
    if (later.view.orbit.running) expect(later.view.orbit.frame).toBe(2)
  })
})

describe('live footage', () => {
  test('carries no overlay pointer and no synthetic typing, and validation forbids both', () => {
    const bob: Timeline = { ...sample, clipId: 'bob-review', liveFootage: true, events: [] }
    expect(validateTimeline(bob)).toEqual([])
    const view = resolveFrame(bob, 100).view
    expect(view.cursor.visible).toBe(false)
    expect(view.texts).toEqual({})
    expectProblem({ ...sample, liveFootage: true }, 'live footage never carries')
    expect(resolveFrame({ ...sample, liveFootage: true }, 130).view.cursor.visible).toBe(false)
    expect(resolveFrame({ ...sample, liveFootage: true }, 479).view.texts).toEqual({})
  })
})

describe('sidecar', () => {
  const sidecar = buildSidecar(sample)

  test('declares its identity, space and frame accounting', () => {
    expect(sidecar).toMatchObject({ cut: 'sample', clipId: 'runtime-check', fps: 30, width: 2560, height: 1440, coordinateSpace: 'authored-css-1280x720', frameCount: 480, durationSeconds: 16 })
    expect(sidecar.cursor).toHaveLength(480)
    expect(sidecar.cursor[479]?.frame).toBe(479)
    for (const samples of Object.values(sidecar.anchors)) expect(samples).toHaveLength(480)
  })

  test('a hidden pointer is explicit and a visible one lands inside its anchor rectangle', () => {
    expect(sidecar.cursor[0]).toEqual({ frame: 0, x: null, y: null, visible: false, phase: 'hidden' })
    const landing = sidecar.cursor[30]
    const rect = sidecar.anchors['invoice-number']?.[30]?.rect as { x: number; y: number; width: number; height: number }
    expect(landing?.visible).toBe(true)
    expect(landing?.x as number).toBeGreaterThanOrEqual(rect.x)
    expect(landing?.x as number).toBeLessThanOrEqual(rect.x + rect.width)
  })

  test('anchor rectangles follow the camera and are byte-stable across builds', () => {
    expect(sidecar.anchors['invoice-amount']?.[0]?.rect).toEqual(anchor('invoice-amount'))
    expect(sidecar.anchors['invoice-amount']?.[230]?.rect?.x).not.toBe(anchor('invoice-amount').x)
    expect(JSON.stringify(buildSidecar(sample))).toBe(JSON.stringify(sidecar))
  })
})
