import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { anchorHidden, authorClip, formatTimeline } from '../../scripts/author-product-clips'
import { CLIPS, startFrameOf } from '../../scripts/clips'
import { buildSidecar, parseTimeline, resolveFrame, validateTimeline } from '@/film'
import type { ResolvedFrame, Timeline } from '@/film'
import { observationActive } from '@/state'
import { ProductFilmSurface } from './FilmProduct'
import { CLIP_SPECS } from './clip-specs'
import type { ClipSpec } from './clip-specs'

const FILM = path.resolve(import.meta.dir, '../../film')
const fileOf = (spec: ClipSpec): string => path.join(FILM, spec.cut, `${spec.clipId}.timeline.json`)
const specOf = (clipId: string): ClipSpec => CLIP_SPECS.find((spec) => spec.clipId === clipId) as ClipSpec
const load = (spec: ClipSpec): Timeline => parseTimeline(JSON.parse(readFileSync(fileOf(spec), 'utf8')))
const markup = (resolved: ResolvedFrame): string => renderToStaticMarkup(createElement(ProductFilmSurface, { resolved }))
const at = (timeline: Timeline, frame: number): ResolvedFrame => resolveFrame(timeline, frame)

const HK = specOf('hk-h4a-enroll')
const LK = specOf('lk-l4-privacy')
const hk = load(HK)
const lk = load(LK)

describe('BOB-04 timelines match the roadmap table and the storyboard entries', () => {
  for (const spec of CLIP_SPECS) {
    const timeline = load(spec)
    const clip = CLIPS.find((item) => item.clipId === spec.clipId)

    test(`${spec.clipId}: validates, has the table length and carries clip-local entries`, () => {
      expect(validateTimeline(timeline)).toEqual([])
      expect(clip).toBeDefined()
      if (clip?.frames) expect(timeline.durationFrames).toBe(clip.frames)
      if (clip) expect(timeline.filmStartFrame).toBe(startFrameOf(clip))
      for (const event of timeline.events) {
        expect(event.entry).toMatch(clip?.entry ?? /^$/)
        expect(event.entry).toBe(spec.entryAt(event.frame))
      }
    })

    test(`${spec.clipId}: the JSON on disk is exactly what the spec generates`, () => {
      expect(readFileSync(fileOf(spec), 'utf8')).toBe(formatTimeline(authorClip(spec)))
    }, 60_000)
  }

  test('hackathon covers H-057 to H-062 in 180 frames and launch L-035 to L-046 in 360', () => {
    expect(new Set(hk.events.map((event) => event.entry))).toEqual(new Set(['H-057', 'H-058', 'H-059', 'H-060', 'H-061', 'H-062']))
    expect(hk.durationFrames).toBe(180)
    expect(lk.durationFrames).toBe(360)
  })

  test('no stage caption, subtitle or camera move is baked into a product clip', () => {
    for (const timeline of [hk, lk]) {
      expect(timeline.events.some((event) => event.type === 'camera' || event.type === 'type')).toBe(false)
      for (let frame = 0; frame < timeline.durationFrames; frame += 30) {
        expect(markup(at(timeline, frame)).toLowerCase()).not.toMatch(/subtitle|caption/)
      }
    }
  })
})

describe('seeking: original and reversed order give the same frame', () => {
  const frames = (timeline: Timeline): number[] => [0, Math.floor(timeline.durationFrames / 2), timeline.durationFrames - 1]
  for (const [label, timeline] of [['hackathon', hk], ['launch', lk]] as const) {
    test(`${label}: first, middle and final frame are identical after a reverse pass`, () => {
      const forward = frames(timeline).map((frame) => JSON.stringify(at(timeline, frame)) + markup(at(timeline, frame)))
      const reverse = [...frames(timeline)].reverse().map((frame) => JSON.stringify(at(timeline, frame)) + markup(at(timeline, frame))).reverse()
      expect(reverse).toEqual(forward)
    })
  }
})

describe('the sidecar hides exactly what the screen hides, on every frame', () => {
  for (const spec of CLIP_SPECS) {
    test(`${spec.clipId}: anchor visibility and pointer samples agree with the rendered DOM`, () => {
      const timeline = load(spec)
      const sidecar = buildSidecar(timeline)
      for (let frame = 0; frame < timeline.durationFrames; frame += 1) {
        const resolved = at(timeline, frame)
        const html = markup(resolved)
        for (const name of Object.keys(timeline.anchors)) {
          const sample = sidecar.anchors[name]?.[frame]
          expect(sample?.visible).toBe(!anchorHidden(html, name))
          expect(sample?.rect === null).toBe(!sample?.visible)
        }
        // Passive observation is never the execution cyan; only a running evaluation (BOB-08), a running job (BOB-09) or a running regression (BOB-10) draws it.
        if (frame % 5 === 0 && !resolved.state.running.simulation && !resolved.state.running.job && !resolved.state.running.regression) expect(html.toLowerCase()).not.toMatch(/2fd8ff|--arc/)
      }
    }, 120_000)
  }

  test('the hackathon pointer is hidden for H-061 (frames 120-149) and shown again at H-062', () => {
    const { cursor } = buildSidecar(hk)
    expect(cursor.slice(120, 150).every((sample) => !sample.visible && sample.x === null)).toBe(true)
    expect(cursor[119]?.visible).toBe(true)
    expect(cursor[150]).toMatchObject({ visible: true, x: 1000, y: 24 })
  })
})

describe('accepted path (hackathon)', () => {
  test('capture is chosen without sharing, and the notice is acknowledged before it advances', () => {
    expect(at(hk, 12).state.consent.priya.noticeAccepted).toBe(false)
    expect(at(hk, 46).state.consent.priya.noticeAccepted).toBe(true)
    // The Capture and sharing step: work applications on, organizational contribution off.
    const chosen = at(hk, 70).state
    expect(chosen.consent.priya).toMatchObject({ workApplications: true, visualObservation: false, contribution: false })
    expect(chosen.ui.wizardStep).toBe('capture')
    expect(chosen.phase).toBe('ST01')
    expect(observationActive(chosen, 'priya')).toBe(false)
  })

  test('observation starts only when enrollment finishes at frame 90, and sharing stays off to the end', () => {
    expect(observationActive(at(hk, 89).state, 'priya')).toBe(false)
    const done = at(hk, 90).state
    expect(done.phase).toBe('ST02')
    expect(done.route).toBe('SC12')
    const last = at(hk, 179).state
    expect(observationActive(last, 'priya')).toBe(true)
    expect(last.consent.priya).toMatchObject({ contribution: false, paused: false })
    expect(last.consent.priya.meetings['zoom-kestrel']).toBe('absent')
  })

  test('H-062 ends on the open companion menu: Capture active and Pause, never clicked', () => {
    const final = at(hk, 179)
    expect(final.state.ui.overlay).toBe('companion')
    expect(final.view.cursor).toMatchObject({ target: 'pause-observation', phase: 'hover' })
    const html = markup(final)
    expect(html).toContain('Observation active')
    expect(html).toContain('Capture active')
    expect(html).toContain('Pause observation')
    expect(final.state.consent.priya.paused).toBe(false)
  })

  test('the protected fields are masked from the first frame that shows them', () => {
    const html = markup(at(hk, 105))
    for (const label of ['BANK ACCT', 'TAX ID', 'CARD']) expect(html).toContain(`aria-label="${label}: masked"`)
    expect(html).not.toMatch(/\d{4}[ -]\d{4}/)
  })
})

describe('pause and resume (launch)', () => {
  const stateAt = (frame: number) => at(lk, frame).state.consent.priya
  test('pause is one click and resume only an explicit later click', () => {
    expect(stateAt(106).paused).toBe(false)
    expect(stateAt(107).paused).toBe(true)
    expect(stateAt(129).paused).toBe(true)
    expect(stateAt(130).paused).toBe(false)
  })

  test('the menu reads differently when paused and screen resume leaves meeting capture alone', () => {
    const paused = markup(at(lk, 120))
    const resumed = markup(at(lk, 135))
    expect(paused).toContain('Observation paused')
    expect(paused).toContain('Resume observation')
    expect(resumed).toContain('Observation active')
    expect(resumed).not.toContain('Observation paused')
    for (let frame = 0; frame < lk.durationFrames; frame += 10) expect(stateAt(frame).meetings['zoom-kestrel']).toBe('absent')
    expect(stateAt(359).contribution).toBe(false)
  })

  test('the delete control is only hovered: local history is retained at the end', () => {
    const last = at(lk, 359)
    expect(last.state.ui).toMatchObject({ deleteDialog: 'closed', localHistoryDeleted: false })
    expect(last.view.cursor.target).toBe('delete-local-history')
  })
})

describe('denied paths', () => {
  const timelineOf = (events: readonly Record<string, unknown>[]): Timeline =>
    parseTimeline({
      fps: 30,
      durationFrames: 60,
      seed: 1,
      cut: 'hackathon',
      clipId: 'hk-h4a-enroll',
      scene: 'H4a',
      filmStartFrame: 0,
      anchors: { understand: { rect: { x: 344, y: 448, width: 592, height: 32 } } },
      events: events.map((event, index) => ({ seq: index, entry: 'H-057', ...event })),
    })

  test('declining the notice keeps observation off and refuses every later step', () => {
    const timeline = timelineOf([
      { frame: 10, type: 'action', action: { type: 'DECLINE_NOTICE' } },
      { frame: 20, type: 'action', action: { type: 'WIZARD_NEXT' }, expect: 'rejected' },
      { frame: 25, type: 'action', action: { type: 'CONSENT' }, expect: 'rejected' },
    ])
    expect(validateTimeline(timeline)).toEqual([])
    const end = at(timeline, 40)
    expect(end.state.consent.priya).toMatchObject({ noticeDeclined: true, noticeAccepted: false, workApplications: false })
    expect(end.state.phase).toBe('ST01')
    expect(observationActive(end.state, 'priya')).toBe(false)
    expect(end.rejections.map((item) => item.rejection.guard)).toEqual(['notice', 'declined'])
    expect(markup(end)).toContain('Observation is off: the notice was declined.')
  })

  test('sharing alone never starts capture', () => {
    const timeline = timelineOf([
      { frame: 5, type: 'action', action: { type: 'ACKNOWLEDGE_NOTICE' } },
      { frame: 10, type: 'action', action: { type: 'WIZARD_NEXT' } },
      { frame: 15, type: 'action', action: { type: 'SET_CONTRIBUTION', enabled: true } },
      { frame: 20, type: 'action', action: { type: 'WIZARD_NEXT' }, expect: 'rejected' },
      { frame: 25, type: 'action', action: { type: 'CONSENT' }, expect: 'rejected' },
    ])
    expect(validateTimeline(timeline)).toEqual([])
    const end = at(timeline, 40)
    expect(end.state.consent.priya).toMatchObject({ contribution: true, workApplications: false, visualObservation: false })
    expect(end.state.ui.wizardStep).toBe('capture')
    expect(end.rejections.map((item) => item.rejection.guard)).toEqual(['category', 'category'])
    expect(observationActive(end.state, 'priya')).toBe(false)
  })

  test('a viewpoint without an Employee role cannot enroll or reach My Privacy controls', () => {
    const timeline = timelineOf([
      { frame: 5, type: 'action', action: { type: 'SELECT_ACTOR', personId: 'marcus' } },
      { frame: 10, type: 'action', action: { type: 'ACKNOWLEDGE_NOTICE' }, expect: 'rejected' },
    ])
    expect(validateTimeline(timeline)).toEqual([])
    const end = at(timeline, 30)
    expect(end.state.consent.priya.noticeAccepted).toBe(false)
    expect(markup(end)).toContain('Enrollment is completed by the employee being enrolled.')
  })
})

describe('shell-tour excluded-window moment (SC01)', () => {
  const tour = load(specOf('shell-tour'))
  test('the cue and a blank window show only between frames 210 and 254, outside the observation record', () => {
    const sidecar = buildSidecar(tour)
    for (const frame of [209, 210, 254, 255]) {
      const shown = frame >= 210 && frame < 255
      expect(sidecar.anchors['excluded-window']?.[frame]?.visible).toBe(shown)
      expect(sidecar.anchors['excluded-cue']?.[frame]?.visible).toBe(shown)
    }
    const during = at(tour, 230)
    expect(markup(during)).toContain('Excluded window')
    expect(during.state.audit).toEqual(at(tour, 209).state.audit)
    expect(during.state.consent.priya.paused).toBe(false)
  })
})
