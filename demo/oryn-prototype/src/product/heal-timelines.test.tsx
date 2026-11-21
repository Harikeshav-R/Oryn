import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { authorClip, formatTimeline } from '../../scripts/author-product-clips'
import { CLIPS, startFrameOf } from '../../scripts/clips'
import { parseTimeline, resolveFrame, validateTimeline } from '@/film'
import type { Timeline } from '@/film'
import { jobCounts, reconstruct } from '@/state'
import type { Action, State } from '@/state'
import { HK_H4G, LK_L10 } from './clip-specs-heal'
import { ProductFilmSurface } from './FilmProduct'
import { CONTAINMENT_WIPE_FRAMES, wipeEdge } from './incident'
import { regressionView } from './repair'

const cases = [
  { spec: HK_H4G, duration: 420, start: 3840, seconds: 128, landing: 30, manual: 120, teachScreen: 135, repairScreen: 210, complete: 300, releaseScreen: 330, verified: 372, close: 417 },
  { spec: LK_L10, duration: 615, start: 3705, seconds: 123.5, landing: 9, manual: 135, teachScreen: 150, repairScreen: 225, complete: 345, releaseScreen: 375, verified: 471, close: 540 },
] as const

const markup = (timeline: Timeline, frame: number): string => renderToStaticMarkup(createElement(ProductFilmSurface, { resolved: resolveFrame(timeline, frame) })).replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&')
const counts = (state: State): string => {
  const c = jobCounts(state)
  return `${c.verified}/${c.escalated}/${c.approval}/${c.unknown}`
}

describe('heal timelines', () => {
  test('FX-01 stays inside the authored clip boundaries', () => {
    expect(CONTAINMENT_WIPE_FRAMES).toBe(12)
    expect(CONTAINMENT_WIPE_FRAMES / 30).toBe(0.4)
    expect([wipeEdge(0), wipeEdge(5), wipeEdge(11)]).toEqual([107, 640, 1280])
    expect(3705 / 30).toBe(123.5)
    expect((3705 + 9) / 30).toBe(123.8)
    expect((3705 + 20 + 1) / 30).toBe(124.2)
    expect(3840 / 30).toBe(128)
    expect((3840 + 30) / 30).toBe(129)
    expect((3840 + 30) / 30).toBeGreaterThanOrEqual(128 + 0.3)
  })

  for (const c of cases) {
    const file = path.resolve(import.meta.dir, '../../film', c.spec.cut, `${c.spec.clipId}.timeline.json`)
    const source = readFileSync(file, 'utf8')
    const timeline = parseTimeline(JSON.parse(source))
    const at = (frame: number) => resolveFrame(timeline, frame)
    const actionFrames = (type: Action['type']): number[] => timeline.events.flatMap((event) => event.type === 'action' && event.action.type === type ? [event.frame] : [])
    const one = (type: Action['type']): number => {
      const frames = actionFrames(type)
      expect(frames).toHaveLength(1)
      const frame = frames[0]
      if (frame === undefined) throw new Error(`Missing action ${type}`)
      return frame
    }

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

      test('contains once and renders the twelve-frame wipe with no theme toggle in its window', () => {
        expect(one('CONTAIN_INCIDENT')).toBe(c.landing)
        expect(at(c.landing - 1).state.theme).toBe('light')
        for (let frame = c.landing; frame < c.landing + 12; frame++) {
          expect(at(frame).state.theme).toBe('dark')
          expect(markup(timeline, frame)).toContain('data-containment-wipe')
        }
        for (const frame of [c.landing - 1, c.landing + 12]) expect(markup(timeline, frame)).not.toContain('data-containment-wipe')
        for (const index of [0, 5, 11]) expect(markup(timeline, c.landing + index)).toContain(`clip-path:inset(0 ${1280 - wipeEdge(index)}px 0 0)`)
        expect(actionFrames('SET_THEME').filter((frame) => frame >= c.landing && frame < c.landing + 12)).toEqual([])
      })

      test('shows attributable completion and six distinct regression cases in the product panel', () => {
        const manual = markup(timeline, c.manual + 5)
        expect(manual).toContain('Elena Ruiz · INV-48231 · manually completed')
        expect(manual).toContain('Completion evidence')
        const repair = markup(timeline, c.spec.cut === 'launch' ? 300 : 260)
        expect(repair).toContain('Original failure + 5 nearby variants')
        for (const id of ['029', '030', '031', '032', '033', '034']) expect(repair).toContain(`SCN-${id}`)
      })

      test('keeps authority decisions and correction draft in strict order', () => {
        const ordered: Action['type'][] = ['CONTAIN_INCIDENT', 'COMPLETE_CASE_MANUALLY', 'TEACH', 'VALIDATE_SCOPE', 'PROPOSE_REPAIR', 'RUN_REGRESSION', 'COMPLETE_REGRESSION', 'LIMITED_RELEASE']
        const frames = ordered.map(one)
        const verify = actionFrames('VERIFY_COHORT_OUTCOME')
        expect(verify).toHaveLength(3)
        const expand = one('EXPAND_RELEASE')
        const close = one('CLOSE_INCIDENT')
        let previous = -1
        for (const frame of frames) {
          expect(frame).toBeGreaterThan(previous)
          previous = frame
        }
        for (const frame of verify) {
          expect(frame).toBeGreaterThan(previous)
          expect(frame).toBeLessThan(expand)
        }
        if (c.spec.cut === 'hackathon') expect(new Set(verify).size).toBe(3)
        expect(close).toBeGreaterThan(expand)
        expect(one('SET_TEACH_ANSWER')).toBeLessThan(one('TEACH'))
        expect(one('LINK_TEACH_RULE')).toBeLessThan(one('TEACH'))
      })

      test('preserves domain invariants on every frame', () => {
        const run = one('RUN_REGRESSION')
        const complete = one('COMPLETE_REGRESSION')
        const limited = one('LIMITED_RELEASE')
        const expand = one('EXPAND_RELEASE')
        const close = one('CLOSE_INCIDENT')
        const verify = actionFrames('VERIFY_COHORT_OUTCOME')
        expect(counts(reconstruct('ST11'))).toBe('7/2/1/1')
        expect(actionFrames('VERIFY_READBACK')).toEqual([0])
        for (let frame = 0; frame < c.duration; frame++) {
          const state = at(frame).state
          expect({ frame, running: state.running }).toEqual({ frame, running: { simulation: false, job: false, regression: frame >= run && frame < complete } })
          expect({ frame, counts: counts(state) }).toEqual({ frame, counts: '8/2/0/1' })
          if (frame < limited) expect({ frame, stage: state.release.stage }).toEqual({ frame, stage: 'none' })
          const verified = state.release.cohort.filter((outcome) => outcome === 'verified').length
          expect(verified).toBeLessThanOrEqual(verify.filter((landing) => landing <= frame).length)
          if (frame >= expand) expect({ frame, verified }).toEqual({ frame, verified: 3 })
          expect({ frame, closed: state.incident.status === 'closed' }).toEqual({ frame, closed: frame >= close })
          if (frame >= complete) {
            const summary = regressionView({ state }).summary
            expect({ frame, ...summary }).toEqual({ frame, passed: 28, safeEscalation: 6, failed: 0, notRun: 0, complete: true })
          }
          if (state.route === 'SC26') expect(markup(timeline, frame)).not.toMatch(/confirmed cause|format change — confirmed/i)
        }
      })

      test('shows storyboard evidence and all declared anchors at sampled states', () => {
        const settled = markup(timeline, c.landing + 18)
        for (const label of ['INC-0042', 'Contained', '3 affected cases paused', 'Supplier document format change — unconfirmed']) expect(settled).toContain(label)
        expect(settled).not.toMatch(/confirmed cause|format change — confirmed/i)
        for (const id of ['INV-48231', 'INV-48233', 'INV-48236']) {
          expect(settled).toMatch(new RegExp(`${id}(?:(?!</button>)[\\s\\S])*data-glyph="paused"(?:(?!</button>)[\\s\\S])*Paused`))
        }
        expect((settled.match(/data-glyph="paused"/g) ?? [])).toHaveLength(3)
        const teach = markup(timeline, c.teachScreen)
        for (const label of ['Is the $38.50 handling fee part of the invoice total, and is it covered by the PO terms?', 'AP-RULE-017 Supplier handling fees']) expect(teach).toContain(label)
        expect(markup(timeline, c.repairScreen)).toContain('REP-0042-1')
        const result = markup(timeline, c.releaseScreen)
        for (const label of ['34 scenarios', '28 Passed', '6 Passed — Expected Safe Escalation', '0 Failed']) expect(result).toContain(label)
        expect(markup(timeline, one('LIMITED_RELEASE'))).toContain('Limited release')
        expect(markup(timeline, c.verified)).toContain('3/3 Verified Complete')
        expect(markup(timeline, c.close)).toContain('Repaired - Validated')
        const samples = [0, c.landing - 1, c.landing, c.landing + 5, c.landing + 11, c.landing + 18, c.manual, c.teachScreen, c.repairScreen, c.complete, c.releaseScreen, c.verified, c.close, c.duration - 1]
        for (const frame of samples) {
          const rendered = markup(timeline, frame)
          for (const anchor of Object.keys(at(frame).view.anchors)) expect(rendered).toContain(`data-film-anchor="${anchor}"`)
          expect(rendered).not.toMatch(/confirmed cause|format change — confirmed/i)
        }
      })

      test('shuffled direct seeks reproduce linear state and anchors', () => {
        const signature = (frame: number): string => {
          const resolved = at(frame)
          return JSON.stringify([resolved.state, resolved.view.anchors])
        }
        const linear = Array.from({ length: c.duration }, (_, frame) => signature(frame))
        const shuffled = Array.from({ length: c.duration }, (_, frame) => frame).sort((a, b) => ((a * 137) % c.duration) - ((b * 137) % c.duration))
        for (const frame of shuffled) {
          const expected = linear[frame]
          if (expected === undefined) throw new Error(`Missing linear result for frame ${frame}`)
          expect(signature(frame)).toBe(expected)
        }
      })
    })
  }
})
