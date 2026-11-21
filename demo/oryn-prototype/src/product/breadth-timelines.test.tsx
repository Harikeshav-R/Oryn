import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { authorClip, formatTimeline } from '../../scripts/author-product-clips'
import { CLIPS, startFrameOf } from '../../scripts/clips'
import { parseTimeline, resolveFrame, validateTimeline } from '@/film'
import type { Timeline } from '@/film'
import { jobCounts } from '@/state'
import type { Action, State, StateId } from '@/state'
import { HK_H4H, LK_L11 } from './clip-specs-breadth'
import { LK_L10 } from './clip-specs-heal'
import { ProductFilmSurface } from './FilmProduct'

const load = (spec: { readonly cut: string; readonly clipId: string }): Timeline =>
  parseTimeline(JSON.parse(readFileSync(path.resolve(import.meta.dir, '../../film', spec.cut, `${spec.clipId}.timeline.json`), 'utf8')))
const markup = (timeline: Timeline, frame: number): string => renderToStaticMarkup(createElement(ProductFilmSurface, { resolved: resolveFrame(timeline, frame) })).replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&')
const visible = (html: string, anchor: string): boolean => {
  const tag = new RegExp(`<[^>]*data-film-anchor="${anchor}"[^>]*>`).exec(html)
  if (!tag) throw new Error(`No element for anchor ${anchor}`)
  return !/display:\s*none/.test(tag[0])
}
const counts = (state: State): string => {
  const c = jobCounts(state)
  return `${c.verified}/${c.escalated}/${c.approval}/${c.unknown}`
}

interface Beat {
  readonly frame: number
  readonly phase: StateId
  readonly route: State['route']
  readonly text: readonly string[]
  /** Anchors that must be visible at that frame. */
  readonly shown: readonly string[]
}

const cases = [
  {
    spec: HK_H4H,
    duration: 480,
    start: 4260,
    seconds: 142,
    beats: [
      { frame: 20, phase: 'ST17', route: 'SC16', text: ['Operations Map', 'AP-RULE-009 Variance threshold', 'AP-RULE-017 Supplier handling fees', 'Supplier Invoice Reconciler', 'INC-0042', 'Workflow', 'Rule', 'Agent', 'Incident'], shown: ['map-agent', 'map-detail'] },
      { frame: 100, phase: 'ST19', route: 'SC31', text: ['Invoice approval threshold', '2.00%', '1.50%', 'effective Dec 1', '1 playbook', '1 agent', '34 tests', 'Needs Revalidation'], shown: ['policy-impact', 'policy-diff'] },
      { frame: 158, phase: 'ST19', route: 'SC04', text: ['Known fix from AP East: Vendor tax ID format', 'Guide Me'], shown: ['hud-peer-fix', 'guide-me'] },
      { frame: 200, phase: 'ST20', route: 'SC10', text: ['12% discount', 'Requires Tier 3 approval - Daniel Okafor', 'Request approval'], shown: ['discount-draft', 'blocked-action', 'blocked-submit', 'request-approval'] },
      { frame: 235, phase: 'ST21', route: 'SC30', text: ['Version history', 'Playbook v1.0 · Approved for Guidance', 'Agent v0.1 · Candidate', 'Agent v0.2 · Candidate', 'Agent v1.0 · Released · Stage 3', 'Agent v1.1 · Repair'], shown: ['version-row', 'version-comparison'] },
      { frame: 170, phase: 'ST19', route: 'SC04', text: ['Check the vendor tax ID format'], shown: ['hud-peer-fix'] },
      { frame: 260, phase: 'ST22', route: 'SC33', text: ['Command Center', 'Verified outcomes', 'Exceptions', 'Incidents', 'Release state', 'JOB-0117', 'INC-0042 · Closed'], shown: ['command-center', 'cc-verified'] },
      { frame: 290, phase: 'ST23', route: 'SC34', text: ['Immutable change history', 'Export audit pack', 'Raw private media is not included.'], shown: ['audit-export', 'audit-drawer'] },
      { frame: 320, phase: 'ST24', route: 'SC35', text: ['Notifications', 'Approval Required', 'INC-0042 Contained', 'Confirm Kestrel handling-fee terms in writing'], shown: ['notifications', 'notification-toast'] },
      { frame: 375, phase: 'ST24', route: 'SC36', text: ['Observe', 'Guide', 'Assist', 'Run Supervised', 'Run Autonomously', '— Unavailable', 'Observe by per-meeting opt-in'], shown: ['capability-matrix', 'cap-row-netsuite'] },
      { frame: 470, phase: 'ST24', route: 'SC33', text: ['8 Verified Complete', '2 Escalated', '0 Approval Required', '1 Outcome Unknown', 'Partially Complete'], shown: ['cc-verified'] },
    ] satisfies readonly Beat[],
  },
  {
    spec: LK_L11,
    duration: 600,
    start: 4320,
    seconds: 144,
    beats: [
      { frame: 50, phase: 'ST17', route: 'SC16', text: ['Operations Map', 'Supplier Invoice Reconciler', 'INC-0042'], shown: ['map-agent', 'map-detail'] },
      { frame: 100, phase: 'ST19', route: 'SC31', text: ['2.00%', '1.50%', 'effective Dec 1', '1 playbook', '1 agent', '34 tests', 'Needs Revalidation', 'Proposed boundary tests'], shown: ['policy-impact', 'boundary-tests'] },
      { frame: 140, phase: 'ST19', route: 'SC04', text: ['Known fix from AP East: Vendor tax ID format', 'Guide Me'], shown: ['hud-peer-fix', 'guide-me'] },
      { frame: 170, phase: 'ST19', route: 'SC04', text: ['Check the vendor tax ID format'], shown: ['hud-peer-fix'] },
      { frame: 200, phase: 'ST20', route: 'SC10', text: ['12% discount', 'Requires Tier 3 approval - Daniel Okafor', 'Request approval'], shown: ['blocked-action', 'blocked-submit'] },
      { frame: 250, phase: 'ST22', route: 'SC33', text: ['8 Verified Complete', '2 Escalated', '1 Outcome Unknown', 'INC-0042 · Closed', 'v1.1 · Expanded'], shown: ['command-center'] },
      { frame: 290, phase: 'ST22', route: 'SC33', text: ['14-Day X-Ray', 'Scope', 'Evidence quality', 'Privacy'], shown: ['cc-xray'] },
      { frame: 320, phase: 'ST23', route: 'SC34', text: ['Immutable change history', 'Export audit pack', 'Raw private media is not included.'], shown: ['audit-export', 'audit-drawer'] },
      { frame: 350, phase: 'ST24', route: 'SC35', text: ['Notifications', 'Approval Required', 'INC-0042 Contained', 'Confirm Kestrel handling-fee terms in writing'], shown: ['notifications', 'notice-expanded'] },
      { frame: 375, phase: 'ST24', route: 'SC36', text: ['Salesforce', 'Outlook', 'Excel', 'Teams', 'Meet', 'Edge', 'Gmail', 'NetSuite', 'Google Sheets', 'Slack', 'Zoom', 'HubSpot', 'Chrome'], shown: ['adapter-tiles'] },
      { frame: 400, phase: 'ST24', route: 'SC36', text: ['Observe', 'Guide', 'Assist', 'Run Supervised', 'Run Autonomously', '— Unavailable'], shown: ['capability-matrix', 'cap-headers'] },
      { frame: 495, phase: 'ST24', route: 'SC36', text: ['Observe by per-meeting opt-in'], shown: ['cap-row-zoom'] },
    ] satisfies readonly Beat[],
  },
] as const

describe('breadth timelines', () => {
  for (const c of cases) {
    const timeline = load(c.spec)
    const source = readFileSync(path.resolve(import.meta.dir, '../../film', c.spec.cut, `${c.spec.clipId}.timeline.json`), 'utf8')
    const at = (frame: number) => resolveFrame(timeline, frame)
    const actionFrames = (type: Action['type']): number[] => timeline.events.flatMap((event) => (event.type === 'action' && event.action.type === type ? [event.frame] : []))

    describe(c.spec.clipId, () => {
      test('matches the authored spec, registry and timeline contract', () => {
        const clip = CLIPS.find((row) => row.clipId === c.spec.clipId)
        expect(source).toBe(formatTimeline(authorClip(c.spec)))
        expect(validateTimeline(timeline)).toEqual([])
        expect(timeline.durationFrames).toBe(c.duration)
        expect(timeline.filmStartFrame).toBe(c.start)
        expect(clip?.frames).toBe(c.duration)
        expect(clip?.startSeconds).toBe(c.seconds)
        expect(clip && startFrameOf(clip)).toBe(c.start)
        for (const event of timeline.events) expect(event.entry).toBe(c.spec.entryAt(event.frame))
      }, 120_000)

      test('shows each storyboard entry state with its exact labels and anchors', () => {
        for (const beat of c.beats) {
          const state = at(beat.frame).state
          expect({ frame: beat.frame, phase: state.phase, route: state.route }).toEqual({ frame: beat.frame, phase: beat.phase, route: beat.route })
          const html = markup(timeline, beat.frame)
          for (const label of beat.text) expect({ frame: beat.frame, label, found: html.includes(label) }).toEqual({ frame: beat.frame, label, found: true })
          for (const anchor of beat.shown) expect({ frame: beat.frame, anchor, visible: visible(html, anchor) }).toEqual({ frame: beat.frame, anchor, visible: true })
        }
      }, 60_000)

      test('keeps the job, hold, approval, restore and export boundaries on every frame', () => {
        for (let frame = 0; frame < c.duration; frame += 1) {
          const state = at(frame).state
          expect({ frame, counts: counts(state) }).toEqual({ frame, counts: '8/2/0/1' })
          expect({ frame, unknown: state.job.outcomes['INV-48220'] }).toEqual({ frame, unknown: 'unknown' })
          expect({ frame, request: state.unsafeRequest }).toEqual({ frame, request: 'blocked' })
          expect({ frame, restored: state.restoredVersion }).toEqual({ frame, restored: null })
          expect({ frame, exported: state.audit.includes('A15') }).toEqual({ frame, exported: false })
          expect({ frame, running: state.running }).toEqual({ frame, running: { simulation: false, job: false, regression: false } })
          expect({ frame, toast: state.ui.breadth.notifications.toast === null || state.route === 'SC35' }).toEqual({ frame, toast: true })
        }
      })

      test('lands the clicks as separate reducer events and never sends a request, approval or export', () => {
        for (const type of ['REQUEST_APPROVAL', 'DENY_UNSAFE_REQUEST', 'RESTORE_VERSION', 'EXPORT_AUDIT_PACK', 'APPROVE', 'RESET'] as const) expect(actionFrames(type)).toEqual([])
        expect(actionFrames('SURFACE_TOAST').length).toBeLessThanOrEqual(1)
        expect(actionFrames('SELECT_MAP_NODE')).toHaveLength(1)
        expect(actionFrames('OPEN_GUIDE')).toHaveLength(1)
      })

      test('shuffled direct seeks reproduce linear state and anchors', () => {
        const signature = (frame: number): string => {
          const resolved = at(frame)
          return JSON.stringify([resolved.state, resolved.view.anchors])
        }
        const linear = Array.from({ length: c.duration }, (_, frame) => signature(frame))
        const shuffled = Array.from({ length: c.duration }, (_, frame) => frame).sort((a, b) => ((a * 137) % c.duration) - ((b * 137) % c.duration))
        for (const frame of shuffled) expect(signature(frame)).toBe(linear[frame] as string)
      })
    })
  }

  test('audit displays the recorded completed v0.2 evaluation without inventing an actor', () => {
    const html = markup(load(LK_L11), 305)
    for (const value of ['Actor: not recorded', 'Evaluation', 'SIM-AP-RECON v0.2', '28 scenarios', '22 Passed · 6 Passed — Expected Safe Escalation · 0 Failed']) expect(html).toContain(value)
  })

  test('H-123 and L-153 keep the blocked action blocked and the notification toast singular', () => {
    const hk = load(HK_H4H)
    const lk = load(LK_L11)
    expect(markup(hk, 200)).not.toMatch(/Approved|Submitted/)
    expect(markup(lk, 215)).not.toMatch(/Approved|Submitted/)
    expect((markup(hk, 320).match(/data-film-anchor="notification-toast"/g) ?? []).length).toBe(1)
    expect(resolveFrame(hk, 305).state.ui.breadth.notifications.toast).toBeNull()
    expect(resolveFrame(hk, 306).state.ui.breadth.notifications.toast).toBe('N-02')
  })

  test('the launch cut shows the version history at the end of the heal clip: SC30, dark, explanation after 02:23', () => {
    const timeline = load(LK_L10)
    expect(validateTimeline(timeline)).toEqual([])
    expect(resolveFrame(timeline, 554).state.route).toBe('SC29')
    for (const frame of [555, 570, 584]) {
      const state = resolveFrame(timeline, frame).state
      expect({ frame, phase: state.phase, route: state.route, theme: state.theme, hint: state.ui.breadth.versions.hint }).toEqual({ frame, phase: 'ST21', route: 'SC30', theme: 'dark', hint: false })
      expect({ frame, hint: visible(markup(timeline, frame), 'version-restore-hint') }).toEqual({ frame, hint: false })
    }
    for (const frame of [585, 614]) {
      const state = resolveFrame(timeline, frame).state
      expect({ frame, hint: state.ui.breadth.versions.hint, restored: state.restoredVersion, closed: state.incident.status }).toEqual({ frame, hint: true, restored: null, closed: 'closed' })
      expect({ frame, hint: visible(markup(timeline, frame), 'version-restore-hint') }).toEqual({ frame, hint: true })
      expect(markup(timeline, frame)).toContain('Restore affects future eligible work, not prior business effects')
    }
    const html = markup(timeline, 570)
    for (const label of ['Version history', 'Compare', 'Restore previous approved version', 'Agent v1.1 · Repair']) expect(html).toContain(label)
    expect(timeline.events.some((event) => event.type === 'action' && event.action.type === 'RESTORE_VERSION')).toBe(false)
  })
})
