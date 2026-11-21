import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { authorClip, formatTimeline } from '../../scripts/author-product-clips'
import { CLIPS, startFrameOf } from '../../scripts/clips'
import { buildSidecar, parseTimeline, resolveFrame, validateTimeline } from '@/film'
import type { ResolvedFrame, Timeline } from '@/film'
import { MEETING_QUOTES } from '@/data/commitment'
import { hudKind, observationActive, recordingActive } from '@/state'
import type { State } from '@/state'
import { ProductFilmSurface } from './FilmProduct'
import { CLIP_SPECS } from './clip-specs'
import type { ClipSpec } from './clip-specs'
import { WORK_CLIP_SPECS } from './clip-specs-work'

/** BOB-05 clips: hk-h2-problem, hk-h4b-observe, lk-l2-chaos, lk-l5-observe. */

const FILM = path.resolve(import.meta.dir, '../../film')
const fileOf = (spec: ClipSpec): string => path.join(FILM, spec.cut, `${spec.clipId}.timeline.json`)
const specOf = (clipId: string): ClipSpec => {
  const found = CLIP_SPECS.find((spec) => spec.clipId === clipId)
  if (!found) throw new Error(`No spec for ${clipId}`)
  return found
}
const load = (spec: ClipSpec): Timeline => parseTimeline(JSON.parse(readFileSync(fileOf(spec), 'utf8')))
const at = (timeline: Timeline, frame: number): ResolvedFrame => resolveFrame(timeline, frame)
const markup = (resolved: ResolvedFrame): string => renderToStaticMarkup(createElement(ProductFilmSurface, { resolved }))
const html = (timeline: Timeline, frame: number): string => markup(at(timeline, frame))
const stateAt = (timeline: Timeline, frame: number): State => at(timeline, frame).state

const business = (state: State) => ({ phase: state.phase, consent: state.consent, commitment: state.commitment, approval: state.approval, readback: state.readback, job: state.job, audit: state.audit })

const H2 = specOf('hk-h2-problem')
const H4B = specOf('hk-h4b-observe')
const L2 = specOf('lk-l2-chaos')
const L5 = specOf('lk-l5-observe')
const h2 = load(H2)
const h4b = load(H4B)
const l2 = load(L2)
const l5 = load(L5)

const range = (first: number, last: number): string[] => Array.from({ length: last - first + 1 }, (_, i) => `${first + i}`)
const hEntries = (first: number, last: number): Set<string> => new Set(range(first, last).map((n) => `H-${n.padStart(3, '0')}`))
const lEntries = (first: number, last: number): Set<string> => new Set(range(first, last).map((n) => `L-${n.padStart(3, '0')}`))
const entriesOf = (timeline: Timeline): Set<string> => new Set(timeline.events.map((event) => event.entry ?? ''))

/** Markup around the first element opening with `data-film-anchor="<name>"`. */
function anchorTag(page: string, name: string): string {
  const match = new RegExp(`<[^>]*data-film-anchor="${name}"[^>]*>`).exec(page)
  if (!match) throw new Error(`no anchor ${name}`)
  return match[0]
}
const shown = (page: string, name: string): boolean => !/display:\s*none/.test(anchorTag(page, name))

describe('BOB-05 timelines match the roadmap table and the storyboard entries', () => {
  for (const spec of WORK_CLIP_SPECS) {
    const timeline = load(spec)
    const clip = CLIPS.find((item) => item.clipId === spec.clipId)

    test(`${spec.clipId}: validates, has the table length and carries clip-local entries`, () => {
      expect(validateTimeline(timeline)).toEqual([])
      expect(clip?.frames).toBe(spec.durationFrames)
      expect(timeline.filmStartFrame).toBe(clip ? startFrameOf(clip) : undefined)
      for (const event of timeline.events) {
        expect(event.entry).toMatch(clip?.entry ?? /^$/)
        expect(event.entry).toBe(spec.entryAt(event.frame))
      }
    })

    test(`${spec.clipId}: the JSON on disk is exactly what the spec generates`, () => {
      expect(readFileSync(fileOf(spec), 'utf8')).toBe(formatTimeline(authorClip(spec)))
    }, 120_000)
  }

  test('every storyboard entry of each clip appears in its timeline', () => {
    expect(entriesOf(h2)).toEqual(hEntries(14, 26))
    expect(entriesOf(h4b)).toEqual(hEntries(63, 69))
    expect(entriesOf(l2)).toEqual(lEntries(9, 24))
    expect(entriesOf(l5)).toEqual(lEntries(47, 58))
  })

  test('no camera move, stage caption or typed text other than the deadline is baked into a product clip', () => {
    for (const timeline of [h2, h4b, l2, l5]) {
      expect(timeline.events.some((event) => event.type === 'camera')).toBe(false)
      expect(timeline.events.filter((event) => event.type === 'type').every((event) => event.type === 'type' && event.target === 'deadline')).toBe(true)
      for (let frame = 0; frame < timeline.durationFrames; frame += 30) expect(html(timeline, frame).toLowerCase()).not.toMatch(/subtitle|caption/)
    }
  })

  test('the deadline is typed at 28 to 34 characters a second, replacing Fri 17:00', () => {
    for (const timeline of [h4b, l5]) {
      const typed = timeline.events.filter((event) => event.type === 'type')
      expect(typed).toHaveLength(1)
      const [event] = typed
      expect(event).toMatchObject({ text: 'Fri 12:00', before: 'Fri 17:00' })
      expect(event?.type === 'type' && event.charsPerSecond >= 28 && event.charsPerSecond <= 34).toBe(true)
    }
  })
})

describe('seeking: original and reversed order give the same frame', () => {
  const sample = (timeline: Timeline): number[] => [0, Math.floor(timeline.durationFrames / 3), Math.floor(timeline.durationFrames / 2), timeline.durationFrames - 1]
  for (const [label, timeline] of [['hk-h2-problem', h2], ['hk-h4b-observe', h4b], ['lk-l2-chaos', l2], ['lk-l5-observe', l5]] as const) {
    test(`${label}: sampled frames are identical after a reverse pass`, () => {
      const frames = sample(timeline)
      const forward = frames.map((frame) => JSON.stringify(at(timeline, frame)) + html(timeline, frame))
      const reverse = [...frames].reverse().map((frame) => JSON.stringify(at(timeline, frame)) + html(timeline, frame)).reverse()
      expect(reverse).toEqual(forward)
    })
  }
})

describe('the problem montage shows the employee own work, before any observation', () => {
  test.each([['hk-h2-problem', h2], ['lk-l2-chaos', l2]] as const)('%s: nothing is captured, nothing is recorded and nothing is verified', (_label, timeline) => {
    for (let frame = 0; frame < timeline.durationFrames; frame += 15) {
      const state = stateAt(timeline, frame)
      expect(observationActive(state, 'priya')).toBe(false)
      expect(state.phase).toBe('ST01')
      const page = html(timeline, frame)
      expect(page).not.toContain('Recording')
      expect(page).not.toContain('Matched - Variance Approved')
      expect(page).not.toMatch(/2fd8ff|--arc/i)
      if (page.includes('data-observation=')) expect(page).toContain('data-observation="off"')
    }
  })

  test('hk-h2-problem: INV-48210 survives Gmail, the document, NetSuite and the tracker with identical identifiers', () => {
    const mail = html(h2, 10)
    expect(mail).toContain('Invoice INV-48210')
    expect(mail).toContain('Brightwater Industrial')
    expect(stateAt(h2, 10).ui.app).toMatchObject({ record: 'INV-48210', mail: 'message', attachment: false })
    expect(stateAt(h2, 18).ui.app.attachment).toBe(true)
    const doc = html(h2, 30)
    for (const text of ['INV-48210', 'PO-1031', '$6,240.00', 'Brightwater Industrial']) expect(doc).toContain(text)
    const erp = html(h2, 70)
    for (const text of ['INV-48210', 'PO-1031', '$6,240.00', 'Brightwater Industrial']) expect(erp).toContain(text)
    expect(erp).not.toMatch(/\$17,980\.00|2\.45%|Variance Hold/)
    expect(html(h2, 100)).toContain('INV-48210')
    const slack = html(h2, 160)
    expect(slack.match(/Missing purchase order:/g)).toHaveLength(2)
    for (const id of ['INV-48215', 'INV-48218', 'INV-48219']) expect(slack).toContain(id)
  })

  test('hk-h2-problem: the Kestrel layout change adds one fee line after the subtotal and the arithmetic holds', () => {
    const state = stateAt(h2, 560)
    expect(state.ui.app).toMatchObject({ record: 'INV-48231', attachment: true, documentView: 'compare' })
    const page = html(h2, 560)
    for (const text of ['Kestrel Components', 'INV-48231', 'PO-1051', '$4,175.00', '$38.50', '$4,213.50']) expect(page).toContain(text)
    // Order inside the document itself (the message above it also mentions the fee).
    const document = page.slice(page.indexOf('data-film-anchor="document-viewer"'))
    expect(document.indexOf('$4,175.00')).toBeLessThan(document.indexOf('$38.50'))
    expect(document.indexOf('$38.50')).toBeLessThan(document.indexOf('$4,213.50'))
    // The fee is outlined (ink, never cyan) only once the sheets have settled.
    expect(at(h2, 550).view.outlines.some((outline) => outline.anchor === 'handling-fee')).toBe(false)
    expect(at(h2, 570).view.outlines.some((outline) => outline.anchor === 'handling-fee')).toBe(true)
  })

  test('hk-h2-problem: the only click is inert and changes no state', () => {
    const before = business(stateAt(h2, 420))
    expect(business(stateAt(h2, 470))).toEqual(before)
    expect(at(h2, 439).view.cursor.target).toBe('erp-match-action')
  })

  test('lk-l2-chaos: the hero invoice carries the same identifiers across Gmail, the PDF, NetSuite, the tracker and Slack', () => {
    expect(html(l2, 5)).toContain('INV-48219')
    expect(stateAt(l2, 5).ui.app.attachment).toBe(false)
    const pdf = html(l2, 20)
    for (const text of ['INV-48219', 'PO-1042', '$18,420.00', 'Brightwater Industrial']) expect(pdf).toContain(text)
    const erp = html(l2, 35)
    for (const text of ['INV-48219', 'PO-1042', '$18,420.00', '$17,980.00', '$440.00', '2.45%', 'Variance Hold']) expect(erp).toContain(text)
    expect(html(l2, 50)).toContain('INV-48219')
    expect(html(l2, 65)).toContain('INV-48219')
    expect(at(l2, 20).view.outlines.some((outline) => outline.anchor === 'invoice-total')).toBe(true)
    expect(at(l2, 32).view.outlines.some((outline) => outline.anchor === 'invoice-total')).toBe(false)
  })

  test('lk-l2-chaos: the Zoom crop shows Priya and Dana with no recording indicator, and the click changes no state', () => {
    const call = html(l2, 95)
    expect(call).toContain('Priya Nair')
    expect(call).toContain('Dana Whitfield')
    expect(shown(call, 'tile-dana')).toBe(true)
    expect(recordingActive(stateAt(l2, 95), 'priya')).toBe(false)
    expect(business(stateAt(l2, 140))).toEqual(business(stateAt(l2, 0)))
    expect(at(l2, 132).view.cursor).toMatchObject({ target: 'erp-po', phase: 'press' })
  })
})

describe('observed work: consent precedes recording, and the deadline is corrected before an explicit Confirm', () => {
  test.each([['hk-h4b-observe', h4b, 61, 77], ['lk-l5-observe', l5, 91, 106]] as const)('%s: observation is active and sharing is off throughout', (_label, timeline) => {
    for (let frame = 0; frame < timeline.durationFrames; frame += 5) {
      const state = stateAt(timeline, frame)
      expect(observationActive(state, 'priya')).toBe(true)
      expect(state.consent.priya).toMatchObject({ workApplications: true, contribution: false, paused: false })
      expect(html(timeline, frame)).not.toMatch(/2fd8ff|--arc/i)
    }
  })

  test.each([['hk-h4b-observe', h4b, 61, 77], ['lk-l5-observe', l5, 91, 106]] as const)('%s: no indicator before the consent click, an indicator and then quotes after it', (_label, timeline, from, landing) => {
    for (let frame = from; frame < landing; frame += 3) {
      const state = stateAt(timeline, frame)
      expect(state.consent.priya.meetings['zoom-kestrel']).toBe('absent')
      expect(recordingActive(state, 'priya')).toBe(false)
      expect(html(timeline, frame)).not.toContain('Recording')
      expect(html(timeline, frame)).toContain('Meeting capture: consent required')
    }
    expect(recordingActive(stateAt(timeline, landing), 'priya')).toBe(true)
    expect(html(timeline, landing + 10)).toContain('Recording')
  })

  test('hk-h4b-observe: D1 is identified by the same ID in the message, the document and the bill, with no invented amount or PO', () => {
    expect(stateAt(h4b, 14).ui.app.attachment).toBe(false)
    expect(stateAt(h4b, 15).ui.app).toMatchObject({ record: 'INV-48203', attachment: true })
    const mail = html(h4b, 20)
    expect(mail).toContain('Priya Nair · Mon 09:14')
    expect(mail).toContain('INV-48203')
    const erp = html(h4b, 40)
    expect(erp).toContain('INV-48203')
    expect(erp).toContain('Purchase order not stated in this record')
    expect(erp).not.toMatch(/\$\d/)
    expect(html(h4b, 55)).toContain('INV-48203')
    expect(stateAt(h4b, 55).ui.app.trackerFocus).toEqual({ invoice: 'INV-48203', column: 'invoice' })
  })

  test('hk-h4b-observe: Dana speaks first with the exact quotation and source time', () => {
    expect(stateAt(h4b, 89).ui.app.meeting.quote).toBe('none')
    const state = stateAt(h4b, 100)
    expect(state.ui.app.meeting.quote).toBe('dana')
    const page = html(h4b, 100)
    expect(page).toContain(MEETING_QUOTES[0].quote.replace("'", '&#x27;'))
    expect(page).toContain('00:14:32')
    expect(page).not.toContain('Send me the new layout')
    expect(page).not.toMatch(/Marcus|Jamal|Daniel|Elena/)
  })

  test('hk-h4b-observe: the proposal says Fri 17:00 and is not confirmed until the explicit click', () => {
    expect(stateAt(h4b, 119).phase).toBe('ST02')
    const proposal = stateAt(h4b, 130)
    expect(proposal.phase).toBe('ST03')
    expect(proposal.route).toBe('SC11')
    expect(proposal.commitment).toMatchObject({ status: 'proposed', due: 'Fri 17:00', confirmedDue: null })
    const page = html(h4b, 130)
    for (const text of ['Confirm Kestrel handling-fee terms in writing', 'Priya Nair', 'Fri 17:00', '00:14:32', 'subject to company approval', 'Suggested']) expect(page).toContain(text)
    expect(page).not.toContain('Confirmed Commitment')
  })

  test.each([['hk-h4b-observe', h4b, 150], ['lk-l5-observe', l5, 211]] as const)('%s: typing replaces the deadline, saves it, and only the click confirms it', (_label, timeline, typeFrame) => {
    const typing = at(timeline, typeFrame + 8)
    const typed = typing.view.texts.deadline
    expect(typed?.full).toBe('Fri 12:00')
    expect(typing.state.commitment.due).toBe('Fri 17:00')
    const edit = timeline.events.find((event) => event.type === 'action' && event.action.type === 'EDIT_COMMITMENT')
    const confirm = timeline.events.find((event) => event.type === 'action' && event.action.type === 'CONFIRM_COMMITMENT')
    expect(edit && confirm && edit.frame < confirm.frame).toBe(true)
    if (!edit || !confirm) return
    expect(stateAt(timeline, edit.frame - 1).commitment.due).toBe('Fri 17:00')
    const edited = stateAt(timeline, edit.frame)
    expect(edited.commitment).toMatchObject({ status: 'edited', due: 'Fri 12:00', confirmedDue: null })
    expect(html(timeline, confirm.frame - 1)).not.toContain('Confirmed Commitment')
    const confirmed = stateAt(timeline, confirm.frame)
    expect(confirmed.commitment).toMatchObject({ status: 'confirmed', due: 'Fri 12:00', confirmedDue: 'Fri 12:00' })
    expect(confirmed.phase).toBe('ST04')
    expect(confirmed.route).toBe('SC11')
    const page = html(timeline, confirm.frame + 6)
    expect(page).toContain('Confirmed Commitment')
    expect(page).toContain('subject to company approval')
    expect(page).toContain('Fri 17:00')
  })

  test('the reminder appears only on the Kestrel record after confirmation and reads the corrected time', () => {
    // lk-l5-observe shows the vendor record until frame 329; L-058 (frame 330 on) is SC13.
    for (const [timeline, last] of [[h4b, 209], [l5, 329]] as const) {
      const end = at(timeline, last)
      expect(hudKind(end.state)).toBe('commitment')
      expect(end.state.ui.app).toMatchObject({ erp: 'vendor', vendor: 'kestrel' })
      const page = markup(end)
      expect(shown(page, 'hud-reminder')).toBe(true)
      const card = /<aside[^>]*>[\s\S]*?<\/aside>/.exec(page)?.[0] ?? ''
      expect(card).toContain('Confirm Kestrel handling-fee terms in writing')
      expect(card).toContain('Fri 12:00')
      expect(card).not.toContain('Fri 17:00')
      expect(card).toContain('subject to company approval')
    }
    // Before the vendor record opens, and before confirmation, nothing is shown.
    expect(hudKind(stateAt(h4b, 179))).toBeNull()
    expect(hudKind(stateAt(h4b, 130))).toBeNull()
    expect(hudKind(stateAt(l5, 269))).toBeNull()
  })

  test('lk-l5-observe: both quotations are exact, the reminder sits low and enters slowly, then settles', () => {
    const page = html(l5, 175)
    expect(page).toContain(MEETING_QUOTES[0].quote.replace("'", '&#x27;'))
    expect(page).toContain(MEETING_QUOTES[1].quote.replace("'", '&#x27;'))
    expect(stateAt(l5, 149).ui.app.meeting.quote).toBe('dana')
    expect(stateAt(l5, 150).ui.app.meeting.quote).toBe('priya')
    expect(stateAt(l5, 283).ui.app.hud).toMatchObject({ placement: 'lower', motion: 'long' })
    const entering = html(l5, 283)
    const settled = html(l5, 329)
    expect(entering).not.toBe(settled)
    expect(anchorTag(entering, 'hud-reminder')).toBe(anchorTag(settled, 'hud-reminder'))
  })

  test('the pointer is hidden where the storyboard shows none and shown again at the next start point', () => {
    const { cursor } = buildSidecar(h4b)
    expect(cursor.slice(90, 120).every((sample) => !sample.visible && sample.x === null)).toBe(true)
    expect(cursor[120]).toMatchObject({ visible: true, x: 810, y: 442 })
    const launch = buildSidecar(l5).cursor
    expect(launch.slice(120, 180).every((sample) => !sample.visible)).toBe(true)
    expect(launch[180]).toMatchObject({ visible: true, x: 760, y: 330 })
  })
})
