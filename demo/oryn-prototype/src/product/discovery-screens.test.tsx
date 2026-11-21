import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PLAYBOOK_EXCEPTIONS, PLAYBOOK_STEPS } from '@/data/playbook'
import type { Rect } from '@/film'
import { reconstruct } from '@/state'
import type { Action, State } from '@/state'
import { act as run } from '@/state/test-helpers'
import { CandidateReviewScreen } from './CandidateReviewScreen'
import { CANDIDATE_ANCHOR_RECTS, EVIDENCE_RAIL } from './candidate-layout'
import type { FilmContext, ProductProps } from './contract'
import { DiscoveryScreen } from './DiscoveryScreen'
import { DISCOVERY_ANCHOR_RECTS } from './discovery-layout'
import { EvidenceDrawer } from './EvidenceDrawer'
import { nextFocusIndex } from './focus-trap'
import { PlaybookScreen } from './PlaybookScreen'
import { PLAYBOOK_ANCHOR_RECTS } from './playbook-layout'

/** SC13 Workflow Discovery, SC14 candidate review and the evidence drawer, SC15 playbook. */

type Props = Record<string, unknown>
type Screen = (props: ProductProps) => ReactNode

const html = (Screen: Screen, state: State, film?: FilmContext): string => renderToStaticMarkup(<Screen state={state} film={film} />)
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')

const openingTag = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}
const hidden = (markup: string, name: string): boolean => openingTag(markup, name).includes('display:none')
const disabled = (markup: string, name: string): boolean => openingTag(markup, name).includes('aria-disabled="true"')
const pressed = (markup: string, name: string): boolean => openingTag(markup, name).includes('aria-pressed="true"')

const filmAt = (frame: number, applied: Partial<Record<Action['type'], number>> = {}): FilmContext => ({ frame, reducedMotion: false, lastApplied: (type) => applied[type] ?? null })

/** The left/top/width/height an anchor is placed at, plus the origin of the box it is nested in. */
function placed(markup: string, name: string, origin: Rect = { x: 0, y: 0, width: 0, height: 0 }): Rect {
  const style = openingTag(markup, name).match(/left:(\d+)(?:px)?;top:(\d+)(?:px)?;width:(\d+)px;height:(\d+)px/)
  if (!style) throw new Error(`No placement for ${name}`)
  const [left, top, width, height] = style.slice(1).map(Number) as [number, number, number, number]
  return { x: origin.x + left, y: origin.y + top, width, height }
}

/** Anchored elements of a screen, without rendering the drawer (it uses hooks, which only a renderer may run). */
function anchoredElements(node: ReactNode, out: ReactElement<Props>[] = []): ReactElement<Props>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => anchoredElements(child as ReactNode, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  if (node.props['data-film-anchor'] !== undefined) out.push(node)
  if (node.type === EvidenceDrawer) return out
  if (typeof node.type === 'function') return anchoredElements((node.type as (props: Props) => ReactNode)(node.props), out)
  return anchoredElements(node.props.children as ReactNode, out)
}

/** Fire one handler of an anchored element and return every action it dispatched. */
function fire(Screen: Screen, state: State, name: string, handler = 'onClick'): Action[] {
  const dispatched: Action[] = []
  const element = anchoredElements(<Screen state={state} dispatch={(action) => dispatched.push(action)} />).find((candidate) => candidate.props['data-film-anchor'] === name)
  if (!element) throw new Error(`No element for anchor ${name}`)
  ;(element.props[handler] as ((event: Props) => void) | undefined)?.({ preventDefault: () => undefined })
  return dispatched
}

const confirmed = reconstruct('ST04')
const asPriya = confirmed
const asMarcus = run(confirmed, { type: 'SELECT_ACTOR', personId: 'marcus' })
const approveAll: readonly Action[] = [
  { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' },
  { type: 'APPROVE_DEMONSTRATION', demoId: 'D2' },
  { type: 'SELECT_ACTOR', personId: 'jamal' },
  { type: 'ACKNOWLEDGE_NOTICE' },
  { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true },
  { type: 'SET_CONTRIBUTION', enabled: true },
  { type: 'APPROVE_DEMONSTRATION', demoId: 'D3' },
]
const approved = run(confirmed, ...approveAll)
const requested = run(approved, { type: 'REQUEST_OWNER_REVIEW' })
const readyOwner = run(requested, { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'OPEN_SCREEN', screen: 'SC15' })
const published = run(readyOwner, { type: 'PUBLISH' })
const review = (state: State): State => run(state, { type: 'OPEN_SCREEN', screen: 'SC14' })

const ROWS = [
  'D1 · Priya Nair · Mon 09:14 · INV-48203 · Brightwater Industrial',
  'D2 · Priya Nair · Mon 10:02 · INV-48204 · Copperline Cables',
  'D3 · Jamal Carter · Tue 13:40 · INV-48207 · Harlow Tooling',
]

describe('SC13 exact content', () => {
  const page = plain(html(DiscoveryScreen, asPriya))

  test('shows the heading, the candidate, three demonstrations and Needs Review', () => {
    for (const text of ['Workflow Discovery', 'Supplier invoice vs purchase order reconciliation', '3 demonstrations', 'Needs Review']) expect(page).toContain(text)
    expect(page).not.toContain('Approved for Guidance')
  })

  test('every demonstration row matches the fixture exactly, in order', () => {
    const positions = ROWS.map((row) => page.indexOf(row))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  test('three demonstrations are not verified examples: no numeric confidence, no policy claim', () => {
    expect(page).not.toMatch(/\d\s?%|confidence|\b5\b/i)
    expect(page).toContain('not verified examples')
    expect(page).toContain('do not set policy')
  })

  test('a row reads Observed until its contributor approves it, then Contribution approved', () => {
    expect(page.match(/Observed/g)).toHaveLength(3)
    expect(plain(html(DiscoveryScreen, approved)).match(/Contribution approved/g)).toHaveLength(3)
    const partly = run(confirmed, { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' })
    expect(plain(html(DiscoveryScreen, partly)).match(/Contribution approved/g)).toHaveLength(1)
  })
})

describe('SC13 states', () => {
  test('selecting the candidate row highlights it and opens the review', () => {
    expect(pressed(html(DiscoveryScreen, asPriya), 'candidate-row')).toBe(false)
    expect(pressed(html(DiscoveryScreen, run(asPriya, { type: 'SELECT_CANDIDATE' })), 'candidate-row')).toBe(true)
    expect(fire(DiscoveryScreen, asPriya, 'candidate-row')).toEqual([{ type: 'SELECT_CANDIDATE' }, { type: 'OPEN_SCREEN', screen: 'SC14' }])
  })

  test('a demonstration row selects its demonstration', () => {
    expect(fire(DiscoveryScreen, asPriya, 'demo-row-d2')).toEqual([{ type: 'SELECT_DEMONSTRATION', demoId: 'D2' }])
    expect(pressed(html(DiscoveryScreen, run(asPriya, { type: 'SELECT_DEMONSTRATION', demoId: 'D3' })), 'demo-row-d3')).toBe(true)
  })

  test('an empty filter shows `No candidates yet`, hides the candidate and offers the next action', () => {
    const empty = run(asPriya, { type: 'SET_DISCOVERY_FILTER', filter: 'published' })
    const page = html(DiscoveryScreen, empty)
    expect(plain(page)).toContain('No candidates yet')
    for (const name of ['candidate-row', 'demonstrations', 'demo-row-d1', 'demo-row-d2', 'demo-row-d3']) expect(hidden(page, name)).toBe(true)
    expect(hidden(page, 'empty-state')).toBe(false)
    expect(plain(page)).toContain('Show all candidates')
    expect(fire(DiscoveryScreen, empty, 'empty-action')).toEqual([{ type: 'SET_DISCOVERY_FILTER', filter: 'all' }])
  })

  test('after publication the candidate reads Approved for Guidance, and the Needs Review filter is the empty one', () => {
    expect(plain(html(DiscoveryScreen, published))).toContain('Approved for Guidance')
    expect(plain(html(DiscoveryScreen, run(published, { type: 'SET_DISCOVERY_FILTER', filter: 'needs-review' })))).toContain('No candidates yet')
    expect(plain(html(DiscoveryScreen, run(asPriya, { type: 'SET_DISCOVERY_FILTER', filter: 'needs-review' })))).toContain('Needs Review')
  })

  test('a viewpoint without access sees the reason and none of the evidence', () => {
    const denied = html(DiscoveryScreen, run(asPriya, { type: 'SELECT_ACTOR', personId: 'daniel' }))
    expect(plain(denied)).toContain('Not available')
    for (const text of ['INV-48203', 'Priya Nair', 'Brightwater']) expect(denied).not.toContain(text)
    for (const name of ['candidate-row', 'demonstrations', 'discovery-filters', 'filter-all']) expect(hidden(denied, name)).toBe(true)
  })

  test('geometry: the row sits at y176-224, the rows are 32 px, and a status never moves one', () => {
    for (const state of [asPriya, approved, published, run(asPriya, { type: 'SELECT_CANDIDATE' })]) {
      const page = html(DiscoveryScreen, state)
      for (const name of ['candidate-row', 'demonstrations', 'demo-row-d1', 'demo-row-d2', 'demo-row-d3', 'discovery-filters', 'filter-all', 'filter-needs-review', 'filter-published'] as const) {
        expect(placed(page, name)).toEqual(DISCOVERY_ANCHOR_RECTS[name])
      }
    }
    expect(DISCOVERY_ANCHOR_RECTS['candidate-row']).toMatchObject({ y: 176, height: 48 })
  })
})

describe('SC14 exact content', () => {
  const page = plain(html(CandidateReviewScreen, review(requested)))

  test('shows the candidate, its category and the unverified exception beside the sources', () => {
    for (const text of ['Match supplier invoice to purchase order and stage result in ERP', 'Suggested', 'Confidence: Medium', 'Variance exception rule: unverified until SME review', 'Evidence', 'AP-RULE-009', 'Approve contribution', 'Request owner review']) {
      expect(page).toContain(text)
    }
    expect(page).toContain('variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept')
  })

  test('all three provenance records are visible: contributor, time, invoice, supplier', () => {
    for (const text of ['D1 · Priya Nair', 'Mon 09:14', 'INV-48203', 'Brightwater Industrial', 'D2 · Priya Nair', 'Mon 10:02', 'INV-48204', 'Copperline Cables', 'D3 · Jamal Carter', 'Tue 13:40', 'INV-48207', 'Harlow Tooling']) {
      expect(page).toContain(text)
    }
  })

  test('confidence is a category, never a number', () => {
    expect(page).not.toMatch(/Confidence:\s*\d/)
    expect(page.replace('variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept', '').replaceAll('2.00%', '')).not.toMatch(/\d\s?%/)
  })

  test('the six proposed steps follow the playbook fixture', () => {
    for (const step of PLAYBOOK_STEPS) expect(page).toContain(step.title)
  })

  test('the three source cards carry their own contribution decision', () => {
    expect(plain(html(CandidateReviewScreen, review(confirmed))).match(/Awaiting contributor approval/g)).toHaveLength(3)
    expect(page.match(/Contribution approved/g)).toHaveLength(3)
    const partly = plain(html(CandidateReviewScreen, review(run(confirmed, { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' }))))
    expect(partly.match(/Contribution approved/g)).toHaveLength(1)
    expect(partly.match(/Awaiting contributor approval/g)).toHaveLength(2)
  })
})

describe('SC14 states: suggested, evidence, contributor approval, owner review', () => {
  test('suggested: nothing is approved, owner review is not requested and cannot be', () => {
    const page = html(CandidateReviewScreen, review(asPriya))
    expect(plain(page)).toContain('Owner review: Not requested')
    expect(disabled(page, 'request-review')).toBe(true)
    expect(plain(page)).toContain('Contributor review is incomplete: D1, D2, D3')
    expect(disabled(page, 'approve-contribution')).toBe(false)
  })

  test('a contributor approves only their own Demonstrations, each through its own action', () => {
    expect(fire(CandidateReviewScreen, review(asPriya), 'approve-contribution')).toEqual([
      { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' },
      { type: 'APPROVE_DEMONSTRATION', demoId: 'D2' },
    ])
    const jamal = run(asPriya, { type: 'SELECT_ACTOR', personId: 'jamal' }, { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }, { type: 'SET_CONTRIBUTION', enabled: true })
    expect(fire(CandidateReviewScreen, review(jamal), 'approve-contribution')).toEqual([{ type: 'APPROVE_DEMONSTRATION', demoId: 'D3' }])
  })

  test('the owner and other viewpoints cannot approve a contribution, with the reason', () => {
    const page = html(CandidateReviewScreen, review(asMarcus))
    expect(disabled(page, 'approve-contribution')).toBe(true)
    expect(plain(page)).toContain('Only a contributor approves their own contribution. Current person is Marcus Webb.')
  })

  test('contributor approval is not owner review: requesting is a separate action and publishes nothing', () => {
    const page = html(CandidateReviewScreen, review(approved))
    expect(disabled(page, 'request-review')).toBe(false)
    expect(plain(page)).toContain('Owner review: Not requested')
    expect(fire(CandidateReviewScreen, review(approved), 'request-review')).toEqual([{ type: 'REQUEST_OWNER_REVIEW' }])
    expect(approved.playbookPublished).toBe(false)
  })

  test('owner review requested: it names the contributor, cannot be repeated, and still does not publish', () => {
    const page = html(CandidateReviewScreen, review(requested))
    expect(plain(page)).toContain('Owner review: Requested by Jamal Carter')
    expect(disabled(page, 'request-review')).toBe(true)
    expect(requested.playbookPublished).toBe(false)
    expect(requested.phase).toBe('ST04')
  })

  test('evidence: a source link selects its Demonstration and opens the drawer; the rule link opens AP-RULE-009', () => {
    expect(fire(CandidateReviewScreen, review(requested), 'evidence-link-d2')).toEqual([{ type: 'SELECT_DEMONSTRATION', demoId: 'D2' }, { type: 'OPEN_DRAWER', drawer: 'evidence' }])
    expect(fire(CandidateReviewScreen, review(requested), 'rule-link')).toEqual([{ type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }])
    expect(fire(CandidateReviewScreen, review(requested), 'demo-card-d3')).toEqual([{ type: 'SELECT_DEMONSTRATION', demoId: 'D3' }])
    const unselected = html(CandidateReviewScreen, review(requested))
    const selected = html(CandidateReviewScreen, run(review(requested), { type: 'SELECT_DEMONSTRATION', demoId: 'D3' }))
    expect(pressed(unselected, 'demo-card-d3')).toBe(false)
    expect(pressed(selected, 'demo-card-d3')).toBe(true)
    expect(pressed(selected, 'demo-card-d1')).toBe(false)
  })

  test('a viewpoint without access sees only the reason', () => {
    const page = html(CandidateReviewScreen, run(review(requested), { type: 'SELECT_ACTOR', personId: 'tomas' }))
    expect(plain(page)).toContain('Not available')
    for (const text of ['INV-48203', 'AP-RULE-009', 'Brightwater']) expect(page).not.toContain(text)
    expect(hidden(page, 'candidate-evidence')).toBe(true)
  })

  test('geometry: the evidence rail is [880,112,352,480] and no state moves an anchor', () => {
    expect(EVIDENCE_RAIL).toEqual({ x: 880, y: 112, width: 352, height: 480 })
    for (const state of [review(asPriya), review(requested), review(asMarcus), review(published)]) {
      const page = html(CandidateReviewScreen, state)
      for (const name of ['candidate-evidence', 'demonstration-cards', 'demo-card-d1', 'demo-card-d2', 'demo-card-d3', 'proposed-steps', 'approve-contribution', 'request-review', 'candidate-title', 'candidate-confidence', 'candidate-uncertainty', 'owner-review-status'] as const) {
        expect(placed(page, name)).toEqual(CANDIDATE_ANCHOR_RECTS[name])
      }
      for (const name of ['evidence-link-d1', 'evidence-link-d2', 'evidence-link-d3', 'rule-link'] as const) {
        expect(placed(page, name, EVIDENCE_RAIL)).toEqual(CANDIDATE_ANCHOR_RECTS[name])
      }
    }
  })
})

describe('the evidence drawer', () => {
  const closed = html(CandidateReviewScreen, review(requested))
  const rule = html(CandidateReviewScreen, run(review(requested), { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }))
  const source = html(CandidateReviewScreen, run(review(requested), { type: 'SELECT_DEMONSTRATION', demoId: 'D1' }, { type: 'OPEN_DRAWER', drawer: 'evidence' }))

  test('closed, its anchors exist and are hidden', () => {
    expect(hidden(closed, 'rule-drawer')).toBe(true)
    expect(hidden(closed, 'drawer-close')).toBe(true)
    expect(closed).toContain('aria-hidden="true"')
  })

  test('the AP-RULE-009 drawer states the exact threshold, the owner and the unverified exception', () => {
    expect(hidden(rule, 'rule-drawer')).toBe(false)
    const text = plain(rule)
    for (const part of ['AP-RULE-009', 'Variance threshold', 'Owner: Daniel Okafor', 'variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept', 'Exactly 2.00% auto-accepts', 'Variance exception rule: unverified until SME review', 'Close']) {
      expect(text).toContain(part)
    }
  })

  test('it is a modal dialog with a labelled title, so assistive tech and the focus trap treat it as one layer', () => {
    const tag = openingTag(rule, 'rule-drawer')
    expect(tag).toContain('role="dialog"')
    expect(tag).toContain('aria-modal="true"')
    expect(tag).toContain('aria-labelledby="drawer-title"')
  })

  test('the evidence drawer shows the sanitized source of the selected Demonstration and nothing raw', () => {
    const text = plain(source.slice(source.indexOf('data-layer="evidence-drawer"')))
    for (const part of ['D1 evidence', 'Priya Nair', 'Mon 09:14', 'INV-48203', 'Brightwater Industrial', 'authorized sanitized derivative', 'Opening this does not approve, publish or verify anything.']) {
      expect(text).toContain(part)
    }
    expect(text).not.toContain('INV-48204')
  })

  test('geometry: the drawer is [800,0,480,720] and its Close button is in the 64 px footer', () => {
    expect(placed(rule, 'rule-drawer')).toEqual({ x: 800, y: 0, width: 480, height: 720 })
    expect(CANDIDATE_ANCHOR_RECTS['drawer-close']).toEqual({ x: 1160, y: 668, width: 96, height: 40 })
  })

  test('in a film the 150 ms entry is an opacity ramp that never moves the drawer', () => {
    const state = run(review(requested), { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })
    const start = html(CandidateReviewScreen, state, filmAt(100, { OPEN_DRAWER: 100 }))
    const end = html(CandidateReviewScreen, state, filmAt(110, { OPEN_DRAWER: 100 }))
    expect(start).toContain('opacity:0')
    expect(end).not.toContain('opacity:0;')
    expect(placed(start, 'rule-drawer')).toEqual(placed(end, 'rule-drawer'))
  })

  test('Tab order cycles inside the layer and re-enters at the edge from outside', () => {
    expect(nextFocusIndex(3, 2, false)).toBe(0)
    expect(nextFocusIndex(3, 0, true)).toBe(2)
    expect(nextFocusIndex(3, 1, false)).toBe(2)
    expect(nextFocusIndex(1, 0, false)).toBe(0)
    expect(nextFocusIndex(1, 0, true)).toBe(0)
    expect(nextFocusIndex(3, -1, false)).toBe(0)
    expect(nextFocusIndex(3, -1, true)).toBe(2)
    expect(nextFocusIndex(0, -1, false)).toBe(-1)
  })
})

describe('SC15 exact content', () => {
  const page = plain(html(PlaybookScreen, published))

  test('shows title, version, owner, the badge and the four sections', () => {
    for (const text of ['Supplier invoice vs purchase order reconciliation · v1.0', 'Owner: Marcus Webb', 'Approved for Guidance', 'Steps', 'Decisions', 'Exceptions', 'Evidence', 'Publish for Guidance', 'Agent Factory']) {
      expect(page).toContain(text)
    }
  })

  test('all six steps and five exceptions appear, in order', () => {
    const steps = PLAYBOOK_STEPS.map((step) => page.indexOf(step.title))
    expect(steps.every((position) => position >= 0)).toBe(true)
    expect([...steps].sort((a, b) => a - b)).toEqual(steps)
    expect(PLAYBOOK_STEPS).toHaveLength(6)
    for (const item of PLAYBOOK_EXCEPTIONS) expect(page).toContain(item)
  })

  test('both rule links are present and AP-RULE-009 states the exact boundary: equality auto-accepts', () => {
    for (const text of ['AP-RULE-009 Variance threshold', 'AP-RULE-017 Supplier handling fees', '> 2.00%: Tier 3 approval', '≤ 2.00%: auto-accept within match', 'Owner: Daniel Okafor']) expect(page).toContain(text)
    expect(fire(PlaybookScreen, published, 'rule-009')).toEqual([{ type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }])
    expect(fire(PlaybookScreen, published, 'rule-017')).toEqual([{ type: 'OPEN_DRAWER', drawer: 'AP-RULE-017' }])
  })

  test('the linked demonstrations open their sanitized evidence', () => {
    expect(fire(PlaybookScreen, published, 'demo-link-d3')).toEqual([{ type: 'SELECT_DEMONSTRATION', demoId: 'D3' }, { type: 'OPEN_DRAWER', drawer: 'evidence' }])
    for (const text of ['D1 · Priya Nair · Mon 09:14', 'D2 · Priya Nair · Mon 10:02', 'D3 · Jamal Carter · Tue 13:40']) expect(page).toContain(text)
  })
})

describe('SC15 draft and approved', () => {
  test('before review is requested: draft label, Publish disabled with the reason, no Approved for Guidance anywhere', () => {
    const state = run(approved, { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'OPEN_SCREEN', screen: 'SC15' })
    const page = html(PlaybookScreen, state)
    expect(plain(page)).toContain('Draft · Review pending')
    expect(plain(page)).toContain('Owner review has not been requested.')
    expect(disabled(page, 'publish')).toBe(true)
    expect(plain(page)).not.toContain('Approved for Guidance')
  })

  test('review requested: the owner can publish, and the click is only a PUBLISH action', () => {
    const page = html(PlaybookScreen, readyOwner)
    expect(plain(page)).toContain('Draft · Review requested')
    expect(plain(page)).toContain('Owner review requested by Jamal Carter.')
    expect(disabled(page, 'publish')).toBe(false)
    expect(fire(PlaybookScreen, readyOwner, 'publish')).toEqual([{ type: 'PUBLISH' }])
    expect(plain(page)).not.toContain('Approved for Guidance')
  })

  test('published: the badge is neutral and only after publication, Publish is spent, and nothing implies an agent', () => {
    const page = html(PlaybookScreen, published)
    const badge = page.slice(page.indexOf('data-view="approved"'))
    expect(plain(page)).toContain('Approved for Guidance')
    expect(badge).toContain('text-signal')
    expect(page).not.toMatch(/text-success|text-trace|bg-trace|--arc/)
    expect(plain(page)).toContain('Published for guidance. This does not create, release or authorize an agent.')
    expect(disabled(page, 'publish')).toBe(true)
    expect(published.agent.versions).toEqual([])
    expect(published.phase).toBe('ST05')
  })

  test('Agent Factory stays unavailable until the guidance is published, then only opens the Agent Factory', () => {
    expect(disabled(html(PlaybookScreen, readyOwner), 'agent-factory')).toBe(true)
    expect(disabled(html(PlaybookScreen, published), 'agent-factory')).toBe(false)
    expect(fire(PlaybookScreen, published, 'agent-factory')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC17' }])
    expect(run(published, { type: 'OPEN_SCREEN', screen: 'SC17' }).agent.versions).toEqual([])
  })

  test('the badge enters over 150 ms from the publication, and never before it', () => {
    const start = html(PlaybookScreen, published, filmAt(200, { PUBLISH: 200 }))
    const done = html(PlaybookScreen, published, filmAt(210, { PUBLISH: 200 }))
    expect(start).toContain('opacity:0')
    expect(done).not.toContain('opacity:0')
  })

  test('another viewpoint sees the reason, not the playbook', () => {
    const page = html(PlaybookScreen, run(published, { type: 'SELECT_ACTOR', personId: 'priya' }))
    expect(plain(page)).toContain('Playbooks are managed by the Workflow Owner, Marcus Webb.')
    expect(page).not.toContain('AP-STEP-01')
    expect(hidden(page, 'playbook')).toBe(true)
    expect(hidden(page, 'publish')).toBe(true)
  })

  test('geometry: the procedure column and the rail never move, draft or approved', () => {
    for (const state of [readyOwner, published]) {
      const page = html(PlaybookScreen, state)
      for (const name of ['playbook', 'playbook-title', 'playbook-owner', 'playbook-status', 'playbook-steps', 'playbook-decisions', 'playbook-exceptions', 'playbook-evidence'] as const) {
        expect(placed(page, name)).toEqual(PLAYBOOK_ANCHOR_RECTS[name])
      }
      expect(placed(page, 'publish', { x: 896, y: 556, width: 0, height: 0 })).toEqual(PLAYBOOK_ANCHOR_RECTS['publish'])
      expect(placed(page, 'agent-factory', { x: 896, y: 556, width: 0, height: 0 })).toEqual(PLAYBOOK_ANCHOR_RECTS['agent-factory'])
    }
  })
})
