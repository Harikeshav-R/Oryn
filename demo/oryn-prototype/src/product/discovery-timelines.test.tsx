import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { authorClip, formatTimeline } from '../../scripts/author-product-clips'
import { CLIPS, startFrameOf } from '../../scripts/clips'
import { buildSidecar, parseTimeline, resolveFrame, validateTimeline } from '@/film'
import type { ResolvedFrame, Timeline } from '@/film'
import type { State } from '@/state'
import { ProductFilmSurface } from './FilmProduct'
import { CLIP_SPECS } from './clip-specs'
import type { ClipSpec } from './clip-specs'
import { DISCOVERY_CLIP_SPECS } from './clip-specs-discovery'
import { DISCOVERY_ANCHOR_RECTS } from './discovery-layout'

/** BOB-06 clips: hk-h4c-playbook (H-070 to H-076) and lk-l6-discover (L-059 to L-074), plus the lk-l5-observe tail (L-058). */

const FILM = path.resolve(import.meta.dir, '../../film')
const fileOf = (spec: ClipSpec): string => path.join(FILM, spec.cut, `${spec.clipId}.timeline.json`)
const specOf = (clipId: string): ClipSpec => {
  const spec = CLIP_SPECS.find((candidate) => candidate.clipId === clipId)
  if (!spec) throw new Error(`No spec for ${clipId}`)
  return spec
}
const load = (spec: ClipSpec): Timeline => parseTimeline(JSON.parse(readFileSync(fileOf(spec), 'utf8')))
const at = (timeline: Timeline, frame: number): ResolvedFrame => resolveFrame(timeline, frame)
const html = (timeline: Timeline, frame: number): string => renderToStaticMarkup(createElement(ProductFilmSurface, { resolved: at(timeline, frame) }))
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const stateAt = (timeline: Timeline, frame: number): State => at(timeline, frame).state

const H4C = specOf('hk-h4c-playbook')
const L6 = specOf('lk-l6-discover')
const L5 = specOf('lk-l5-observe')
const h4c = load(H4C)
const l6 = load(L6)
const l5 = load(L5)

const range = (first: number, last: number): number[] => Array.from({ length: last - first + 1 }, (_, i) => first + i)
const hEntries = (first: number, last: number): Set<string> => new Set(range(first, last).map((n) => `H-${String(n).padStart(3, '0')}`))
const lEntries = (first: number, last: number): Set<string> => new Set(range(first, last).map((n) => `L-${String(n).padStart(3, '0')}`))
const entriesOf = (timeline: Timeline): Set<string> => new Set(timeline.events.map((event) => event.entry ?? ''))

/** Whether the element carrying `data-film-anchor="<name>"` is shown in this markup. */
function shown(page: string, name: string): boolean {
  const tag = page.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return !/display:\s*none/.test(tag)
}

const approvedCount = (state: State): number => Object.values(state.demonstrations).filter((value) => value === 'approved').length

describe('BOB-06 timelines match the roadmap table and the storyboard entries', () => {
  for (const spec of DISCOVERY_CLIP_SPECS) {
    const timeline = load(spec)
    const clip = CLIPS.find((item) => item.clipId === spec.clipId)

    test(`${spec.clipId}: validates, has the table length and carries clip-local entries`, () => {
      expect(validateTimeline(timeline)).toEqual([])
      expect(clip?.frames).toBe(spec.durationFrames)
      expect(timeline.filmStartFrame).toBe(clip ? startFrameOf(clip) : undefined)
      expect(timeline.startAt).toBe('ST04')
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
    expect(entriesOf(h4c)).toEqual(hEntries(70, 76))
    expect(entriesOf(l6)).toEqual(lEntries(59, 74))
    expect(entriesOf(l5)).toEqual(lEntries(47, 58))
  })

  test('the clips hold no camera move, typed text or stage caption', () => {
    for (const timeline of [h4c, l6]) {
      expect(timeline.events.some((event) => event.type === 'camera' || event.type === 'type')).toBe(false)
      for (let frame = 0; frame < timeline.durationFrames; frame += 30) expect(html(timeline, frame).toLowerCase()).not.toMatch(/subtitle|caption/)
    }
  })
})

describe('seeking: original, reversed and direct seeks give the same frame and the sidecar agrees', () => {
  const frames = (timeline: Timeline): number[] => [...range(0, Math.floor((timeline.durationFrames - 1) / 10)).map((i) => i * 10), timeline.durationFrames - 1]
  const signature = (timeline: Timeline, frame: number): string => JSON.stringify(at(timeline, frame)) + html(timeline, frame)

  for (const [label, timeline] of [['hk-h4c-playbook', h4c], ['lk-l6-discover', l6]] as const) {
    test(`${label}: a reverse pass and a shuffled direct pass equal the linear pass`, () => {
      const list = frames(timeline)
      const linear = list.map((frame) => signature(timeline, frame))
      const reverse = [...list].reverse().map((frame) => signature(timeline, frame)).reverse()
      expect(reverse).toEqual(linear)
      const shuffled = list.map((_, i) => list[(i * 5) % list.length] as number)
      expect(shuffled.map((frame) => signature(timeline, frame))).toEqual(shuffled.map((frame) => linear[list.indexOf(frame)] as string))
    })

    test(`${label}: every anchor has one sidecar sample per frame, equal to the resolved geometry at sampled frames`, () => {
      const sidecar = buildSidecar(timeline)
      expect(sidecar.frameCount).toBe(timeline.durationFrames)
      for (const [name, samples] of Object.entries(sidecar.anchors)) {
        expect(samples).toHaveLength(timeline.durationFrames)
        for (const frame of [...frames(timeline)].reverse()) {
          const resolved = at(timeline, frame).view.anchors[name]
          const sample = samples[frame]
          expect(sample?.visible).toBe(resolved?.visible)
          expect(sample?.rect === null).toBe(resolved?.rect === null)
          if (sample?.rect && resolved?.rect) expect(Math.abs(sample.rect.x - resolved.rect.x) + Math.abs(sample.rect.y - resolved.rect.y)).toBeLessThan(0.01)
        }
      }
    })
  }
})

describe('hk-h4c-playbook: three demonstrations, owner review, publication', () => {
  test('H-070: the inbox lists D1, D2 and D3 with Needs Review and no numeric confidence', () => {
    const page = plain(html(h4c, 10))
    expect(stateAt(h4c, 10).route).toBe('SC13')
    for (const text of ['D1 · Priya Nair · Mon 09:14 · INV-48203 · Brightwater Industrial', 'D2 · Priya Nair · Mon 10:02 · INV-48204 · Copperline Cables', 'D3 · Jamal Carter · Tue 13:40 · INV-48207 · Harlow Tooling', 'Needs Review', '3 demonstrations']) {
      expect(page).toContain(text)
    }
    expect(page).not.toMatch(/\d\s?%|Confidence/)
    expect(shown(page, 'candidate-row')).toBe(true)
    expect(shown(page, 'demonstrations')).toBe(true)
    expect(shown(page, 'candidate-evidence')).toBe(false)
    expect(at(h4c, 18).view.cursor.target).toBe('candidate-row')
  })

  test('the contributor decisions precede the owner review: three approved, review requested, nothing published', () => {
    const state = stateAt(h4c, 0)
    expect(approvedCount(state)).toBe(3)
    expect(state.ownerReviewRequestedBy).toBe('jamal')
    expect(state.actorId).toBe('priya')
    expect(state.playbookPublished).toBe(false)
    expect(state.audit).toEqual(['A01', 'A02'])
  })

  test('H-071: one click on the row opens the candidate review (the detail, Suggested, a categorical confidence, three cards)', () => {
    expect(stateAt(h4c, 33).route).toBe('SC13')
    expect(stateAt(h4c, 34).route).toBe('SC14')
    expect(stateAt(h4c, 34).ui.discovery.candidateSelected).toBe(true)
    const page = plain(html(h4c, 45))
    for (const text of ['Match supplier invoice to purchase order and stage result in ERP', 'Suggested', 'Confidence: Medium', 'D1 · Priya Nair', 'D2 · Priya Nair', 'D3 · Jamal Carter']) expect(page).toContain(text)
    expect(shown(page, 'demo-card-d1')).toBe(true)
    expect(shown(page, 'candidate-row')).toBe(false)
  })

  test('H-072: the unverified variance exception is explicit beside the sources, and the pointer rests on a source link', () => {
    const page = plain(html(h4c, 80))
    expect(page).toContain('Variance exception rule: unverified until SME review')
    expect(shown(page, 'evidence-link-d1')).toBe(true)
    expect(at(h4c, 80).view.cursor.target).toBe('evidence-link-d1')
    expect(stateAt(h4c, 80).ui.discovery.drawer).toBeNull()
  })

  test('H-073: Marcus Webb is chosen at the canonical sidebar selector, with the candidate intact', () => {
    const { anchors } = at(h4c, 95).view
    expect(anchors['role-selector']?.rect).toMatchObject({ x: 24, y: 24, width: 192, height: 64 })
    expect(Object.keys(h4c.anchors).filter((name) => name.includes('role'))).toEqual(['role-selector', 'role-option-marcus'])
    expect(stateAt(h4c, 103).ui.overlay).toBeNull()
    expect(stateAt(h4c, 104).ui.overlay).toBe('role')
    expect(stateAt(h4c, 110).actorId).toBe('priya')
    expect(shown(html(h4c, 110), 'role-option-marcus')).toBe(true)
    const after = stateAt(h4c, 118)
    expect(after.actorId).toBe('marcus')
    expect(after.ui.overlay).toBeNull()
    expect(after.route).toBe('SC14')
    const page = plain(html(h4c, 118))
    expect(page).toContain('Marcus Webb · Workflow Owner')
    expect(page).toContain('Calder & Vance')
    expect(page).toContain('D3 · Jamal Carter')
    // A viewpoint change grants nothing: the same business state before and after.
    expect(approvedCount(after)).toBe(3)
    expect(after.ownerReviewRequestedBy).toBe('jamal')
    expect(after.playbookPublished).toBe(false)
  })

  test('H-074: the rule evidence opens AP-RULE-009 in the drawer with the exact threshold', () => {
    expect(stateAt(h4c, 134).ui.discovery.drawer).toBeNull()
    expect(stateAt(h4c, 135).ui.discovery.drawer).toBe('AP-RULE-009')
    const page = plain(html(h4c, 145))
    expect(shown(page, 'rule-drawer')).toBe(true)
    expect(shown(page, 'drawer-close')).toBe(true)
    expect(page).toContain('variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept')
    expect(stateAt(h4c, 145).playbookPublished).toBe(false)
  })

  test('H-075: the playbook is a draft until the owner presses Publish; Approved for Guidance appears only after it', () => {
    const before = stateAt(h4c, 160)
    expect(before.route).toBe('SC15')
    expect(before.phase).toBe('ST04')
    expect(before.ui.discovery.drawer).toBeNull()
    expect(plain(html(h4c, 160))).toContain('Draft · Review requested')
    expect(plain(html(h4c, 160))).not.toContain('Approved for Guidance')
    expect(at(h4c, 170).view.cursor.target).toBe('publish')
    expect(stateAt(h4c, 165).playbookPublished).toBe(false)
    const after = stateAt(h4c, 166)
    expect(after.playbookPublished).toBe(true)
    expect(after.phase).toBe('ST05')
    expect(after.actorId).toBe('marcus')
    expect(after.audit).toEqual(['A01', 'A02', 'A03'])
    expect(after.agent.versions).toEqual([])
    const page = plain(html(h4c, 175))
    for (const text of ['Supplier invoice vs purchase order reconciliation · v1.0', 'Approved for Guidance', 'Owner: Marcus Webb']) expect(page).toContain(text)
  })

  test('H-076: Steps, Decisions, Exceptions and Evidence are all shown and the pointer rests on Evidence', () => {
    const page = plain(html(h4c, 200))
    for (const name of ['playbook-steps', 'playbook-decisions', 'playbook-exceptions', 'playbook-evidence']) expect(shown(page, name)).toBe(true)
    for (const text of ['Steps', 'Decisions', 'Exceptions', 'Evidence']) expect(page).toContain(text)
    expect(at(h4c, 209).view.cursor.target).toBe('playbook-evidence')
  })
})

describe('lk-l6-discover: evidence, publication for guidance, candidate and playbook again', () => {
  test('L-059 to L-061: D1, D2 and D3 are selected in turn, each with its own contributor and time', () => {
    expect(stateAt(l6, 10).ui.discovery.demonstration).toBeNull()
    expect(stateAt(l6, 20).ui.discovery.demonstration).toBe('D1')
    expect(stateAt(l6, 45).ui.discovery.demonstration).toBe('D2')
    expect(stateAt(l6, 80).ui.discovery.demonstration).toBe('D3')
    const page = plain(html(l6, 80))
    for (const text of ['D1 · Priya Nair', 'Mon 09:14', 'INV-48203', 'D2 · Priya Nair', 'Mon 10:02', 'INV-48204', 'D3 · Jamal Carter', 'Tue 13:40', 'INV-48207']) expect(page).toContain(text)
    expect(stateAt(l6, 0).route).toBe('SC14')
    expect(stateAt(l6, 0).actorId).toBe('marcus')
    expect(at(l6, 45).view.cursor.visible).toBe(false)
  })

  test('L-062: the playbook preview is owned by Marcus Webb; Publish for Guidance is a separate press that lands at +500 ms', () => {
    const preview = stateAt(l6, 95)
    expect(preview.route).toBe('SC15')
    expect(preview.playbookPublished).toBe(false)
    const page = plain(html(l6, 100))
    for (const text of ['Supplier invoice vs purchase order reconciliation', 'Owner: Marcus Webb', 'Publish for Guidance', 'Publish']) expect(page).toContain(text)
    expect(page).not.toContain('Approved for Guidance')
    expect(stateAt(l6, 104).playbookPublished).toBe(false)
    expect(stateAt(l6, 105).playbookPublished).toBe(true)
    expect(stateAt(l6, 105).agent.versions).toEqual([])
    expect(at(l6, 105).view.cursor.target).toBe('publish')
  })

  test('L-063 to L-072: the published guidance is held, with no pointer and no agent', () => {
    for (const frame of [130, 250, 419]) {
      const state = stateAt(l6, frame)
      expect(state.route).toBe('SC15')
      expect(state.phase).toBe('ST05')
      expect(state.agent.versions).toEqual([])
      expect(at(l6, frame).view.cursor.visible).toBe(false)
      expect(plain(html(l6, frame))).toContain('Approved for Guidance')
    }
  })

  test('L-073: the candidate again, Confidence: Medium with the exception still unverified, all three sources visible', () => {
    const state = stateAt(l6, 435)
    expect(state.route).toBe('SC14')
    const page = plain(html(l6, 435))
    for (const text of ['Match supplier invoice to purchase order and stage result in ERP', 'Confidence: Medium', 'Variance exception rule: unverified until SME review', 'D1 · Priya Nair', 'D2 · Priya Nair', 'D3 · Jamal Carter']) expect(page).toContain(text)
    expect(page).not.toMatch(/Confidence:\s*\d/)
    expect(at(l6, 445).view.cursor.target).toBe('demo-card-d1')
  })

  test('L-074: the published playbook states AP-RULE-009 at the exact 2.00% boundary and the pointer points at the rule', () => {
    const page = plain(html(l6, 470))
    for (const text of ['Approved for Guidance', 'AP-RULE-009 Variance threshold', '> 2.00%: Tier 3 approval', '≤ 2.00%: auto-accept within match']) expect(page).toContain(text)
    expect(at(l6, 470).view.cursor.target).toBe('rule-009')
    expect(stateAt(l6, 470).route).toBe('SC15')
  })
})

describe('lk-l5-observe: L-058 shows SC13 Needs Review at the tail of the observed demonstration', () => {
  test('the pointer enters from (1100, 420) and reaches the candidate row in 700 ms; the row reads Needs Review and Observed', () => {
    expect(stateAt(l5, 329).route).toBe('SC06')
    expect(stateAt(l5, 330).route).toBe('SC13')
    expect(at(l5, 330).view.cursor).toMatchObject({ visible: true, x: 1100, y: 420 })
    expect(at(l5, 331 + 21).view.cursor.target).toBe('candidate-row')
    const page = plain(html(l5, 340))
    for (const text of ['Workflow Discovery', 'Supplier invoice vs purchase order reconciliation', '3 demonstrations', 'Needs Review']) expect(page).toContain(text)
    expect(page.match(/Observed/g)).toHaveLength(3)
    expect(shown(page, 'candidate-row')).toBe(true)
    expect(shown(page, 'demonstrations')).toBe(true)
    const rect = at(l5, 359).view.anchors['candidate-row']?.rect
    expect(rect).toMatchObject({ x: DISCOVERY_ANCHOR_RECTS['candidate-row'].x, y: DISCOVERY_ANCHOR_RECTS['candidate-row'].y })
  })

  test('the clip keeps its 360 frames, and sharing stays off: nothing is approved, requested or published', () => {
    expect(l5.durationFrames).toBe(360)
    const state = stateAt(l5, 359)
    expect(state.phase).toBe('ST04')
    expect(approvedCount(state)).toBe(0)
    expect(state.ownerReviewRequestedBy).toBeNull()
    expect(state.playbookPublished).toBe(false)
    expect(state.consent.priya.contribution).toBe(false)
  })
})

describe('pending versus published, and no fabricated authority', () => {
  test.each([['hk-h4c-playbook', h4c], ['lk-l6-discover', l6]] as const)('%s: Approved for Guidance appears only after the owner publishes, and no cyan appears', (_label, timeline) => {
    for (let frame = 0; frame < timeline.durationFrames; frame += 5) {
      const state = stateAt(timeline, frame)
      const page = html(timeline, frame)
      expect(plain(page).includes('Approved for Guidance')).toBe(state.playbookPublished && state.route !== 'SC14' && (state.route === 'SC15' || state.route === 'SC13'))
      expect(page).not.toMatch(/2fd8ff|--arc|text-trace|bg-trace/i)
      if (state.playbookPublished) {
        expect(state.actorId).toBe('marcus')
        expect(state.ownerReviewRequestedBy).not.toBeNull()
        expect(approvedCount(state)).toBe(3)
      }
    }
  })

  test.each([['hk-h4c-playbook', h4c], ['lk-l6-discover', l6]] as const)('%s: publication is an applied action by the owner, once, and no agent exists afterwards', (_label, timeline) => {
    const last = at(timeline, timeline.durationFrames - 1)
    const publishes = last.applied.filter((entry) => entry.action.type === 'PUBLISH')
    expect(publishes).toHaveLength(1)
    expect(last.rejections).toEqual([])
    expect(last.state.agent.versions).toEqual([])
    expect(last.state.agent.releaseApproved).toBe(false)
  })
})
