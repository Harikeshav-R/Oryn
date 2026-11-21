import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CLIPS, startFrameOf } from '../../scripts/clips'
import { authorClip, formatTimeline } from '../../scripts/author-product-clips'
import { AGENT_DEFINITION } from '@/data/versions'
import { buildSidecar, parseTimeline, resolveFrame, typingCompleteFrame, validateTimeline } from '@/film'
import type { ResolvedFrame, Timeline, TypeEvent } from '@/film'
import { CLIP_SPECS } from './clip-specs'
import type { ClipSpec } from './clip-specs'
import { ProductFilmSurface } from './FilmProduct'

/** BOB-07 clips: hk-h4d-agent (H-077 to H-083) and lk-l7-create (L-075 to L-092). */

const FILM = path.resolve(import.meta.dir, '../../film')
const INTENT = AGENT_DEFINITION.intent
const fileOf = (spec: ClipSpec): string => path.join(FILM, spec.cut, `${spec.clipId}.timeline.json`)
const specOf = (clipId: string): ClipSpec => CLIP_SPECS.find((spec) => spec.clipId === clipId) as ClipSpec
const load = (spec: ClipSpec): Timeline => parseTimeline(JSON.parse(readFileSync(fileOf(spec), 'utf8')))
const at = (timeline: Timeline, frame: number): ResolvedFrame => resolveFrame(timeline, frame)
const html = (timeline: Timeline, frame: number): string => renderToStaticMarkup(createElement(ProductFilmSurface, { resolved: at(timeline, frame) }))
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const range = (first: number, last: number): number[] => Array.from({ length: last - first + 1 }, (_, i) => first + i)
const count = (markup: string, needle: string): number => markup.split(needle).length - 1
/** The whole opening tag of the element carrying `data-film-anchor="<name>"`. */
const tagOf = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}

const HK = specOf('hk-h4d-agent')
const LK = specOf('lk-l7-create')
const hk = load(HK)
const lk = load(LK)
const CLIP_LIST = [['hk-h4d-agent', hk], ['lk-l7-create', lk]] as const

const entries = (timeline: Timeline): Set<string> => new Set(timeline.events.map((event) => event.entry ?? ''))
const entryRange = (prefix: 'H' | 'L', first: number, last: number): Set<string> => new Set(range(first, last).map((n) => `${prefix}-${String(n).padStart(3, '0')}`))
const typeEvent = (timeline: Timeline): TypeEvent => timeline.events.find((event): event is TypeEvent => event.type === 'type') as TypeEvent
const frameOf = (timeline: Timeline, type: string): number => (timeline.events.find((event) => event.type === 'action' && event.action.type === type) as { frame: number }).frame
const sampled = (timeline: Timeline): number[] => [...new Set([...range(0, Math.floor((timeline.durationFrames - 1) / 3)).map((i) => i * 3), ...range(0, Math.floor(timeline.durationFrames / 30)).map((i) => i * 30), timeline.durationFrames - 1])].filter((frame) => frame < timeline.durationFrames)
/** Frames of the Agent Factory and the scope: `lk-l7-create` hands over to the simulator at f480 (BOB-08), where an evaluation runs. */
const ownFrames = (timeline: Timeline): number[] => sampled(timeline).filter((frame) => timeline === hk || frame < 480)

describe('BOB-07 timelines match the roadmap table and the storyboard entries', () => {
  for (const spec of [HK, LK]) {
    const timeline = load(spec)
    const clip = CLIPS.find((item) => item.clipId === spec.clipId)

    test(`${spec.clipId}: validates, has the table length and carries clip-local entries`, () => {
      expect(validateTimeline(timeline)).toEqual([])
      expect(clip?.frames).toBe(spec.durationFrames)
      expect(timeline.filmStartFrame).toBe(clip ? startFrameOf(clip) : undefined)
      expect(timeline.startAt).toBe('ST05')
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
    expect(entries(hk)).toEqual(entryRange('H', 77, 83))
    expect(entries(lk)).toEqual(entryRange('L', 75, 92))
  })

  test('the clips hold no camera move and no stage caption: the cinematic intent pill is the stage layer', () => {
    for (const [, timeline] of CLIP_LIST) {
      expect(timeline.events.some((event) => event.type === 'camera')).toBe(false)
      for (const frame of range(0, Math.floor((timeline.durationFrames - 1) / 30)).map((i) => i * 30)) expect(html(timeline, frame).toLowerCase()).not.toMatch(/subtitle|caption|stage pill/)
    }
  })
})

describe('typing: exact intent, deterministic, 28-34 characters a second', () => {
  for (const [label, timeline] of CLIP_LIST) {
    const event = typeEvent(timeline)
    const done = typingCompleteFrame(event)
    const chars = Array.from(INTENT).length

    test(`${label}: types the exact intent, whole, at a rate inside 28-34 characters a second`, () => {
      expect(event.text).toBe(INTENT)
      expect(event.charsPerSecond).toBeGreaterThanOrEqual(28)
      expect(event.charsPerSecond).toBeLessThanOrEqual(34)
      const seconds = (done - event.frame) / 30
      const rate = chars / seconds
      expect(rate).toBeGreaterThanOrEqual(27.5)
      expect(rate).toBeLessThanOrEqual(34.5)
    })

    test(`${label}: the field shows a growing prefix of the intent and no more, the same on every seek`, () => {
      let last = 0
      for (const frame of range(0, done + 3)) {
        const typed = at(timeline, frame).view.texts['intent']
        const shown = typed?.text ?? ''
        expect(INTENT.startsWith(shown)).toBe(true)
        expect(shown.length).toBeGreaterThanOrEqual(last)
        last = shown.length
      }
      expect(at(timeline, done).view.texts['intent']?.text).toBe(INTENT)
      expect(at(timeline, done - 1).view.texts['intent']?.text).not.toBe(INTENT)
      expect(at(timeline, done).view.texts['intent']?.complete).toBe(true)
    })

    test(`${label}: the intent reaches the reducer only when the last character is typed, and the draft follows it`, () => {
      expect(at(timeline, done - 1).state.ui.factory.intent).toBe('')
      expect(at(timeline, done).state.ui.factory.intent).toBe(INTENT)
      expect(frameOf(timeline, 'SET_INTENT')).toBe(done)
      expect(frameOf(timeline, 'CREATE_AGENT')).toBeGreaterThanOrEqual(done)
      expect(at(timeline, frameOf(timeline, 'CREATE_AGENT') - 1).state.phase).toBe('ST05')
      expect(at(timeline, frameOf(timeline, 'CREATE_AGENT')).state.phase).toBe('ST06')
      expect(at(timeline, frameOf(timeline, 'CREATE_AGENT')).state.agent.versions).toEqual(['agent-v0.1'])
    })

    test(`${label}: the caret stops with the submission and blank intent never advanced the screen`, () => {
      const submit = frameOf(timeline, 'CREATE_AGENT')
      expect(at(timeline, submit - 1).view.texts['intent']?.caret).toBe(true)
      expect(at(timeline, submit).view.texts['intent']?.caret).toBe(false)
      for (const frame of range(0, submit - 1)) expect(at(timeline, frame).state.route).toBe('SC17')
    })
  }

  test('hk-h4d-agent: the intent needs 75 frames at 34 characters a second, so it completes at f87 and the rows have 3 frames before the f90 cut', () => {
    expect(typingCompleteFrame(typeEvent(hk))).toBe(87)
    const shown = range(0, 89).filter((frame) => !/display:\s*none/.test(html(hk, frame).match(/<[^<>]*data-film-anchor="unverified-branch"[^<>]*>/)?.[0] ?? ''))
    expect(shown).toEqual([87, 88, 89])
    expect(at(hk, 89).state.route).toBe('SC17')
    expect(at(hk, 90).state.route).toBe('SC18')
  })

  test('lk-l7-create: 30 characters a second hits the storyboard prefixes and finishes before the submission at f120', () => {
    const prefix = (frame: number): number => (at(lk, frame).view.texts['intent']?.text ?? '').length
    expect(prefix(29)).toBe(0)
    expect(prefix(59)).toBeGreaterThanOrEqual(29)
    expect(prefix(59)).toBeLessThanOrEqual(33)
    expect(prefix(89)).toBeGreaterThanOrEqual(58)
    expect(prefix(89)).toBeLessThanOrEqual(64)
    expect(typingCompleteFrame(typeEvent(lk))).toBeLessThan(120)
    expect(typingCompleteFrame(typeEvent(lk))).toBeGreaterThanOrEqual(110)
    expect(frameOf(lk, 'CREATE_AGENT')).toBe(120)
  })
})

describe('the field, the sections and the branch by frame', () => {
  test('the field is empty and focused before typing: the click lands and outlines it, the sections are hidden', () => {
    const early = at(hk, 11)
    expect(early.state.route).toBe('SC17')
    expect(early.view.texts['intent']).toBeUndefined()
    expect(at(hk, 12).view.texts['intent']?.text).toBe('')
    expect(at(hk, 12).view.texts['intent']?.caret).toBe(true)
    expect(early.state.ui.factory.intent).toBe('')
    expect(at(hk, 14).view.outlines.some((outline) => outline.anchor === 'intent' && outline.kind === 'focus')).toBe(true)
    expect(early.view.cursor.target).toBe('intent')
    for (const name of ['agent-sections', 'unverified-branch']) expect(early.view.anchors[name]?.visible).toBe(false)
  })

  test('six sections and the unverified branch appear together with the draft, and stay while the drawer is open', () => {
    const first = frameOf(lk, 'CREATE_AGENT')
    for (const name of ['section-purpose', 'section-inputs', 'section-actions', 'section-rules', 'section-outputs', 'section-stopping-points', 'unverified-branch']) {
      expect(at(lk, first - 1).view.anchors[name]?.visible).toBe(false)
      expect(at(lk, first).view.anchors[name]?.visible).toBe(true)
      expect(at(lk, 200).view.anchors[name]?.visible).toBe(true)
    }
    const page = plain(html(lk, 160))
    for (const text of ['Purpose', 'Inputs', 'Actions', 'Rules', 'Outputs', 'Stopping points', 'Unverified branch', 'Continue']) expect(page).toContain(text)
  })

  test('L-081: the AP-RULE-009 source opens beside the draft with v0.1, Elena Ruiz and both threshold relations (GAP-SC-L-04)', () => {
    const open = at(lk, 200)
    expect(open.state.ui.discovery.drawer).toBe('AP-RULE-009')
    expect(open.state.route).toBe('SC17')
    const page = plain(html(lk, 200))
    for (const text of ['v0.1', 'Elena Ruiz', 'AP-RULE-009', 'variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept', 'Unverified branch']) expect(page).toContain(text)
    expect(open.state.agent.versions).toEqual(['agent-v0.1'])
    expect(open.state.evaluations).toEqual([])
    expect(at(lk, 209).state.ui.discovery.drawer).toBe('AP-RULE-009')
    expect(at(lk, 210).state.ui.discovery.drawer).toBeNull()
  })
})

describe('SC18 in the clips: the gate is pending until its own events', () => {
  for (const [label, timeline] of CLIP_LIST) {
    test(`${label}: on every sampled frame only the verified-examples row is checked; the evaluation and the owner are pending and nothing is released`, () => {
      let onScope = 0
      for (const frame of ownFrames(timeline)) {
        const resolved = at(timeline, frame)
        expect(resolved.state.evaluations).toEqual([])
        expect(resolved.state.agent.releaseApproved).toBe(false)
        expect(resolved.state.agent.scopeConfirmed).toBe(false)
        expect(resolved.state.agent.pinned).toBeNull()
        if (resolved.state.route !== 'SC18') continue
        onScope += 1
        const page = html(timeline, frame)
        expect(page).toContain('data-view="pending"')
        expect(count(page, '>Satisfied<')).toBe(1)
        expect(plain(page)).not.toContain('Gate satisfied')
        expect(tagOf(page, 'deploy')).toContain('aria-disabled="true"')
        expect(tagOf(page, 'approve-release')).toContain('aria-disabled="true"')
      }
      expect(onScope).toBeGreaterThan(20)
    })

    test(`${label}: SC18 shows scope, the three applications, Tier 3, six stages, the four gate rows and the provenance`, () => {
      const frame = timeline === hk ? 100 : 300
      const page = plain(html(timeline, frame))
      for (const text of ['AP East', 'Gmail', 'NetSuite', 'Google Sheets', 'Tier 3 - Consequential', '5/5 verified human examples', '28/25 representative scenarios', '6/5 edge/negative', 'Owner approval', '3 observed this week + 2 SME-verified archived cases', 'Tier 4 Restricted']) {
        expect(page).toContain(text)
      }
      const labels = ['Observe', 'Suggest', 'Guide', 'Supervised Assist', 'Scoped Autopilot', 'Self-Maintaining Autopilot']
      const positions = labels.map((stage) => page.indexOf(stage, page.indexOf('Autonomy ladder')))
      expect(positions.every((position) => position > 0)).toBe(true)
      expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    })

    test(`${label}: Stage 3 is selected in neutral ink and nothing runs, so no frame can show execution cyan`, () => {
      for (const frame of ownFrames(timeline)) {
        const resolved = at(timeline, frame)
        expect(resolved.view.orbit.running).toBe(false)
        expect(html(timeline, frame)).not.toMatch(/(?:text|bg|border|ring|stroke|fill)-arc\b/)
        if (resolved.state.route === 'SC18') expect(tagOf(html(timeline, frame), 'ladder-stage-3')).toContain('border-l-foreground')
      }
    })
  }

  test('hk-h4d-agent: Stage 3 gets the neutral selected outline from H-081, cleared for H-082, and no other stage does', () => {
    const outlined = (frame: number) => at(hk, frame).view.outlines.filter((outline) => outline.kind === 'selected').map((outline) => outline.anchor)
    expect(outlined(119)).toEqual([])
    expect(outlined(140)).toEqual(['ladder-stage-3'])
    expect(outlined(160)).toEqual([])
  })

  test('hk-h4d-agent: H-083 opens the examples provenance from the 5/5 row, and the gate behind it stays pending', () => {
    expect(at(hk, 180).state.ui.discovery.drawer).toBeNull()
    expect(at(hk, 209).state.ui.discovery.drawer).toBe('examples')
    expect(at(hk, 209).view.cursor.target).toBe('gate-examples')
    const page = plain(html(hk, 209))
    expect(page).toContain('3 observed this week + 2 SME-verified archived cases')
    expect(page).toContain('No archived case identities are shown.')
    expect(html(hk, 209)).toContain('data-view="pending"')
  })

  test('lk-l7-create: the pointer reaches Open Flight Simulator and never presses it; the simulator follows at the cut and the run starts at the press on Run Evaluation', () => {
    expect(at(lk, 470).view.cursor.target).toBe('open-simulator')
    expect(lk.events.some((event) => event.type === 'action' && event.action.type === 'OPEN_SCREEN' && event.action.screen === 'SC19')).toBe(true)
    expect(at(lk, 479).state.route).toBe('SC18')
    expect(at(lk, 480).state.route).toBe('SC19')
    expect(at(lk, 521).state.evaluations).toEqual([])
    expect(at(lk, 522).state.evaluations.map((run) => [run.versionId, run.status])).toEqual([['agent-v0.1', 'running']])
    expect(at(lk, 539).state.route).toBe('SC19')
  })
})

describe('seeking: original, reversed and direct seeks give the same frame and the sidecar agrees', () => {
  const signature = (timeline: Timeline, frame: number): string => JSON.stringify(at(timeline, frame)) + html(timeline, frame)

  for (const [label, timeline] of CLIP_LIST) {
    test(`${label}: a reverse pass and a shuffled direct pass equal the linear pass`, () => {
      const list = sampled(timeline)
      const linear = list.map((frame) => signature(timeline, frame))
      const reverse = [...list].reverse().map((frame) => signature(timeline, frame)).reverse()
      expect(reverse).toEqual(linear)
      const shuffled = list.map((_, i) => list[(i * 7) % list.length] as number)
      expect(shuffled.map((frame) => signature(timeline, frame))).toEqual(shuffled.map((frame) => linear[list.indexOf(frame)] as string))
    })

    test(`${label}: the sidecar exposes every named anchor, one sample per frame, equal to the resolved geometry`, () => {
      const sidecar = buildSidecar(timeline)
      expect(sidecar.frameCount).toBe(timeline.durationFrames)
      for (const name of ['intent', 'unverified-branch', 'continue', 'scope', 'autonomy-ladder', 'gate-examples', 'gate-owner']) {
        expect(sidecar.anchors[name]).toHaveLength(timeline.durationFrames)
      }
      for (const [name, samples] of Object.entries(sidecar.anchors)) {
        expect(samples).toHaveLength(timeline.durationFrames)
        for (const frame of [...sampled(timeline)].reverse()) {
          const resolved = at(timeline, frame).view.anchors[name]
          const sample = samples[frame]
          expect(sample?.visible).toBe(resolved?.visible)
          expect(sample?.rect === null).toBe(resolved?.rect === null)
          if (sample?.rect && resolved?.rect) expect(Math.abs(sample.rect.x - resolved.rect.x) + Math.abs(sample.rect.y - resolved.rect.y)).toBeLessThan(0.01)
        }
      }
    })

    test(`${label}: the screen hides exactly the anchors the sidecar hides (SC17 anchors on SC17, SC18 anchors on SC18)`, () => {
      const sidecar = buildSidecar(timeline)
      const scope = ['scope', 'autonomy-ladder', 'gate-examples', 'gate-owner', 'risk-tier', 'deploy']
      const factory = ['intent', 'continue']
      for (const frame of sampled(timeline)) {
        const route = at(timeline, frame).state.route
        for (const name of scope) expect(sidecar.anchors[name]?.[frame]?.visible).toBe(route === 'SC18')
        for (const name of factory) expect(sidecar.anchors[name]?.[frame]?.visible).toBe(route === 'SC17')
      }
    })
  }
})
