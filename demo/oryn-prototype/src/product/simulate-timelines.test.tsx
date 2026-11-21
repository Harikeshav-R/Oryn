import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CLIPS, startFrameOf } from '../../scripts/clips'
import { authorClip, formatTimeline } from '../../scripts/author-product-clips'
import { buildSidecar, parseTimeline, resolveFrame, validateTimeline } from '@/film'
import type { ResolvedFrame, Timeline } from '@/film'
import { gateChecks, runSummary } from '@/state'
import { CLIP_SPECS } from './clip-specs'
import type { ClipSpec } from './clip-specs'
import { filmContextOf } from './contract'
import { ProductFilmSurface } from './FilmProduct'
import { simView } from './simulator'
import { SIM_HOST, TILE, simTile } from './simulator-layout'

/** BOB-08 clips: hk-h4e-simulate (H-084 to H-091) and lk-l8-simulate (L-093 to L-108), and the SC19 tail of lk-l7-create. */

const FILM = path.resolve(import.meta.dir, '../../film')
const fileOf = (spec: ClipSpec): string => path.join(FILM, spec.cut, `${spec.clipId}.timeline.json`)
const specOf = (clipId: string): ClipSpec => CLIP_SPECS.find((spec) => spec.clipId === clipId) as ClipSpec
const load = (spec: ClipSpec): Timeline => parseTimeline(JSON.parse(readFileSync(fileOf(spec), 'utf8')))
const at = (timeline: Timeline, frame: number): ResolvedFrame => resolveFrame(timeline, frame)
const html = (timeline: Timeline, frame: number): string => renderToStaticMarkup(createElement(ProductFilmSurface, { resolved: at(timeline, frame) }))
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const range = (first: number, last: number): number[] => Array.from({ length: last - first + 1 }, (_, i) => first + i)
const count = (markup: string, needle: string): number => markup.split(needle).length - 1
const tagOf = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}
/** Execution cyan: the progress fill and the running orbit node. */
const hasCyan = (markup: string): boolean => /bg-arc\b|var\(--arc-mark\)/.test(markup)

const HK_SPEC = specOf('hk-h4e-simulate')
const LK_SPEC = specOf('lk-l8-simulate')
const L7_SPEC = specOf('lk-l7-create')
const hk = load(HK_SPEC)
const lk = load(LK_SPEC)
const l7 = load(L7_SPEC)

const sampled = (timeline: Timeline): number[] => [...new Set([...range(0, Math.floor((timeline.durationFrames - 1) / 3)).map((i) => i * 3), ...range(0, Math.floor(timeline.durationFrames / 30)).map((i) => i * 30), timeline.durationFrames - 1])].filter((frame) => frame < timeline.durationFrames)
const entries = (timeline: Timeline): Set<string> => new Set(timeline.events.map((event) => event.entry ?? ''))
const entryRange = (prefix: 'H' | 'L', first: number, last: number): Set<string> => new Set(range(first, last).map((n) => `${prefix}-${String(n).padStart(3, '0')}`))

const latestSuite = (frame: ResolvedFrame) => frame.state.evaluations.at(-1)
const summaryAt = (timeline: Timeline, frame: number, version: 'agent-v0.1' | 'agent-v0.2') => {
  const run = at(timeline, frame).state.evaluations.find((candidate) => candidate.versionId === version && candidate.status === 'complete')
  return run ? runSummary(run) : undefined
}
const dataStates = (markup: string): string[] => [...markup.matchAll(/data-scenario="SCN-\d{3}"[^>]*data-state="([A-Za-z]+)"|data-state="([A-Za-z]+)"[^>]*data-scenario="SCN-\d{3}"/g)].map((match) => (match[1] ?? match[2]) as string)

describe('BOB-08 timelines match the roadmap table and the storyboard entries', () => {
  for (const [spec, timeline] of [[HK_SPEC, hk], [LK_SPEC, lk]] as const) {
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

  test('every storyboard entry of each clip appears, and no clip films a camera move or a stage caption', () => {
    expect(entries(hk)).toEqual(entryRange('H', 84, 91))
    expect(entries(lk)).toEqual(entryRange('L', 93, 108))
    for (const timeline of [hk, lk]) expect(timeline.events.some((event) => event.type === 'camera')).toBe(false)
  })

  test('no clip deploys: starting the job belongs to BOB-09, and no run is ever started twice at once', () => {
    for (const timeline of [hk, lk, l7]) {
      expect(timeline.events.some((event) => event.type === 'action' && event.action.type === 'RELEASE_AND_START')).toBe(false)
    }
  })
})

describe('hk-h4e-simulate: run, failure, replay, correction and rerun', () => {
  test('H-084: nothing is run before the press, the run starts at its landing frame and executes for 15 frames', () => {
    const before = at(hk, 14)
    expect(before.state.route).toBe('SC19')
    expect(before.state.evaluations).toEqual([])
    expect(dataStates(html(hk, 14)).every((state) => state === 'notRun')).toBe(true)
    expect(at(hk, 15).state.evaluations.map((run) => [run.versionId, run.status])).toEqual([['agent-v0.1', 'running']])
    const middle = html(hk, 22)
    expect(dataStates(middle).filter((state) => state === 'running')).toHaveLength(1)
    expect(dataStates(middle).filter((state) => state === 'executed').length).toBeGreaterThan(5)
    expect(plain(middle)).toMatch(/\d+ of 28 scenarios run/)
    expect(middle).not.toContain('data-state="passed"')
    expect(middle).not.toContain('data-state="failed"')
  })

  test('H-085: the run completes at f30 and the screen opens its results: 21 Passed, 6 Passed — Expected Safe Escalation, 1 Failed', () => {
    expect(at(hk, 29).state.route).toBe('SC19')
    const done = at(hk, 30)
    expect(done.state.route).toBe('SC20')
    expect(done.state.phase).toBe('ST08')
    expect(summaryAt(hk, 30, 'agent-v0.1')).toEqual({ complete: true, passed: 21, safeEscalation: 6, failed: 1, notRun: 0 })
    const page = plain(html(hk, 40))
    for (const text of ['21 Passed', '6 Passed — Expected Safe Escalation', '1 Failed', '27/28 intended outcomes correct']) expect(page).toContain(text)
    expect(at(hk, 45).view.cursor.target).toBe('failed-scenario')
  })

  test('H-086: a press on the failed scenario selects SCN-022 and opens its replay with Expected: accept and Actual: escalate', () => {
    expect(at(hk, 70).state.ui.discovery.drawer).toBeNull()
    const open = at(hk, 71)
    expect(open.state.selectedScenario).toBe('SCN-022')
    expect(open.state.ui.discovery.drawer).toBe('replay')
    const page = plain(html(hk, 80))
    for (const text of ['variance_exactly_2.00pct', 'Expected: accept', 'Actual: escalate', '> 2.00% requires approval']) expect(page).toContain(text)
    expect(tagOf(html(hk, 80), 'replay')).not.toContain('display:none')
    expect(tagOf(html(hk, 80), 'rule-drawer')).toContain('display:none')
  })

  test('H-087: AP-RULE-009 opens with the replay named in it, the threshold sentence and both outcomes together', () => {
    expect(at(hk, 104).state.ui.discovery.drawer).toBe('replay')
    expect(at(hk, 105).state.ui.discovery.drawer).toBe('AP-RULE-009')
    const page = plain(html(hk, 110))
    for (const text of ['AP-RULE-009', 'variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept', 'Expected: accept', 'Actual: escalate', '> 2.00% requires approval']) expect(page).toContain(text)
    expect(tagOf(html(hk, 110), 'rule-drawer')).not.toContain('display:none')
    expect(tagOf(html(hk, 110), 'replay')).toContain('display:none')
    expect(html(hk, 110)).toContain('data-replay-overlay="true"')
    expect(hasCyan(html(hk, 110))).toBe(false)
  })

  test('H-088: the drawer closes and the comparison shows v0.1 as recorded against a proposed v0.2 that has not run', () => {
    expect(at(hk, 134).state.ui.simulator.compare).toBe(false)
    const frame = at(hk, 140)
    expect(frame.state.ui.discovery.drawer).toBeNull()
    expect(frame.state.ui.simulator.compare).toBe(true)
    const page = plain(html(hk, 149))
    for (const text of ['v0.1 · Failed evaluation', 'v0.2 · Proposed correction', '21 Passed', '1 Failed', '≥ 2.00% requires approval', '> 2.00% requires approval', 'Not Run']) expect(page).toContain(text)
    expect(frame.state.evaluations.filter((run) => run.versionId === 'agent-v0.2')).toEqual([])
    expect(tagOf(html(hk, 149), 'version-compare')).not.toContain('display:none')
    expect(tagOf(html(hk, 149), 'results')).toContain('display:none')
  })

  test('H-089: SC19 is bound to the corrected v0.2 with no verdict carried over; the press runs v0.2 and v0.1 keeps its own run', () => {
    const idle = at(hk, 155)
    expect(idle.state.route).toBe('SC19')
    expect(idle.state.evaluations).toHaveLength(1)
    expect(simView({ state: idle.state, film: filmContextOf(idle) })).toMatchObject({ phase: 'idle', version: 'v0.2' })
    expect(dataStates(html(hk, 155)).every((state) => state === 'notRun')).toBe(true)
    const running = at(hk, 172)
    expect(running.state.evaluations.map((run) => [run.versionId, run.status])).toEqual([['agent-v0.1', 'complete'], ['agent-v0.2', 'running']])
    expect(summaryAt(hk, 172, 'agent-v0.1')).toEqual({ complete: true, passed: 21, safeEscalation: 6, failed: 1, notRun: 0 })
    for (const text of ['Missing Purchase Order', 'Duplicate invoice', 'Over-threshold variance', 'ERP timeout', 'Unreadable PDF']) expect(plain(html(hk, 172))).toContain(text)
    expect(count(plain(html(hk, 172)), 'Missing Purchase Order')).toBe(2)
  })

  test('H-090: v0.2 completes at f180 with 22 Passed, 6 Passed — Expected Safe Escalation, 0 Failed and 28/28 intended outcomes correct; no pointer', () => {
    expect(at(hk, 179).state.phase).toBe('ST07')
    const done = at(hk, 180)
    expect(done.state.phase).toBe('ST09')
    expect(done.state.route).toBe('SC20')
    expect(summaryAt(hk, 180, 'agent-v0.2')).toEqual({ complete: true, passed: 22, safeEscalation: 6, failed: 0, notRun: 0 })
    const page = plain(html(hk, 195))
    for (const text of ['22 Passed', '6 Passed — Expected Safe Escalation', '0 Failed', '28/28 intended outcomes correct']) expect(page).toContain(text)
    expect(at(hk, 195).view.cursor.visible).toBe(false)
  })

  test('H-091: the gate rows are checked by their own events: the evaluation at f180, the owner at f222, the scope at f234; Deploy waits for all', () => {
    const rows = (frame: number) => Object.fromEntries(gateChecks(at(hk, frame).state).map((check) => [check.id, check.met]))
    expect(rows(29)).toMatchObject({ examples: true, scenarios: false, edgeCases: false, ownerApproval: false })
    expect(rows(179)).toMatchObject({ examples: true, scenarios: false, edgeCases: false })
    expect(rows(180)).toMatchObject({ examples: true, scenarios: true, edgeCases: true, ownerApproval: false })
    expect(rows(221)).toMatchObject({ ownerApproval: false })
    expect(rows(222)).toMatchObject({ ownerApproval: true })
    const page = plain(html(hk, 210))
    for (const text of ['28/25 representative scenarios', '6/5 edge/negative', 'Owner approval']) expect(page).toContain(text)
    expect(tagOf(html(hk, 210), 'deploy')).toContain('aria-disabled="true"')
    expect(tagOf(html(hk, 225), 'deploy')).toContain('aria-disabled="true"')
    expect(at(hk, 233).state.agent.scopeConfirmed).toBe(false)
    expect(tagOf(html(hk, 233), 'deploy')).toContain('aria-disabled="true"')
    expect(at(hk, 234).state.agent.scopeConfirmed).toBe(true)
    expect(tagOf(html(hk, 234), 'deploy')).not.toContain('aria-disabled="true"')
    expect(at(hk, 239).state.phase).toBe('ST09')
  })
})

describe('lk-l8-simulate: the run continues from lk-l7-create, fails at 2.00%, is corrected and released', () => {
  test('lk-l7-create f480 to f539: SC19 `Run Evaluation` is hovered, pressed at f522 and the suite executes from there', () => {
    expect(plain(html(l7, 500))).toContain('Run Evaluation')
    expect(at(l7, 507).view.cursor.target).toBe('run-scenarios')
    expect(at(l7, 521).state.evaluations).toEqual([])
    expect(latestSuite(at(l7, 522))).toMatchObject({ versionId: 'agent-v0.1', status: 'running' })
    expect(hasCyan(html(l7, 539))).toBe(true)
    expect(hasCyan(html(l7, 521))).toBe(false)
  })

  test('the run is continuous across the clip boundary: the position at lk-l8 f0 is one frame past lk-l7 f539', () => {
    const last = at(l7, 539)
    const first = at(lk, 0)
    const before = simView({ state: last.state, film: filmContextOf(last) })
    const after = simView({ state: first.state, film: filmContextOf(first) })
    expect(before.phase).toBe('running')
    expect(after.phase).toBe('running')
    expect(after.position).toBeGreaterThan(before.position)
    expect(after.position - before.position).toBeLessThan(1)
    expect(first.state.ui.simulator).toMatchObject({ view: 'stream', runLabel: 'Run Evaluation', runFrames: 48, runLead: 18 })
  })

  test('L-093: the row stream lists the same 28 scenarios in order; only the executing row is cyan; no row carries a verdict', () => {
    for (const frame of [0, 10, 20, 29]) {
      const page = html(lk, frame)
      expect(count(page, 'data-scenario="SCN-')).toBe(28)
      const states = dataStates(page)
      expect(states.filter((state) => state === 'running')).toHaveLength(1)
      expect(states.some((state) => state === 'passed' || state === 'safeEscalation' || state === 'failed')).toBe(false)
      expect(hasCyan(page)).toBe(true)
    }
    expect([...html(lk, 5).matchAll(/data-scenario="(SCN-\d{3})"/g)].map((match) => match[1])).toEqual(range(1, 28).map((n) => `SCN-${String(n).padStart(3, '0')}`))
    expect(html(lk, 0)).toContain('translateY(0px)')
    expect(html(lk, 27)).toContain('translateY(-120px)')
  })

  test('L-094: the run completes at f30, cyan goes out and v0.1 reads 21 / 6 / 1', () => {
    expect(at(lk, 29).state.running.simulation).toBe(true)
    const done = at(lk, 30)
    expect(done.state.running.simulation).toBe(false)
    expect(done.state.route).toBe('SC20')
    expect(summaryAt(lk, 30, 'agent-v0.1')).toEqual({ complete: true, passed: 21, safeEscalation: 6, failed: 1, notRun: 0 })
    expect(hasCyan(html(lk, 30))).toBe(false)
    for (const text of ['21 Passed', '6 Passed — Expected Safe Escalation', '1 Failed']) expect(plain(html(lk, 45))).toContain(text)
  })

  test('L-095 to L-097: the failed scenario, its replay, and the rule', () => {
    expect(at(lk, 89).state.ui.discovery.drawer).toBeNull()
    expect(at(lk, 90).state.selectedScenario).toBe('SCN-022')
    expect(at(lk, 100).state.ui.discovery.drawer).toBe('replay')
    expect(plain(html(lk, 100))).toContain('Expected: accept')
    expect(plain(html(lk, 100))).toContain('Actual: escalate')
    expect(at(lk, 135).state.ui.discovery.drawer).toBe('AP-RULE-009')
    expect(plain(html(lk, 140))).toContain('> 2.00% requires approval')
  })

  test('L-098 to L-100: the missing-PO safe escalation is selected as a pass, and the six safe cases are never counted as failures', () => {
    expect(at(lk, 150).state.ui.discovery.drawer).toBeNull()
    expect(at(lk, 165).state.selectedScenario).toBe('SCN-023')
    const page = plain(html(lk, 170))
    expect(page).toContain('SCN-023 · Missing PO, Ironbark; escalate')
    expect(page).toContain('Passed — Expected Safe Escalation')
    expect(at(lk, 210).state.selectedScenario).toBeNull()
    for (const frame of [170, 220]) {
      const states = dataStates(html(lk, frame))
      expect(states.filter((state) => state === 'failed')).toHaveLength(1)
      expect(states.filter((state) => state === 'safeEscalation')).toHaveLength(6)
    }
  })

  test('L-101: the comparison shows v0.1 against the proposed v0.2; nothing of v0.2 has run', () => {
    expect(at(lk, 254).state.ui.simulator.compare).toBe(false)
    expect(at(lk, 255).state.ui.simulator.compare).toBe(true)
    expect(at(lk, 265).state.evaluations.map((run) => run.versionId)).toEqual(['agent-v0.1'])
    expect(plain(html(lk, 265))).toContain('v0.2 · Proposed correction')
  })

  test('L-102: SC19 shows the grid again, bound to v0.2; the press at f284 runs it for 16 frames and the progress is cyan only then', () => {
    const idle = at(lk, 275)
    expect(idle.state.route).toBe('SC19')
    expect(idle.state.ui.simulator).toMatchObject({ view: 'grid', runLabel: 'Run Evaluation', runFrames: 16 })
    expect(at(lk, 284).state.ui.simulator).toMatchObject({ runLead: 0, compare: false })
    expect(hasCyan(html(lk, 275))).toBe(false)
    expect(dataStates(html(lk, 275)).every((state) => state === 'notRun')).toBe(true)
    expect(latestSuite(at(lk, 284))).toMatchObject({ versionId: 'agent-v0.2', status: 'running' })
    expect(hasCyan(html(lk, 292))).toBe(true)
    expect(at(lk, 299).state.running.simulation).toBe(true)
  })

  test('L-103 and L-104: v0.2 reads 22 / 6 / 0 with no cyan; the side-by-side comparison aligns the equality verdict, Failed to Passed', () => {
    const done = at(lk, 300)
    expect(done.state.phase).toBe('ST09')
    expect(summaryAt(lk, 300, 'agent-v0.2')).toEqual({ complete: true, passed: 22, safeEscalation: 6, failed: 0, notRun: 0 })
    expect(summaryAt(lk, 300, 'agent-v0.1')).toEqual({ complete: true, passed: 21, safeEscalation: 6, failed: 1, notRun: 0 })
    expect(hasCyan(html(lk, 310))).toBe(false)
    for (const text of ['22 Passed', '6 Passed — Expected Safe Escalation', '0 Failed', '28/28 intended outcomes correct']) expect(plain(html(lk, 310))).toContain(text)
    const compare = html(lk, 350)
    expect(at(lk, 350).state.ui.simulator.compare).toBe(true)
    expect(compare).toContain('data-verdicts="failed/passed"')
    for (const text of ['v0.1 · Failed evaluation', 'v0.2 · Passed evaluation', '21 Passed', '22 Passed', '1 Failed', '0 Failed']) expect(plain(compare)).toContain(text)
    expect(at(lk, 359).view.cursor.target).toBe('equality-row')
  })

  test('L-105 to L-107: the gate is checked by the evaluation, then by Marcus alone; the release is approved and the scope confirmed in two presses', () => {
    const rows = (frame: number) => Object.fromEntries(gateChecks(at(lk, frame).state).map((check) => [check.id, check.met]))
    expect(at(lk, 360).state.route).toBe('SC18')
    expect(rows(360)).toMatchObject({ examples: true, scenarios: true, edgeCases: true, ownerApproval: false })
    expect(rows(404)).toMatchObject({ ownerApproval: false })
    expect(rows(405)).toMatchObject({ ownerApproval: true })
    expect(at(lk, 416).state.agent.scopeConfirmed).toBe(false)
    expect(at(lk, 417).state.agent.scopeConfirmed).toBe(true)
    for (const frame of [420, 449]) {
      expect(at(lk, frame).state.route).toBe('SC18')
      expect(at(lk, frame).view.cursor.visible).toBe(false)
    }
    expect(plain(html(lk, 440))).toContain('Release target: v1.0 · Stage 3 Supervised Assist')
    expect(plain(html(lk, 440))).toContain('AP East')
  })

  test('L-108 Choose batch: SC21 opens at f450, the press on `Confirm 11 invoices` lands at f465 as CONFIRM_SELECTION and starts nothing', () => {
    expect(at(lk, 449).state.route).toBe('SC18')
    expect(at(lk, 449).state.ui.job.selection).toBe('proposed')
    for (const frame of [450, 464, 465, 479]) expect(at(lk, frame).state.route).toBe('SC21')
    const cursor = lk.events.find((event) => event.type === 'cursor' && event.frame === 450)
    expect(cursor).toMatchObject({ duration: 15, click: true, target: 'confirm-selection' })
    expect(at(lk, 450).view.cursor.visible).toBe(true)
    const press = lk.events.filter((event) => event.type === 'action' && event.action.type === 'CONFIRM_SELECTION')
    expect(press.map((event) => event.frame)).toEqual([465])
    expect(at(lk, 464).state.ui.job.selection).toBe('proposed')
    expect(at(lk, 465).state.ui.job.selection).toBe('confirmed')
    expect(at(lk, 465).rejections).toEqual([])
    for (const frame of [465, 479]) {
      expect(at(lk, frame).state.phase).toBe('ST09')
      expect(at(lk, frame).state.ui.job.dialog).toBe('closed')
      expect(at(lk, frame).state.running.job).toBe(false)
      expect(hasCyan(html(lk, frame))).toBe(false)
    }
    expect(at(lk, 479).view.cursor.target).toBe('confirm-selection')
    expect(plain(html(lk, 470))).toContain('JOB-0117')
    expect(buildSidecar(lk).anchors['confirm-selection']?.[470]?.visible).toBe(true)
    expect(buildSidecar(lk).anchors['confirm-selection']?.[449]?.visible).toBe(false)
  })
})

describe('cyan exists exactly while an evaluation runs', () => {
  for (const [label, timeline] of [['hk-h4e-simulate', hk], ['lk-l8-simulate', lk], ['lk-l7-create (simulator tail)', l7]] as const) {
    test(`${label}: execution cyan is on every sampled frame where the reducer's evaluation runs, and on no other`, () => {
      let running = 0
      for (const frame of sampled(timeline)) {
        const resolved = at(timeline, frame)
        const page = html(timeline, frame)
        expect(hasCyan(page)).toBe(resolved.state.running.simulation)
        if (resolved.state.running.simulation) running += 1
      }
      if (timeline !== l7) expect(running).toBeGreaterThan(5)
    })
  }

  test('a safe escalation is never drawn as a failure: on every sampled results frame the failed glyph count equals the failed total', () => {
    for (const timeline of [hk, lk]) {
      for (const frame of sampled(timeline)) {
        const resolved = at(timeline, frame)
        if (resolved.state.route !== 'SC20' || resolved.state.ui.simulator.compare) continue
        const run = [...resolved.state.evaluations].reverse().find((candidate) => candidate.status === 'complete')
        const failed = run ? runSummary(run).failed : 0
        const states = dataStates(html(timeline, frame))
        expect(states.filter((state) => state === 'failed')).toHaveLength(failed)
        expect(states.filter((state) => state === 'safeEscalation')).toHaveLength(6)
      }
    }
  })
})

describe('tile geometry: 96 x 52 tiles, 8 px gaps, 408 x 412 centred in the 472 x 416 host', () => {
  test('the 28 tile rectangles are the authored grid', () => {
    const tiles = range(0, 27).map(simTile)
    expect(tiles.every((tile) => tile.width === TILE.width && tile.height === TILE.height)).toBe(true)
    expect(tiles[1]!.x - tiles[0]!.x - TILE.width).toBe(8)
    expect(tiles[4]!.y - tiles[0]!.y - TILE.height).toBe(8)
    const right = Math.max(...tiles.map((tile) => tile.x + tile.width))
    const bottom = Math.max(...tiles.map((tile) => tile.y + tile.height))
    const left = Math.min(...tiles.map((tile) => tile.x))
    const top = Math.min(...tiles.map((tile) => tile.y))
    expect([right - left, bottom - top]).toEqual([408, 412])
    expect([left - SIM_HOST.x, SIM_HOST.x + SIM_HOST.width - right]).toEqual([32, 32])
    expect([top - SIM_HOST.y, SIM_HOST.y + SIM_HOST.height - bottom]).toEqual([2, 2])
  })

  test('the rendered grid places every tile at its authored rectangle, relative to the grid host', () => {
    const page = html(hk, 5)
    for (const index of range(0, 27)) {
      const id = `SCN-${String(index + 1).padStart(3, '0')}`
      const tag = page.match(new RegExp(`<button[^>]*data-scenario="${id}"[^>]*>`))?.[0] ?? ''
      const rect = simTile(index)
      expect(tag).toContain(`left:${rect.x - SIM_HOST.x}px`)
      expect(tag).toContain(`top:${rect.y - SIM_HOST.y}px`)
      expect(tag).toContain('width:96px')
      expect(tag).toContain('height:52px')
    }
  })
})

describe('seeking: original, reversed and direct seeks give the same frame and the sidecar agrees', () => {
  const signature = (timeline: Timeline, frame: number): string => JSON.stringify(at(timeline, frame)) + html(timeline, frame)

  for (const [label, timeline] of [['hk-h4e-simulate', hk], ['lk-l8-simulate', lk]] as const) {
    test(`${label}: a reverse pass and a shuffled direct pass equal the linear pass`, () => {
      const list = sampled(timeline)
      const linear = list.map((frame) => signature(timeline, frame))
      const reverse = [...list].reverse().map((frame) => signature(timeline, frame)).reverse()
      expect(reverse).toEqual(linear)
      const shuffled = list.map((_, i) => list[(i * 7) % list.length] as number)
      expect(shuffled.map((frame) => signature(timeline, frame))).toEqual(shuffled.map((frame) => linear[list.indexOf(frame)] as string))
    })

    test(`${label}: the sidecar samples every named anchor on every frame and hides exactly what the screen hides`, () => {
      const sidecar = buildSidecar(timeline)
      expect(sidecar.frameCount).toBe(timeline.durationFrames)
      for (const name of ['scenario-grid', 'run-scenarios', 'failed-scenario', 'replay', 'version-compare', 'results']) {
        expect(sidecar.anchors[name]).toHaveLength(timeline.durationFrames)
      }
      for (const frame of sampled(timeline)) {
        const resolved = at(timeline, frame)
        const route = resolved.state.route
        const compare = resolved.state.ui.simulator.compare
        const drawer = resolved.state.ui.discovery.drawer
        expect(sidecar.anchors['scenario-grid']?.[frame]?.visible).toBe(route === 'SC19')
        expect(sidecar.anchors['run-scenarios']?.[frame]?.visible).toBe(route === 'SC19')
        expect(sidecar.anchors['failed-scenario']?.[frame]?.visible).toBe(route === 'SC20')
        expect(sidecar.anchors['results']?.[frame]?.visible).toBe(route === 'SC20' && !compare)
        expect(sidecar.anchors['version-compare']?.[frame]?.visible).toBe(route === 'SC20' && compare)
        expect(sidecar.anchors['replay']?.[frame]?.visible).toBe(route === 'SC20' && drawer === 'replay')
        expect(sidecar.anchors['rule-drawer']?.[frame]?.visible).toBe(drawer !== null && drawer !== 'replay')
        expect(sidecar.anchors['deploy']?.[frame]?.visible).toBe(route === 'SC18')
      }
    })
  }
})
