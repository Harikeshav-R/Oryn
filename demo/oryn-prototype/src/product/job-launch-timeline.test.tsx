import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CLIPS, startFrameOf } from '../../scripts/clips'
import { authorClip, formatTimeline } from '../../scripts/author-product-clips'
import { buildSidecar, parseTimeline, resolveFrame, validateTimeline } from '@/film'
import type { FilmEvent, ResolvedFrame, Timeline } from '@/film'
import { jobCounts } from '@/state'
import { LK_L9 } from './clip-specs-job-launch'
import { ProductFilmSurface } from './FilmProduct'
import { summaryCards } from './job'

/** BOB-09 `lk-l9-run` (L-109 to L-126, 01:46 to 02:03.50): the job runs, pauses at the approval, is decided, read back and summarised. */

const FILE = path.resolve(import.meta.dir, '../../film/launch/lk-l9-run.timeline.json')
const lk = parseTimeline(JSON.parse(readFileSync(FILE, 'utf8')))

const at = (frame: number): ResolvedFrame => resolveFrame(lk, frame)
const html = (frame: number): string => renderToStaticMarkup(createElement(ProductFilmSurface, { resolved: at(frame) }))
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const range = (first: number, last: number): number[] => Array.from({ length: last - first + 1 }, (_, i) => first + i)
/** Execution cyan: the progress fill and the running orbit node. */
const hasCyan = (markup: string): boolean => /bg-arc\b|var\(--arc-mark\)/.test(markup)
const sampled = [...new Set([...range(0, 174).map((i) => i * 3), 524])].filter((frame) => frame < 525)

const actions = (type?: string) => lk.events.flatMap((event: FilmEvent) => (event.type === 'action' && (type === undefined || event.action.type === type) ? [event] : []))
const framesOf = (type: string): number[] => actions(type).map((event) => event.frame)
const indexOf = (type: string, frame: number): number => lk.events.findIndex((event) => event.type === 'action' && event.action.type === type && event.frame === frame)
const verified = (frame: number): number => jobCounts(at(frame).state).verified
const snapshotText = (frame: number): string => plain(/<p[^>]*data-film-anchor="summary-snapshot"[^>]*>(.*?)<\/p>/.exec(html(frame))?.[1] ?? '')
const statusText = (frame: number): string => plain(/<h1[^>]*data-film-anchor="summary-status"[^>]*>(.*?)<\/h1>/.exec(html(frame))?.[1] ?? '')

describe('lk-l9-run: the roadmap table and the storyboard entries', () => {
  const clip = CLIPS.find((item) => item.clipId === 'lk-l9-run')

  test('it validates, is 525 frames (17.5 s) from film second 106, and carries clip-local entries', () => {
    expect(validateTimeline(lk)).toEqual([])
    expect(lk.durationFrames).toBe(525)
    expect(lk.durationFrames / 30).toBe(17.5)
    expect(clip?.frames).toBe(525)
    expect(lk.filmStartFrame).toBe(106 * 30)
    expect(lk.filmStartFrame).toBe(clip ? startFrameOf(clip) : undefined)
    expect(lk.startAt).toBe('ST09')
    for (const event of lk.events) {
      expect(event.entry).toMatch(clip?.entry ?? /^$/)
      expect(event.entry).toBe(LK_L9.entryAt(event.frame))
    }
  })

  test('the JSON on disk is exactly what the spec generates', () => {
    expect(readFileSync(FILE, 'utf8')).toBe(formatTimeline(authorClip(LK_L9)))
  }, 120_000)

  test('every storyboard entry L-109 to L-126 appears, and no camera move or stage caption is filmed', () => {
    expect(new Set(lk.events.map((event) => event.entry))).toEqual(new Set(range(109, 126).map((n) => `L-${n}`)))
    expect(lk.events.some((event) => event.type === 'camera' || event.type === 'type')).toBe(false)
    for (const n of range(0, 17)) expect(lk.events.some((event) => event.frame >= n * 30 && event.frame < n * 30 + 30)).toBe(true)
  })
})

describe('L-109: the preflight, then the start as its own authorization', () => {
  test('the prerequisites replay at f0, the selection precedes the scope dialog and the dialog precedes the start', () => {
    expect(framesOf('APPROVE_RELEASE')).toEqual([0])
    expect(framesOf('CONFIRM_SCOPE')).toEqual([0])
    expect(framesOf('CONFIRM_SELECTION')).toEqual([0])
    expect(framesOf('OPEN_JOB_SCOPE')).toEqual([0])
    expect(framesOf('RELEASE_AND_START')).toEqual([15])
    expect(indexOf('CONFIRM_SELECTION', 0)).toBeLessThan(indexOf('OPEN_JOB_SCOPE', 0))
    expect(indexOf('OPEN_JOB_SCOPE', 0)).toBeLessThan(indexOf('RELEASE_AND_START', 15))
  })

  test('f0 to f14: ST09, the eleven invoices confirmed, the `Confirm job scope` dialog open and nothing running', () => {
    for (const frame of [0, 7, 14]) {
      const { state } = at(frame)
      expect(state.phase).toBe('ST09')
      expect(state.route).toBe('SC21')
      expect(state.ui.job).toMatchObject({ selection: 'confirmed', dialog: 'open' })
      expect(state.running.job).toBe(false)
      expect(plain(html(frame))).toContain('Confirm job scope')
      expect(hasCyan(html(frame))).toBe(false)
    }
  })

  test('the press on `Start job` lands at f15 (+500 ms): the dialog closes, ST10, eleven queued cases and cyan', () => {
    const cursor = lk.events.find((event) => event.type === 'cursor' && event.frame === 0)
    expect(cursor).toMatchObject({ duration: 15, click: true })
    expect(cursor && 'target' in cursor).toBe(false)
    expect(at(14).state.phase).toBe('ST09')
    const started = at(15).state
    expect(started.phase).toBe('ST10')
    expect(started.route).toBe('SC21')
    expect(started.ui.job.dialog).toBe('closed')
    expect(started.running.job).toBe(true)
    expect(jobCounts(started)).toMatchObject({ queued: 11, total: 11 })
    for (const frame of [16, 22, 29]) expect(hasCyan(html(frame))).toBe(true)
  })

  test('sidecar: `start-job` is visible exactly f0 to f14, and `confirm-selection` is on SC21 throughout', () => {
    const sidecar = buildSidecar(lk)
    expect(sidecar.frameCount).toBe(525)
    for (const frame of range(0, 524)) expect(sidecar.anchors['start-job']?.[frame]?.visible).toBe(frame <= 14)
    expect(sidecar.anchors['job-scope-dialog']).toHaveLength(525)
  })
})

describe('L-110 to L-114: the cases settle in the planned order', () => {
  test('the evaluation order and frames match the plan, a 100 ms stagger inside each entry', () => {
    const order = actions('EVALUATE_CASE').map((event) => [event.frame, event.action.type === 'EVALUATE_CASE' ? event.action.invoice : ''])
    expect(order).toEqual([
      [33, 'INV-48210'], [36, 'INV-48211'],
      [63, 'INV-48212'], [66, 'INV-48213'], [69, 'INV-48214'],
      [93, 'INV-48215'], [96, 'INV-48218'],
      [123, 'INV-48216'], [126, 'INV-48217'],
      [150, 'INV-48219'], [150, 'INV-48220'],
    ])
  })

  test('SC22 from f30, Running from the first case, 11 queued until then', () => {
    expect(at(29).state.route).toBe('SC21')
    expect(at(30).state.route).toBe('SC22')
    expect(jobCounts(at(32).state).queued).toBe(11)
    expect(jobCounts(at(33).state)).toMatchObject({ verified: 1, queued: 10 })
    expect(jobCounts(at(37).state).queued).toBe(9)
    expect(jobCounts(at(126).state).queued).toBe(2)
    expect(at(60).state.running.job).toBe(true)
    expect(plain(html(40))).toContain('Running')
  })

  test('L-112 both missing-PO cases escalate; L-113 the last two standard cases complete the seven', () => {
    expect(at(95).state.job.outcomes['INV-48215']).toBe('escalated')
    expect(at(95).state.job.outcomes['INV-48218']).toBe('queued')
    expect(at(96).state.job.outcomes['INV-48218']).toBe('escalated')
    expect(at(125).state.job.outcomes['INV-48216']).toBe('verified')
    expect(at(126).state.job.outcomes['INV-48217']).toBe('verified')
  })

  test('f150: the job stops, 7 / 2 / 1 / 1, the status is Partially Complete, Daniel is the viewpoint, cyan is gone', () => {
    expect(at(149).state.phase).toBe('ST10')
    expect(at(149).state.running.job).toBe(true)
    const { state } = at(150)
    expect(state.phase).toBe('ST11')
    expect(state.running.job).toBe(false)
    expect(state.actorId).toBe('daniel')
    expect(at(149).state.actorId).toBe('marcus')
    expect(state.route).toBe('SC22')
    expect(jobCounts(state)).toMatchObject({ verified: 7, escalated: 2, approval: 1, unknown: 1, queued: 0, total: 11 })
    expect(plain(html(155))).toContain('Partially Complete')
  })
})

describe('L-114 to L-120: approval, readback and the held unknown case', () => {
  test('L-114 the approval row opens the approval drawer at f165; L-115 the evidence disclosure opens at f180', () => {
    expect(at(164).state.route).toBe('SC22')
    expect(at(165).state.route).toBe('SC23')
    expect(at(165).state.selectedCase).toBe('INV-48219')
    expect(at(179).state.ui.job.evidence).toBe(false)
    expect(at(180).state.ui.job.evidence).toBe(true)
    expect(at(179).view.cursor.target).toBe('approval-row')
    expect(at(209).view.cursor.target).toBe('approval-evidence')
  })

  test('L-116 the pointer points at the diff twice, left then right, and nothing is decided', () => {
    const moves = lk.events.filter((event) => event.type === 'cursor' && event.target === 'approval-diff')
    expect(moves).toHaveLength(2)
    const [left, right] = moves.map((event) => (event.type === 'cursor' ? event.to[0] : NaN)) as [number, number]
    expect(left).toBeLessThan(right)
    for (const move of moves) expect(move.type === 'cursor' && move.click).toBe(false)
    for (const frame of [210, 225, 239]) expect(at(frame).state.approval.decision).toBe('pending')
    expect(at(239).view.cursor.target).toBe('approval-diff')
  })

  test('L-117 APPROVE lands at f255, strictly before VERIFY_READBACK at f285, never on the same frame', () => {
    expect(framesOf('APPROVE')).toEqual([255])
    expect(framesOf('VERIFY_READBACK')).toEqual([285])
    expect(framesOf('SELECT_ACTOR')).toEqual([150])
    expect(framesOf('SELECT_ACTOR')[0]).toBeLessThan(framesOf('APPROVE')[0] as number)
    expect(framesOf('APPROVE')[0]).toBeLessThan(framesOf('VERIFY_READBACK')[0] as number)
    expect(at(254).state.approval.decision).toBe('pending')
    expect(at(255).state.approval).toMatchObject({ decision: 'approved', by: 'daniel' })
    expect(at(255).state.readback.status).toBe('pending')
    expect(at(284).state.readback.status).toBe('pending')
    expect(at(285).state.readback.status).toBe('verified')
  })

  test('the verified count is 7 from f150 to f284 and 8 from f285; an approval alone changes no count', () => {
    for (const frame of range(150, 284)) expect(verified(frame)).toBe(7)
    for (const frame of range(285, 524)) expect(verified(frame)).toBe(8)
    expect(jobCounts(at(260).state)).toMatchObject({ verified: 7, escalated: 2, approval: 1, unknown: 1 })
    expect(jobCounts(at(285).state)).toMatchObject({ verified: 8, escalated: 2, approval: 0, unknown: 1 })
  })

  test('`job:awaiting-verification` is on from the approval to the readback and nowhere else', () => {
    for (const frame of range(0, 524)) expect(at(frame).view.overlays['job:awaiting-verification'] === true).toBe(frame >= 255 && frame < 285)
  })

  test('L-118 the pointer is hidden, L-119 the unknown row opens its drawer at f315, L-120 `Investigate outcome` is hovered and not pressed', () => {
    for (const frame of [270, 285, 299]) expect(at(frame).view.cursor.visible).toBe(false)
    expect(at(299).state.route).toBe('SC23')
    expect(at(300).state.route).toBe('SC22')
    expect(at(314).state.route).toBe('SC22')
    expect(at(315).state.route).toBe('SC24')
    expect(at(315).state.selectedCase).toBe('INV-48220')
    expect(at(329).view.cursor.target).toBe('unknown-row')
    expect(at(359).view.cursor.target).toBe('investigate')
    const hover = lk.events.find((event) => event.type === 'cursor' && event.target === 'investigate')
    expect(hover).toMatchObject({ frame: 330, duration: 15, click: false })
    expect(at(344).state.ui.job.tip).toBe(false)
    expect(at(345).state.ui.job.tip).toBe(true)
    for (const frame of [330, 345, 359]) {
      expect(at(frame).state.ui.job.investigating).toBe(false)
      expect(hasCyan(html(frame))).toBe(false)
    }
  })

  test('L-121 holds SC24 with no pointer', () => {
    for (const frame of [360, 389]) {
      expect(at(frame).state.route).toBe('SC24')
      expect(at(frame).view.cursor.visible).toBe(false)
    }
  })

  test('INV-48220 is Outcome Unknown on every frame from f150, and there is no retry or successful-eleven text on any frame', () => {
    for (const frame of range(150, 524)) expect(at(frame).state.job.outcomes['INV-48220']).toBe('unknown')
    for (const frame of sampled) {
      const page = plain(html(frame))
      expect(page).not.toMatch(/Retry|Resubmit(?! unavailable)/)
      expect(page).not.toMatch(/11 successful/i)
    }
  })

  test('no cyan from f150: the stopped job, the drawers, the summary and the document are neutral', () => {
    for (const frame of sampled.filter((f) => f >= 150)) expect(hasCyan(html(frame))).toBe(false)
    for (const frame of sampled.filter((f) => f >= 15 && f < 150)) expect(hasCyan(html(frame))).toBe(at(frame).state.running.job)
  })
})

describe('L-122 to L-124: the summary and its two snapshots', () => {
  test('L-122 shows the stored `Before approval` snapshot, 7 / 2 / 1 / 1, although the readback has already landed', () => {
    expect(at(389).state.route).toBe('SC24')
    for (const frame of [390, 400, 419]) {
      const { state } = at(frame)
      expect(state.route).toBe('SC25')
      expect(state.readback.status).toBe('verified')
      expect(state.ui.job.snapshot).toBe('before')
      expect(summaryCards(state).map((card) => card.count)).toEqual([7, 2, 1, 1])
      expect(snapshotText(frame)).toContain('Before approval')
      expect(snapshotText(frame)).not.toContain('After approval and verification')
    }
  })

  test('L-123 swaps to `After approval and verification`, 8 / 2 / 0 / 1, at f420', () => {
    for (const frame of [420, 440, 449]) {
      const { state } = at(frame)
      expect(state.route).toBe('SC25')
      expect(state.ui.job.snapshot).toBe('current')
      expect(summaryCards(state).map((card) => card.count)).toEqual([8, 2, 0, 1])
      expect(snapshotText(frame)).toContain('After approval and verification')
    }
  })

  test('L-124 the total stays 11 and the status Partially Complete while the pointer hovers the unknown count (no click)', () => {
    for (const frame of [450, 465, 479]) {
      expect(at(frame).state.route).toBe('SC25')
      expect(statusText(frame)).toBe('Partially Complete')
      expect(summaryCards(at(frame).state).reduce((sum, card) => sum + card.count, 0)).toBe(11)
    }
    expect(at(479).view.cursor.target).toBe('summary-unknown')
    const hover = lk.events.find((event) => event.type === 'cursor' && event.target === 'summary-unknown')
    expect(hover).toMatchObject({ frame: 450, duration: 15, click: false })
  })
})

describe('L-125 and L-126 (first half): the next cycle begins without the incident', () => {
  test('f480 opens the Kestrel INV-48231 document; the handling fee is outlined from f495; the summary is gone at f524', () => {
    expect(at(479).state.route).toBe('SC25')
    for (const frame of [480, 500, 510, 524]) {
      expect(at(frame).state.route).toBe('SC05')
      expect(at(frame).view.cursor.visible).toBe(false)
    }
    expect(plain(html(524))).toContain('INV-48231')
    expect(lk.events.some((event) => event.type === 'outline' && event.frame === 495 && event.target === 'handling-fee' && event.mode === 'selected')).toBe(true)
  })

  test('NEXT_CYCLE_INCIDENT is never filmed here: the theme stays light and the incident stays closed', () => {
    expect(framesOf('NEXT_CYCLE_INCIDENT')).toEqual([])
    for (const frame of [0, 300, 480, 524]) {
      expect(at(frame).state.theme).toBe('light')
      expect(at(frame).state.incident.status).not.toBe('open')
    }
  })
})

describe('seeking: a reverse pass equals the linear pass', () => {
  test('lk-l9-run: reversed and shuffled direct seeks give the same frame', () => {
    const signature = (timeline: Timeline, frame: number): string => JSON.stringify(resolveFrame(timeline, frame)) + html(frame)
    const list = sampled.filter((_, i) => i % 3 === 0)
    const linear = list.map((frame) => signature(lk, frame))
    const reverse = [...list].reverse().map((frame) => signature(lk, frame)).reverse()
    expect(reverse).toEqual(linear)
  })
})
