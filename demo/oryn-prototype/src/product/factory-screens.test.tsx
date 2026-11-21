import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AGENT_SECTIONS } from '@/data/agent-draft'
import { GATE_PROVENANCE } from '@/data/gate'
import { AGENT_DEFINITION } from '@/data/versions'
import type { TypedView } from '@/film'
import { reconstruct, transition } from '@/state'
import type { Action, State } from '@/state'
import { act as run, expectRejected } from '@/state/test-helpers'
import type { FilmContext, ProductProps } from './contract'
import { EvidenceDrawer } from './EvidenceDrawer'
import { FactoryScreen } from './FactoryScreen'
import { FACTORY_ANCHOR_RECTS } from './factory-layout'
import { ScopeScreen } from './ScopeScreen'
import { SCOPE_ANCHOR_RECTS } from './scope-layout'

/** SC17 Agent Factory and SC18 scope, risk, autonomy and release gate. */

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
const opacityOf = (markup: string, name: string): number => Number(openingTag(markup, name).match(/opacity:([\d.]+)/)?.[1] ?? 1)
const count = (markup: string, needle: string): number => markup.split(needle).length - 1

const filmAt = (frame: number, applied: Partial<Record<Action['type'], number>> = {}, texts?: Readonly<Record<string, TypedView>>): FilmContext => ({
  frame,
  reducedMotion: false,
  lastApplied: (type) => applied[type] ?? null,
  texts,
})

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
function fire(Screen: Screen, state: State, name: string, handler = 'onClick', event: Props = {}): Action[] {
  const dispatched: Action[] = []
  const element = anchoredElements(<Screen state={state} dispatch={(action) => dispatched.push(action)} />).find((candidate) => candidate.props['data-film-anchor'] === name)
  if (!element) throw new Error(`No element for anchor ${name}`)
  ;(element.props[handler] as ((event: Props) => void) | undefined)?.({ preventDefault: () => undefined, ...event })
  return dispatched
}

const INTENT = AGENT_DEFINITION.intent
const atFactory = run(reconstruct('ST05'), { type: 'OPEN_SCREEN', screen: 'SC17' })
const typedIntent = run(atFactory, { type: 'SET_INTENT', text: INTENT })
const drafted = run(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC17' })
const pending = run(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC18' })
const evaluated = run(reconstruct('ST09'), { type: 'OPEN_SCREEN', screen: 'SC18' })
const approved = run(evaluated, { type: 'APPROVE_RELEASE' })
const ready = run(approved, { type: 'CONFIRM_SCOPE' })

const SECTION_ANCHORS = ['section-purpose', 'section-inputs', 'section-actions', 'section-rules', 'section-outputs', 'section-stopping-points']

describe('SC17 exact content', () => {
  const page = plain(html(FactoryScreen, drafted))

  test('shows the heading, the exact intent, six sections, the unverified branch and Continue', () => {
    for (const text of ['Create Agent', 'Unverified branch', 'Continue', ...AGENT_SECTIONS.map((section) => section.title)]) expect(page).toContain(text)
    expect(AGENT_SECTIONS.map((section) => section.title)).toEqual(['Purpose', 'Inputs', 'Actions', 'Rules', 'Outputs', 'Stopping points'])
    expect(plain(html(FactoryScreen, typedIntent))).toContain('Reconcile supplier invoices against purchase orders and stage the result in the ERP.')
  })

  test('the intent is typed text: no model selector, and a draft is not a release', () => {
    expect(page).not.toMatch(/model|GPT|Claude|Deployed|Released/i)
    expect(page).toContain('Variance exception rule: unverified until SME review')
  })

  test('the draft stays neutral: no execution cyan on any state', () => {
    for (const state of [atFactory, typedIntent, drafted]) expect(html(FactoryScreen, state)).not.toMatch(/(?:text|bg|border|ring|stroke|fill)-arc\b/)
  })
})

describe('SC17 states', () => {
  test('empty: the field is empty, the sections and the branch are hidden and Continue is blocked with its reason', () => {
    const page = html(FactoryScreen, atFactory)
    expect(hidden(page, 'intent')).toBe(false)
    for (const name of ['agent-sections', 'unverified-branch', 'branch-evidence', ...SECTION_ANCHORS]) expect(hidden(page, name)).toBe(true)
    expect(disabled(page, 'continue')).toBe(true)
    expect(plain(page)).toContain('Enter an intent to create an agent.')
  })

  test('typing: the film shows the typed prefix and a caret, never the full intent, and keeps Continue blocked', () => {
    const typed: TypedView = { target: 'intent', text: 'Reconcile supplier invoices aga', full: INTENT, count: 31, selected: false, complete: false, caret: true }
    const page = html(FactoryScreen, atFactory, filmAt(20, {}, { intent: typed }))
    expect(plain(page)).toContain('Reconcile supplier invoices aga')
    expect(plain(page)).not.toContain('purchase orders and stage')
    expect(page).toContain('data-film-caret')
    expect(disabled(page, 'continue')).toBe(true)
    expect(openingTag(page, 'agent-sections')).toContain('display:none')
    expect(page.match(/<p id="factory-continue-reason"[^>]*>/)?.[0]).toContain('display:none')
  })

  test('populated: all six sections and the branch are shown, v0.1, and Continue is open', () => {
    const page = html(FactoryScreen, drafted)
    for (const name of ['agent-sections', 'unverified-branch', 'branch-evidence', ...SECTION_ANCHORS]) expect(hidden(page, name)).toBe(false)
    expect(plain(page)).toContain('Create Agent · v0.1')
    expect(disabled(page, 'continue')).toBe(false)
    expect(drafted.agent.versions).toEqual(['agent-v0.1'])
  })

  test('unverified: the branch is flagged with a warning triangle and says it is unverified until SME review', () => {
    const page = html(FactoryScreen, drafted)
    expect(openingTag(page, 'unverified-branch')).toContain('data-view="unverified"')
    expect(page).toContain('lucide-triangle-alert')
    expect(plain(page)).toContain('Variance exception rule: unverified until SME review.')
  })

  test('the rows appear 60 ms apart over 150 ms from CREATE_AGENT, the branch last', () => {
    const rows = [...SECTION_ANCHORS, 'unverified-branch']
    const during = html(FactoryScreen, drafted, filmAt(103, { CREATE_AGENT: 100 }))
    const opacities = rows.map((name) => opacityOf(during, name))
    expect(opacities[0]).toBeGreaterThan(0)
    expect([...opacities].sort((a, b) => b - a)).toEqual(opacities)
    expect(opacities[opacities.length - 1]).toBe(0)
    expect(html(FactoryScreen, drafted, filmAt(100, { CREATE_AGENT: 100 }))).toContain('opacity:0')
    for (const name of rows) expect(opacityOf(html(FactoryScreen, drafted, filmAt(115, { CREATE_AGENT: 100 })), name)).toBe(1)
  })
})

describe('SC17 interaction', () => {
  test('typing dispatches SET_INTENT with the field text', () => {
    expect(fire(FactoryScreen, atFactory, 'intent', 'onChange', { target: { value: 'Reconcile' } })).toEqual([{ type: 'SET_INTENT', text: 'Reconcile' }])
  })

  test('Enter submits a valid intent only; Shift+Enter and a blank field do nothing', () => {
    expect(fire(FactoryScreen, typedIntent, 'intent', 'onKeyDown', { key: 'Enter' })).toEqual([{ type: 'CREATE_AGENT' }])
    expect(fire(FactoryScreen, typedIntent, 'intent', 'onKeyDown', { key: 'Enter', shiftKey: true })).toEqual([])
    expect(fire(FactoryScreen, atFactory, 'intent', 'onKeyDown', { key: 'Enter' })).toEqual([])
  })

  test('blank intent blocks advance: Continue is disabled and the reducer refuses CREATE_AGENT', () => {
    expect(disabled(html(FactoryScreen, atFactory), 'continue')).toBe(true)
    expectRejected(atFactory, { type: 'CREATE_AGENT' }, 'intent')
    expect(transition(atFactory, { type: 'OPEN_SCREEN', screen: 'SC18' }).ok).toBe(false)
  })

  test('Continue with a valid intent creates the draft and opens SC18; on the draft it only opens SC18', () => {
    expect(disabled(html(FactoryScreen, typedIntent), 'continue')).toBe(false)
    const dispatched = fire(FactoryScreen, typedIntent, 'continue')
    expect(dispatched).toEqual([{ type: 'CREATE_AGENT' }, { type: 'OPEN_SCREEN', screen: 'SC18' }])
    const after = run(typedIntent, ...dispatched)
    expect([after.phase, after.route]).toEqual(['ST06', 'SC18'])
    expect(fire(FactoryScreen, drafted, 'continue')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC18' }])
  })

  test('Review evidence opens the AP-RULE-009 source with the draft version, Elena Ruiz and both threshold relations', () => {
    expect(fire(FactoryScreen, drafted, 'branch-evidence')).toEqual([{ type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }])
    const page = plain(html(FactoryScreen, run(drafted, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })))
    for (const text of ['v0.1', 'Elena Ruiz', 'AP-RULE-009', 'variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept', 'Unverified branch', 'does not verify the branch']) expect(page).toContain(text)
  })

  test('a viewpoint other than the Workflow Owner sees why, and none of the draft', () => {
    const priya = run(drafted, { type: 'SELECT_ACTOR', personId: 'priya' })
    const page = html(FactoryScreen, priya)
    expect(plain(page)).toContain('Not available')
    for (const name of ['intent', 'continue', 'unverified-branch']) expect(hidden(page, name)).toBe(true)
    expect(plain(page)).not.toContain('Purpose')
  })
})

describe('SC18 exact content', () => {
  const page = plain(html(ScopeScreen, pending))

  test('shows the scope, the three applications and the selected queue as its own box', () => {
    for (const text of ['AP East', 'Gmail', 'NetSuite', 'Google Sheets', 'Selected invoice queue', 'Supplier Invoice Reconciler', 'Run Supervised']) expect(page).toContain(text)
    expect(openingTag(html(ScopeScreen, pending), 'scope-queue')).toContain('border-foreground')
    expect(SCOPE_ANCHOR_RECTS['scope-queue'].y).toBeGreaterThan(SCOPE_ANCHOR_RECTS['scope-apps'].y)
    expect(SCOPE_ANCHOR_RECTS['scope-queue'].height).toBe(40)
  })

  test('shows Tier 3 - Consequential, the per-action tiers and Tier 4 Restricted', () => {
    for (const text of ['Tier 3 - Consequential', 'read · Tier 0', 'tag/stage · Tier 1/2', 'post/approve variance · Tier 3', 'Tier 4 Restricted']) expect(page).toContain(text)
  })

  test('shows all six autonomy stages in order, Stage 3 selected', () => {
    const labels = ['Observe', 'Suggest', 'Guide', 'Supervised Assist', 'Scoped Autopilot', 'Self-Maintaining Autopilot']
    const positions = labels.map((label) => page.indexOf(label, page.indexOf('Autonomy ladder')))
    expect(positions.every((position) => position > 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    const marked = html(ScopeScreen, pending).match(/data-film-anchor="ladder-stage-\d"[^>]*aria-current="true"/g)
    expect(marked).toHaveLength(1)
    expect(marked?.[0]).toContain('ladder-stage-3')
  })

  test('shows the four gate rows, the provenance line and the release target', () => {
    for (const text of ['5/5 verified human examples', '28/25 representative scenarios', '6/5 edge/negative', 'Owner approval', '3 observed this week + 2 SME-verified archived cases', 'v1.0 · Stage 3 Supervised Assist', 'Deploy']) expect(page).toContain(text)
    expect(GATE_PROVENANCE).toBe('3 observed this week + 2 SME-verified archived cases')
  })

  test('Stage 3 is selected in neutral ink and no part of the screen is execution cyan', () => {
    const markup = html(ScopeScreen, pending)
    expect(openingTag(markup, 'ladder-stage-3')).toContain('border-l-foreground')
    for (const state of [pending, evaluated, approved, ready]) expect(html(ScopeScreen, state)).not.toMatch(/(?:text|bg|border|ring|stroke|fill)-arc\b/)
  })
})

describe('SC18 pending versus satisfied', () => {
  const pendingPage = html(ScopeScreen, pending)
  const evaluatedPage = html(ScopeScreen, evaluated)
  const readyPage = html(ScopeScreen, ready)

  test('pending: only the examples are checked; the evaluation rows and the owner row are empty circles', () => {
    expect(openingTag(pendingPage, 'gate')).toContain('data-view="pending"')
    expect(count(pendingPage, '>Satisfied<')).toBe(1)
    expect(count(pendingPage, '>Pending<')).toBe(4)
    expect(count(pendingPage, 'opacity:0"')).toBe(3)
    expect(plain(pendingPage)).toContain('Gate pending')
  })

  test('an evaluation without the owner satisfies two rows and not the owner row: the owner is separate', () => {
    expect(openingTag(evaluatedPage, 'gate')).toContain('data-view="pending"')
    expect(count(evaluatedPage, '>Satisfied<')).toBe(3)
    expect(count(evaluatedPage, 'opacity:0"')).toBe(1)
    expect(plain(evaluatedPage)).toContain('The workflow owner has not approved this release.')
    expect(disabled(evaluatedPage, 'deploy')).toBe(true)
  })

  test('satisfied: all four rows are checked after the evaluation and the owner approval, and Deploy opens', () => {
    expect(openingTag(readyPage, 'gate')).toContain('data-view="satisfied"')
    expect(count(readyPage, '>Satisfied<')).toBe(5)
    expect(count(readyPage, '>Pending<')).toBe(0)
    expect(count(readyPage, 'opacity:0"')).toBe(0)
    expect(plain(readyPage)).toContain('Gate satisfied')
    expect(disabled(readyPage, 'deploy')).toBe(false)
  })

  test('pending differs from satisfied in every gate marker, and the pending page never reads satisfied', () => {
    expect(plain(pendingPage)).not.toContain('Gate satisfied')
    expect(pendingPage).not.toBe(readyPage)
    expect(disabled(pendingPage, 'approve-release')).toBe(true)
    expect(disabled(evaluatedPage, 'approve-release')).toBe(false)
    expect(disabled(readyPage, 'approve-release')).toBe(true)
  })

  test('a check fades in over 150 ms from the event that earns it, and not before', () => {
    const during = html(ScopeScreen, approved, filmAt(102, { APPROVE_RELEASE: 100 }))
    expect(count(during, 'opacity:0"')).toBe(0)
    expect(during.match(/opacity:0\.\d+/)).not.toBeNull()
    expect(count(html(ScopeScreen, approved, filmAt(100, { APPROVE_RELEASE: 100 })), 'opacity:0')).toBeGreaterThan(count(html(ScopeScreen, approved, filmAt(110, { APPROVE_RELEASE: 100 })), 'opacity:0'))
  })
})

describe('SC18 authority', () => {
  test('Deploy requires the owner approval, the confirmed scope and the evaluation; each refusal names its own gap', () => {
    expectRejected(pending, { type: 'RELEASE_AND_START' }, 'phase')
    expectRejected(evaluated, { type: 'RELEASE_AND_START' }, 'ownerApproval')
    expectRejected(approved, { type: 'RELEASE_AND_START' }, 'scopeConfirmation')
    expectRejected(ready, { type: 'RELEASE_AND_START' }, 'jobScope')
    expect(run(ready, { type: 'CONFIRM_SELECTION' }, { type: 'OPEN_JOB_SCOPE' }, { type: 'RELEASE_AND_START' }).phase).toBe('ST10')
    expect(plain(html(ScopeScreen, pending))).toContain('Needs at least 25 correct scenarios from a completed v0.2 evaluation; 0 are verified.')
    expect(plain(html(ScopeScreen, approved))).toContain('Scope AP East is not confirmed.')
  })

  test('Approve release is refused before the evaluation passes, and a viewpoint without the grant cannot use it', () => {
    expectRejected(pending, { type: 'APPROVE_RELEASE' }, 'phase')
    const daniel = run(evaluated, { type: 'SELECT_ACTOR', personId: 'daniel' })
    expect(plain(html(ScopeScreen, daniel))).toContain('Not available')
  })

  test('Tier 4 is barred: a cross, no action, and no handler on its row', () => {
    const page = html(ScopeScreen, pending)
    expect(plain(page)).toContain('unavailable to agents')
    expect(page).toContain('lucide-shield-x')
    expect(openingTag(page, 'tier-4').startsWith('<div')).toBe(true)
    const row = anchoredElements(<ScopeScreen state={pending} />).find((element) => element.props['data-film-anchor'] === 'tier-4')
    expect(row?.props['onClick']).toBeUndefined()
  })

  test('one granted job is not blanket approval: the screen says so and Confirm scope starts nothing', () => {
    const page = plain(html(ScopeScreen, ready))
    expect(page).toContain('Approving a job does not approve Tier 3 actions.')
    expect(page).toContain('Tier 3 needs separate delegated human authority.')
    expect(ready.job.status).toBe('notStarted')
    expect(approved.agent.scopeConfirmed).toBe(false)
  })

  test('the controls dispatch their own actions and nothing else', () => {
    expect(fire(ScopeScreen, ready, 'deploy')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC21' }])
    expect(fire(ScopeScreen, approved, 'confirm-scope')).toEqual([{ type: 'CONFIRM_SCOPE' }])
    expect(fire(ScopeScreen, evaluated, 'approve-release')).toEqual([{ type: 'APPROVE_RELEASE' }])
    expect(fire(ScopeScreen, pending, 'gate-examples')).toEqual([{ type: 'OPEN_DRAWER', drawer: 'examples' }])
    expect(fire(ScopeScreen, pending, 'open-simulator')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC19' }])
    expect(fire(ScopeScreen, pending, 'gate-owner')).toEqual([])
  })

  test('Deploy opens the job queue and starts nothing: the job stays not started until the scope is confirmed there', () => {
    const opened = run(ready, ...fire(ScopeScreen, ready, 'deploy'))
    expect(opened.route).toBe('SC21')
    expect(opened.phase).toBe('ST09')
    expect(opened.job).toEqual({ status: 'notStarted', outcomes: {} })
    expect(opened.running.job).toBe(false)
    expect(opened.ui.job).toMatchObject({ selection: 'proposed', dialog: 'closed' })
  })
})

describe('SC18 provenance drawer', () => {
  const open = run(pending, { type: 'OPEN_DRAWER', drawer: 'examples' })
  const page = plain(html(ScopeScreen, open))

  test('opens the 3 + 2 provenance: the three observed demonstrations by name, time and invoice, and no archived identity', () => {
    for (const text of ['Verified human examples', GATE_PROVENANCE, 'D1', 'Priya Nair', 'Mon 09:14', 'INV-48203', 'D2', 'INV-48204', 'D3', 'Jamal Carter', 'Tue 13:40', 'INV-48207', '2 SME-verified archived cases', 'No archived case identities are shown.']) {
      expect(page).toContain(text)
    }
    expect(page).not.toMatch(/ARC-|archived case [A-Z0-9]{3,}/)
  })

  test('inspection approves and verifies nothing, and the gate is still pending behind it', () => {
    expect(page).toContain('does not approve, publish or verify anything')
    expect(open.agent).toEqual(pending.agent)
    expect(openingTag(html(ScopeScreen, open), 'gate')).toContain('data-view="pending"')
  })
})

describe('layout', () => {
  test('every anchor rectangle is inside the 1280x720 canvas and the two screens never reuse a name with a different rectangle', () => {
    const merged = { ...FACTORY_ANCHOR_RECTS, ...SCOPE_ANCHOR_RECTS } as Record<string, { x: number; y: number; width: number; height: number }>
    for (const [name, rect] of Object.entries(merged)) {
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(1280)
      expect(rect.y + rect.height).toBeLessThanOrEqual(720)
      const factory = (FACTORY_ANCHOR_RECTS as Record<string, unknown>)[name]
      const scope = (SCOPE_ANCHOR_RECTS as Record<string, unknown>)[name]
      if (factory && scope) expect(factory).toEqual(scope)
    }
  })

  test('Continue is centred on P(1050,600) and Open Flight Simulator on P(1020,606)', () => {
    const centre = (rect: { x: number; y: number; width: number; height: number }) => [rect.x + rect.width / 2, rect.y + rect.height / 2]
    expect(centre(FACTORY_ANCHOR_RECTS.continue)).toEqual([1050, 600])
    expect(centre(SCOPE_ANCHOR_RECTS['open-simulator'])).toEqual([1020, 606])
  })

  test('the intent field is the inventory rectangle and the gate rows are 40 px apart', () => {
    expect(FACTORY_ANCHOR_RECTS.intent).toEqual({ x: 304, y: 160, width: 880, height: 72 })
    expect(SCOPE_ANCHOR_RECTS['gate-scenarios'].y - SCOPE_ANCHOR_RECTS['gate-examples'].y).toBe(40)
  })
})
