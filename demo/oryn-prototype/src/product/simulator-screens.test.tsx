import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PLAYBOOK } from '@/data/playbook'
import { SAFE_CASES, SCENARIOS } from '@/data/simulation'
import { person, reconstruct } from '@/state'
import type { Action, State } from '@/state'
import { act as run } from '@/state/test-helpers'
import type { FilmContext, ProductProps } from './contract'
import { EvidenceDrawer } from './EvidenceDrawer'
import { ResultsScreen } from './ResultsScreen'
import { SimulatorScreen } from './SimulatorScreen'
import { SIMULATOR_ANCHORS } from './simulator-layout'

/** SC19 Flight Simulator, SC20 results and the replay / AP-RULE-009 drawer on SC20. */

type Props = Record<string, unknown>
type Screen = (props: ProductProps) => ReactNode

const html = (Screen: Screen, state: State, film?: FilmContext): string => renderToStaticMarkup(<Screen state={state} film={film} />)
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const text = (markup: string): string => plain(markup.replace(/<[^>]*>/g, ''))
const count = (markup: string, needle: string): number => markup.split(needle).length - 1

const openingTag = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}
const hidden = (markup: string, name: string): boolean => openingTag(markup, name).includes('display:none')
const disabled = (markup: string, name: string): boolean => openingTag(markup, name).includes('aria-disabled="true"')

/** Markup of the element carrying an anchor, from its opening tag to its matching closing tag. */
function elementOf(markup: string, name: string): string {
  const tag = openingTag(markup, name)
  const start = markup.indexOf(tag)
  const tagName = (tag.match(/^<(\w+)/) as RegExpMatchArray)[1]
  const tags = new RegExp(`<${tagName}\\b|</${tagName}>`, 'g')
  tags.lastIndex = start
  let depth = 0
  for (let found = tags.exec(markup); found; found = tags.exec(markup)) {
    depth += found[0].startsWith('</') ? -1 : 1
    if (depth === 0) return markup.slice(start, tags.lastIndex)
  }
  throw new Error(`Anchor ${name} is not closed`)
}

const filmAt = (frame: number, applied: Partial<Record<Action['type'], number>> = {}): FilmContext => ({
  frame,
  reducedMotion: false,
  lastApplied: (type) => applied[type] ?? null,
})

/** Every element of a screen, without rendering the drawer (it uses hooks, which only a renderer may run). */
function elementsOf(node: ReactNode, out: ReactElement<Props>[] = []): ReactElement<Props>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => elementsOf(child as ReactNode, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  out.push(node)
  if (node.type === EvidenceDrawer) return out
  if (typeof node.type === 'function') return elementsOf((node.type as (props: Props) => ReactNode)(node.props), out)
  return elementsOf(node.props.children as ReactNode, out)
}

/** Fire the click of the one element `pick` selects and return every action it dispatched. */
function click(Screen: Screen, state: State, pick: (props: Props) => boolean): Action[] {
  const dispatched: Action[] = []
  const element = elementsOf(<Screen state={state} dispatch={(action) => dispatched.push(action)} />).find((candidate) => pick(candidate.props))
  if (!element) throw new Error('No element matches')
  ;(element.props.onClick as ((event: Props) => void) | undefined)?.({ preventDefault: () => undefined })
  return dispatched
}
const clickAnchor = (Screen: Screen, state: State, name: string): Action[] => click(Screen, state, (props) => props['data-film-anchor'] === name)
const clickTile = (Screen: Screen, state: State, id: string): Action[] => click(Screen, state, (props) => props['data-scenario'] === id)

const tiles = (markup: string): (readonly [string, string])[] => [...markup.matchAll(/data-scenario="(SCN-\d{3})" data-state="(\w+)"/g)].map((match) => [match[1] as string, match[2] as string] as const)
const tally = (markup: string, kind: string): number => tiles(markup).filter(([, state]) => state === kind).length
const tileTag = (markup: string, id: string): string => markup.match(new RegExp(`<button[^>]*data-scenario="${id}"[^>]*>`))?.[0] as string
const labelsOf = (markup: string): string[] => tiles(markup).map(([id]) => tileTag(markup, id).match(/aria-label="([^"]*)"/)?.[1] as string)

/** Cyan: the orbit node of a running glyph, the progress fill while executing, or any arc colour class. */
const CYAN = /(?:text|bg|border|ring|stroke|fill)-arc\b|data-running="true"|data-executing="true"|var\(--arc-mark\)/

/** The two cells of each comparison row, as text: [v0.1 column, v0.2 column]. */
function compareRows(markup: string): (readonly [string, string])[] {
  const rows = [...elementOf(markup, 'version-compare').matchAll(/<div class="[^"]*border-r[^"]*"[^>]*>(.*?)<\/div><div class="[^"]*flex-1[^"]*"[^>]*>(.*?)<\/div>/g)]
  return rows.map((row) => [text(row[1] as string), text(row[2] as string)] as const)
}
/** The page without the v0.1 column of the comparison (v0.1 legitimately records what it actually did). */
const withoutV01Column = (markup: string): string => markup.replace(/<div class="[^"]*border-r[^"]*"[^>]*>.*?<\/div>(?=<div class="[^"]*flex-1)/g, '')

const IDS = SCENARIOS.map((scenario) => scenario.id)
const RUN_FRAMES = 48
const BOUNDARY = 'SCN-022'

const toSimulator = (state: State): State => run(state, { type: 'OPEN_SCREEN', screen: 'SC19' })
const idle = toSimulator(reconstruct('ST06'))
const started = run(idle, { type: 'SET_SIMULATOR', runFrames: RUN_FRAMES }, { type: 'RUN_SIMULATION' })
const cancelled = run(started, { type: 'CANCEL_SIMULATION' })
const failedV01 = reconstruct('ST08')
const passedV02 = reconstruct('ST09')
const selected = (state: State, id: string): State => run(state, { type: 'SELECT_SCENARIO', scenarioId: id })
const replayOpen = (state: State): State => run(selected(state, BOUNDARY), { type: 'OPEN_DRAWER', drawer: 'replay' })
const ruleOpen = (state: State): State => run(selected(state, BOUNDARY), { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })
const compareOpen = (state: State): State => run(state, { type: 'SET_COMPARE', open: true })

/** A film where the run landed at frame 10: the 48 frame run has executed `frames / 48 * 28` scenarios at frame `10 + frames`. */
const runningAt = (frames: number): FilmContext => filmAt(10 + frames, { RUN_SIMULATION: 10 })

describe('SC19 idle', () => {
  const markup = html(SimulatorScreen, idle)

  test('shows the heading, suite, versions, categories and both run controls', () => {
    const page = plain(markup)
    for (const expected of ['Flight Simulator', 'SIM-AP-RECON · 28 scenarios', 'v0.1', 'v0.2', 'Normal', 'Edge', 'Negative', 'Run scenarios', 'Cancel', 'Not Run · 0 of 28']) expect(page).toContain(expected)
  })

  test('28 tiles with a unique accessible name, all Not Run and no verdict anywhere', () => {
    expect(tiles(markup).map(([id]) => id)).toEqual(IDS)
    expect(tally(markup, 'notRun')).toBe(28)
    expect(new Set(labelsOf(markup)).size).toBe(28)
    for (const label of labelsOf(markup)) expect(label.endsWith(', Not Run')).toBe(true)
    expect(plain(markup)).not.toMatch(/\bPassed\b|\bFailed\b/)
  })

  test('Run is available and Cancel is not, because nothing is running', () => {
    expect(disabled(markup, 'run-scenarios')).toBe(false)
    expect(disabled(markup, 'cancel-run')).toBe(true)
  })

  test('the six expected safe escalations are listed, each Not Run', () => {
    const list = plain(elementOf(markup, 'safe-cases'))
    expect(count(list, 'Missing Purchase Order')).toBe(2)
    for (const label of ['Duplicate invoice', 'Over-threshold variance', 'ERP timeout', 'Unreadable PDF']) expect(list).toContain(label)
    for (const item of SAFE_CASES) expect(text(elementOf(markup, `safe-case-${item.id.toLowerCase()}`))).toBe(`${item.label}${item.id} · Not Run`)
  })

  test('the candidate version is the one marked current', () => {
    expect(markup).toMatch(/<span aria-current="true"[^>]*>v0\.1<\/span>/)
    expect(count(markup, 'aria-current="true"')).toBe(1)
  })

  test('there is no cyan while nothing executes', () => {
    expect(markup).not.toMatch(CYAN)
  })

  test('the run label of the cut names the version it will run', () => {
    const labelled = run(idle, { type: 'SET_SIMULATOR', runLabel: 'Run Evaluation' })
    const button = elementOf(html(SimulatorScreen, labelled), 'run-scenarios')
    expect(button).toContain('aria-label="Run Evaluation, v0.1"')
    expect(text(button)).toBe('Run Evaluation')
    expect(openingTag(markup, 'run-scenarios')).toContain('aria-label="Run scenarios, v0.1"')
  })

  test('Run dispatches RUN_SIMULATION', () => {
    expect(clickAnchor(SimulatorScreen, idle, 'run-scenarios')).toEqual([{ type: 'RUN_SIMULATION' }])
  })

  test('before the run completes a tile only selects: it shows no verdict and opens no result', () => {
    expect(clickTile(SimulatorScreen, idle, 'SCN-003')).toEqual([{ type: 'SELECT_SCENARIO', scenarioId: 'SCN-003' }])
    const detail = plain(elementOf(html(SimulatorScreen, selected(idle, 'SCN-003')), 'scenario-detail'))
    expect(detail).toContain('SCN-003 · Copperline ordinary invoice; match')
    expect(detail).toContain('No recorded verdict for this run')
    expect(detail).not.toMatch(/Passed|Failed/)
  })
})

describe('SC19 running', () => {
  const markup = html(SimulatorScreen, started, runningAt(24))

  test('14 executed, one running tile at the 15th scenario, 13 not run, no verdict', () => {
    expect(tally(markup, 'executed')).toBe(14)
    expect(tally(markup, 'running')).toBe(1)
    expect(tally(markup, 'notRun')).toBe(13)
    expect(tiles(markup).filter(([, state]) => state === 'running').map(([id]) => id)).toEqual(['SCN-015'])
    for (const kind of ['passed', 'safeEscalation', 'failed']) expect(tally(markup, kind)).toBe(0)
    expect(tiles(markup).slice(0, 14).every(([, state]) => state === 'executed')).toBe(true)
  })

  test('the status and the progress bar report 14 of 28', () => {
    expect(text(elementOf(markup, 'sim-status'))).toContain('Running14 of 28 scenarios run')
    const progress = elementOf(markup, 'sim-progress')
    expect(progress).toContain('aria-valuetext="14 of 28 scenarios run"')
    expect(progress).toContain('width:50%')
  })

  test('cyan is only the status orbit, the running tile orbit and the progress fill', () => {
    const runningTile = markup.slice(markup.indexOf(tileTag(markup, 'SCN-015'))).split('</button>')[0] as string
    const status = elementOf(markup, 'sim-status')
    expect(runningTile).toContain('data-running="true"')
    expect(status).toContain('data-running="true"')
    expect(count(markup, 'data-running="true"')).toBe(count(status, 'data-running="true"') + count(runningTile, 'data-running="true"'))
    expect(text(status)).toContain('Running')
    expect(elementOf(markup, 'sim-progress')).toContain('bg-arc')
    expect(elementOf(markup, 'sim-progress')).toContain('data-executing="true"')
  })

  test('Run is unavailable and Cancel is available', () => {
    expect(disabled(markup, 'run-scenarios')).toBe(true)
    expect(disabled(markup, 'cancel-run')).toBe(false)
    expect(clickAnchor(SimulatorScreen, started, 'cancel-run')).toEqual([{ type: 'CANCEL_SIMULATION' }])
  })

  test('a running suite never reads as 28 executed: it stops at 27 until the run completes', () => {
    const late = html(SimulatorScreen, started, runningAt(10_000))
    expect(tally(late, 'executed')).toBe(27)
    expect(tally(late, 'running')).toBe(1)
    expect(tally(late, 'notRun')).toBe(0)
    expect(text(elementOf(late, 'sim-status'))).toContain('27 of 28 scenarios run')
    expect(plain(late)).not.toContain('Run complete')
  })

  test('a continuing film declares a lead: executed derives from the lead plus the frames since the run landed', () => {
    const led = run(started, { type: 'SET_SIMULATOR', runLead: 18 })
    const view = html(SimulatorScreen, led, runningAt(6))
    expect(tally(view, 'executed')).toBe(14)
    expect(tiles(view).find(([, state]) => state === 'running')?.[0]).toBe('SCN-015')
  })

  test('a tile only selects while the run executes: no verdict and no result screen', () => {
    expect(clickTile(SimulatorScreen, started, 'SCN-001')).toEqual([{ type: 'SELECT_SCENARIO', scenarioId: 'SCN-001' }])
    const detail = plain(elementOf(html(SimulatorScreen, selected(started, 'SCN-001'), runningAt(24)), 'scenario-detail'))
    expect(detail).toContain('No recorded verdict for this run')
  })

  test('a new run after a cancel starts from nothing at the frame it landed', () => {
    const again = run(cancelled, { type: 'RUN_SIMULATION' })
    const view = html(SimulatorScreen, again, filmAt(60 + 24, { RUN_SIMULATION: 60, CANCEL_SIMULATION: 30 }))
    expect(tally(view, 'executed')).toBe(14)
    expect(tally(view, 'running')).toBe(1)
    expect(plain(view)).not.toContain('Cancelled')
  })
})

describe('SC19 cancelled', () => {
  const film = (frame: number) => filmAt(frame, { RUN_SIMULATION: 10, CANCEL_SIMULATION: 30 })
  const markup = html(SimulatorScreen, cancelled, film(30))

  test('the executed count freezes at the cancel frame', () => {
    expect(markup).toBe(html(SimulatorScreen, cancelled, film(300)))
    expect(tally(markup, 'executed')).toBe(11)
    expect(tally(markup, 'notRun')).toBe(17)
    expect(tally(markup, 'running')).toBe(0)
  })

  test('says Cancelled and incomplete, and is never a pass', () => {
    const status = text(elementOf(markup, 'sim-status'))
    expect(status).toBe('Cancelled · 11 of 28 run · incomplete, the rest stay Not Run')
    for (const kind of ['passed', 'safeEscalation', 'failed']) expect(tally(markup, kind)).toBe(0)
    expect(plain(markup)).not.toMatch(/\bPassed\b|\bFailed\b|Run complete/)
  })

  test('there is no cyan', () => {
    expect(markup).not.toMatch(CYAN)
    expect(elementOf(markup, 'sim-progress')).toContain('aria-valuetext="11 of 28 scenarios run"')
  })

  test('the run stays at ST07, never reaching the results', () => {
    expect(cancelled.phase).toBe('ST07')
    expect(cancelled.route).toBe('SC19')
  })

  test('Run is available again and Cancel is not', () => {
    expect(disabled(markup, 'run-scenarios')).toBe(false)
    expect(disabled(markup, 'cancel-run')).toBe(true)
    expect(clickAnchor(SimulatorScreen, cancelled, 'run-scenarios')).toEqual([{ type: 'RUN_SIMULATION' }])
  })
})

describe('SC19 after the evaluations', () => {
  test('after a failed v0.1 the simulator is idle on v0.2: none of v0.1 is carried over and Run rebuilds v0.2', () => {
    const state = toSimulator(failedV01)
    const markup = html(SimulatorScreen, state)
    expect(markup).toMatch(/<span aria-current="true"[^>]*>v0\.2<\/span>/)
    expect(count(markup, 'aria-current="true"')).toBe(1)
    expect(tally(markup, 'notRun')).toBe(28)
    expect(plain(markup)).not.toMatch(/\bPassed\b|\bFailed\b/)
    expect(openingTag(markup, 'run-scenarios')).toContain('aria-label="Run scenarios, v0.2"')
    expect(disabled(markup, 'run-scenarios')).toBe(false)
    expect(clickAnchor(SimulatorScreen, state, 'run-scenarios')).toEqual([{ type: 'FIX_AND_RUN' }])
    expect(markup).not.toMatch(CYAN)
  })

  const finished = toSimulator(passedV02)
  const markup = html(SimulatorScreen, finished)

  test('a finished v0.2 shows its own verdicts: 22 passed, 6 safe escalations, 0 failed', () => {
    expect(tally(markup, 'passed')).toBe(22)
    expect(tally(markup, 'safeEscalation')).toBe(6)
    expect(tally(markup, 'failed')).toBe(0)
    expect(tally(markup, 'notRun') + tally(markup, 'executed') + tally(markup, 'running')).toBe(0)
    expect(tiles(markup).find(([id]) => id === BOUNDARY)?.[1]).toBe('passed')
    expect(text(elementOf(markup, 'sim-status'))).toBe('Run complete · v0.2 · 28 of 28 run')
  })

  test('it has no cyan: the full bar is neutral', () => {
    expect(markup).not.toMatch(CYAN)
    expect(elementOf(markup, 'sim-progress')).toContain('width:100%')
  })

  test('both controls are unavailable once the evaluation passed', () => {
    expect(disabled(markup, 'run-scenarios')).toBe(true)
    expect(disabled(markup, 'cancel-run')).toBe(true)
  })

  test('a tile selects its scenario and opens the results', () => {
    expect(clickTile(SimulatorScreen, finished, 'SCN-005')).toEqual([{ type: 'SELECT_SCENARIO', scenarioId: 'SCN-005' }, { type: 'OPEN_SCREEN', screen: 'SC20' }])
    expect(plain(elementOf(html(SimulatorScreen, selected(finished, 'SCN-023')), 'scenario-detail'))).toContain('Passed — Expected Safe Escalation')
  })
})

describe('SC19 row stream', () => {
  const stream = (state: State): State => run(state, { type: 'SET_SIMULATOR', view: 'stream' })
  const film = runningAt(24)

  test('shows the same 28 scenarios in the same order and states as the grid', () => {
    for (const [state, at] of [[started, film], [idle, undefined], [toSimulator(passedV02), undefined]] as const) {
      const rows = html(SimulatorScreen, stream(state), at)
      expect(tiles(rows).map(([id]) => id)).toEqual(IDS)
      expect(tiles(rows)).toEqual(tiles(html(SimulatorScreen, state, at)))
    }
  })

  test('is a layout of the one scenario-grid anchor, never a second one', () => {
    const rows = html(SimulatorScreen, stream(started), film)
    expect(count(rows, 'data-film-anchor="scenario-grid"')).toBe(1)
    expect(openingTag(rows, 'scenario-grid')).toContain('data-layout="stream"')
  })

  test('at the running frame only the executing row is cyan', () => {
    const rows = html(SimulatorScreen, stream(started), film)
    const list = rows.slice(rows.indexOf('<ol'), rows.indexOf('</ol>'))
    expect(count(list, 'data-running="true"')).toBe(1)
    const running = list.split('<li').find((row) => row.includes('data-state="running"')) as string
    expect(running).toContain('data-scenario="SCN-015"')
    expect(running).toContain('data-running="true"')
  })

  test('a finished stream has no cyan', () => {
    expect(html(SimulatorScreen, stream(toSimulator(passedV02)))).not.toMatch(CYAN)
  })
})

describe('SC19 viewpoint', () => {
  const owner = person(PLAYBOOK.ownerId).name

  test('an Employee viewpoint gets Not available with the reason and no tile', () => {
    const markup = html(SimulatorScreen, run(idle, { type: 'SELECT_ACTOR', personId: 'priya' }))
    expect(plain(markup)).toContain('Flight Simulator')
    expect(plain(markup)).toContain(`Not available: The Flight Simulator is run by the Workflow Owner, ${owner}.`)
    expect(count(markup, 'data-scenario=')).toBe(0)
    expect(plain(markup)).not.toContain('Run scenarios')
  })

  test('every anchor is still present, and hidden', () => {
    const markup = html(SimulatorScreen, run(idle, { type: 'SELECT_ACTOR', personId: 'priya' }))
    for (const name of SIMULATOR_ANCHORS) expect(hidden(markup, name)).toBe(true)
  })

  test('SC20 is not available to that viewpoint either', () => {
    const markup = html(ResultsScreen, run(failedV01, { type: 'SELECT_ACTOR', personId: 'priya' }))
    expect(plain(markup)).toContain('Evaluation results')
    expect(plain(markup)).toContain(`Not available: The Flight Simulator is run by the Workflow Owner, ${owner}.`)
    expect(count(markup, 'data-scenario=')).toBe(0)
    for (const name of ['results', 'failed-scenario', 'result-detail', 'safe-results', 'compare-versions', 'rerun', 'version-compare', 'equality-row']) expect(hidden(markup, name)).toBe(true)
  })

  test('SC20 before any evaluation completed has no results to show', () => {
    const markup = html(ResultsScreen, started)
    expect(plain(markup)).toContain('There is no completed evaluation to show yet.')
    expect(count(markup, 'data-scenario=')).toBe(0)
  })
})

describe('SC20 v0.1 result', () => {
  const markup = html(ResultsScreen, failedV01)

  test('reports 21 Passed, 6 Passed — Expected Safe Escalation, 1 Failed and 27/28 intended outcomes correct', () => {
    expect(failedV01.route).toBe('SC20')
    const results = text(elementOf(markup, 'results'))
    expect(results).toContain('21 Passed')
    expect(results).toContain('6 Passed — Expected Safe Escalation')
    expect(results).toContain('1 Failed')
    expect(results).toContain('27/28 intended outcomes correct')
    expect(plain(markup)).toContain('v0.1 · Run complete · 28 of 28 run')
  })

  test('the tiles are 21 passed, 6 safe escalations and 1 failed: 28 in all', () => {
    expect(tally(markup, 'passed')).toBe(21)
    expect(tally(markup, 'safeEscalation')).toBe(6)
    expect(tally(markup, 'failed')).toBe(1)
    expect(tiles(markup)).toHaveLength(28)
  })

  test('the one failure is SCN-022 and it carries the failed-scenario anchor', () => {
    expect(tiles(markup).filter(([, state]) => state === 'failed').map(([id]) => id)).toEqual([BOUNDARY])
    const tag = openingTag(markup, 'failed-scenario')
    expect(tag).toContain(`data-scenario="${BOUNDARY}"`)
    expect(tag).toContain('data-state="failed"')
    expect(count(markup, 'data-film-anchor="failed-scenario"')).toBe(1)
  })

  test('each of the six safe escalations is listed as an intended pass, never a failure', () => {
    for (const item of SAFE_CASES) {
      const row = elementOf(markup, `safe-result-${item.id.toLowerCase()}`)
      expect(openingTag(markup, `safe-result-${item.id.toLowerCase()}`)).toContain(`aria-label="${item.id}, ${item.label}, Passed — Expected Safe Escalation"`)
      expect(text(row)).toBe(`${item.id}${item.label}Passed — Expected Safe Escalation`)
      expect(row).toContain('data-glyph="safeEscalation"')
      expect(row).not.toContain('data-glyph="failed"')
      expect(tileTag(markup, item.id)).toContain('data-state="safeEscalation"')
    }
    expect(text(elementOf(markup, 'safe-results'))).not.toContain('Failed')
  })

  test('there is no cyan: nothing executes here', () => {
    expect(markup).not.toMatch(CYAN)
  })

  test('with nothing selected the failure is the detail, with the boundary replay', () => {
    expect(text(elementOf(markup, 'result-detail'))).toContain('variance_exactly_2.00pctFailed · Expected: accept · Actual: escalateReplay')
  })

  test('selecting SCN-022 shows its expected and actual outcome and offers the replay', () => {
    const detail = text(elementOf(html(ResultsScreen, selected(failedV01, BOUNDARY)), 'result-detail'))
    expect(detail).toContain('SCN-022 · variance_exactly_2.00pct')
    expect(detail).toContain('Failed · Expected: accept · Actual: escalate')
  })

  test('another scenario shows only its own verdict and has no replay', () => {
    const detail = text(elementOf(html(ResultsScreen, selected(failedV01, 'SCN-023')), 'result-detail'))
    expect(detail).toContain('Passed — Expected Safe Escalation')
    expect(detail).not.toContain('Expected: accept')
    expect(detail).not.toContain('Replay')
    expect(text(elementOf(html(ResultsScreen, selected(failedV01, 'SCN-005')), 'result-detail'))).toContain('Passed')
  })

  test('clicking the SCN-022 tile selects it and opens its replay; any other tile only selects', () => {
    expect(clickTile(ResultsScreen, failedV01, BOUNDARY)).toEqual([{ type: 'SELECT_SCENARIO', scenarioId: BOUNDARY }, { type: 'OPEN_DRAWER', drawer: 'replay' }])
    expect(clickTile(ResultsScreen, failedV01, 'SCN-005')).toEqual([{ type: 'SELECT_SCENARIO', scenarioId: 'SCN-005' }])
    expect(click(ResultsScreen, selected(failedV01, BOUNDARY), (props) => props.children === 'Replay')).toEqual([{ type: 'SELECT_SCENARIO', scenarioId: BOUNDARY }, { type: 'OPEN_DRAWER', drawer: 'replay' }])
  })

  test('Rerun is available and dispatches FIX_AND_RUN', () => {
    expect(disabled(markup, 'rerun')).toBe(false)
    expect(clickAnchor(ResultsScreen, failedV01, 'rerun')).toEqual([{ type: 'FIX_AND_RUN' }])
  })

  test('Compare versions toggles the comparison', () => {
    expect(text(elementOf(markup, 'compare-versions'))).toBe('Compare versions')
    expect(clickAnchor(ResultsScreen, failedV01, 'compare-versions')).toEqual([{ type: 'SET_COMPARE', open: true }])
    const open = compareOpen(failedV01)
    expect(text(elementOf(html(ResultsScreen, open), 'compare-versions'))).toBe('Hide comparison')
    expect(clickAnchor(ResultsScreen, open, 'compare-versions')).toEqual([{ type: 'SET_COMPARE', open: false }])
  })
})

describe('SC20 replay and rule drawer', () => {
  test('closed, neither drawer frame is visible', () => {
    const markup = html(ResultsScreen, failedV01)
    expect(hidden(markup, 'replay')).toBe(true)
    expect(hidden(markup, 'rule-drawer')).toBe(true)
  })

  test('the v0.1 replay shows the boundary scenario, what it expected, what v0.1 did and the rule', () => {
    const markup = html(ResultsScreen, replayOpen(failedV01))
    expect(hidden(markup, 'replay')).toBe(false)
    expect(hidden(markup, 'rule-drawer')).toBe(true)
    const replay = text(elementOf(markup, 'replay'))
    for (const expected of ['variance_exactly_2.00pct', 'SCN-022 · v0.1 · Failed', 'Expected: accept', 'Actual · v0.1', 'Actual: escalate', '> 2.00% requires approval', 'Open AP-RULE-009']) expect(replay).toContain(expected)
    expect(elementOf(markup, 'replay')).toContain('text-danger')
  })

  test('AP-RULE-009 from the replay swaps frames: the rule shows the evidence and no unverified banner', () => {
    const markup = html(ResultsScreen, ruleOpen(failedV01))
    expect(hidden(markup, 'rule-drawer')).toBe(false)
    expect(hidden(markup, 'replay')).toBe(true)
    const rule = text(elementOf(markup, 'rule-drawer'))
    for (const expected of ['AP-RULE-009', 'Expected: accept', 'Actual: escalate', '> 2.00% requires approval', 'Exactly 2.00% auto-accepts']) expect(rule).toContain(expected)
    expect(rule).not.toContain('unverified until SME review')
  })

  test('the same rule outside the results keeps its unverified banner', () => {
    const atFactory = run(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC17' }, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })
    expect(text(html(SimulatorScreen, atFactory))).not.toContain('Expected: accept')
    expect(text(renderToStaticMarkup(<EvidenceDrawer state={atFactory} />))).toContain('unverified until SME review')
  })
})

describe('SC20 comparison', () => {
  test('at ST08 only v0.1 is evaluated: v0.2 is a proposed correction, Not Run in every count', () => {
    const markup = html(ResultsScreen, compareOpen(failedV01))
    expect(hidden(markup, 'version-compare')).toBe(false)
    for (const name of ['results', 'result-detail', 'safe-results']) expect(hidden(markup, name)).toBe(true)
    expect(compareRows(markup)).toEqual([
      ['v0.1 · Failed evaluation', 'v0.2 · Proposed correction'],
      ['21 Passed', 'Not Run'],
      ['6 Passed — Expected Safe Escalation', 'Not Run'],
      ['1 Failed', 'Not Run'],
      ['27/28 intended outcomes correct', 'Not Run'],
      ['variance_exactly_2.00pctFailed · Expected: accept · Actual: escalate', 'variance_exactly_2.00pctNot Run · proposed, not yet evaluated'],
      ['≥ 2.00% requires approval', '> 2.00% requires approval'],
    ])
    expect(openingTag(markup, 'equality-row')).toContain('data-verdicts="failed/notRun"')
    expect(openingTag(markup, 'version-compare')).toContain('data-view="proposed"')
  })

  test('closed, the comparison is present and hidden and the results are shown', () => {
    const markup = html(ResultsScreen, failedV01)
    expect(hidden(markup, 'version-compare')).toBe(true)
    expect(hidden(markup, 'equality-row')).toBe(true)
    for (const name of ['results', 'result-detail', 'safe-results']) expect(hidden(markup, name)).toBe(false)
  })

  test('at ST09 both versions are evaluated side by side and v0.1 is unchanged', () => {
    const markup = html(ResultsScreen, compareOpen(passedV02))
    expect(compareRows(markup)).toEqual([
      ['v0.1 · Failed evaluation', 'v0.2 · Passed evaluation'],
      ['21 Passed', '22 Passed'],
      ['6 Passed — Expected Safe Escalation', '6 Passed — Expected Safe Escalation'],
      ['1 Failed', '0 Failed'],
      ['27/28 intended outcomes correct', '28/28 intended outcomes correct'],
      ['variance_exactly_2.00pctFailed · Expected: accept · Actual: escalate', 'variance_exactly_2.00pctPassed · Expected: accept · Actual: accept'],
      ['≥ 2.00% requires approval', '> 2.00% requires approval'],
    ])
    expect(openingTag(markup, 'equality-row')).toContain('data-verdicts="failed/passed"')
    expect(openingTag(markup, 'version-compare')).toContain('data-view="evaluated"')
  })

  test('the comparison does not change what v0.1 recorded', () => {
    const before = compareRows(html(ResultsScreen, compareOpen(failedV01)))
    const after = compareRows(html(ResultsScreen, compareOpen(passedV02)))
    for (const row of [0, 1, 2, 3, 4, 5, 6]) expect(after[row]?.[0]).toBe(before[row]?.[0])
  })

  test('the comparison needs a completed evaluation to open', () => {
    expect(() => run(started, { type: 'SET_COMPARE', open: true })).toThrow(/no completed evaluation/i)
  })
})

describe('SC20 v0.2 result', () => {
  const markup = html(ResultsScreen, passedV02)

  test('reports 22 Passed, 6 Passed — Expected Safe Escalation, 0 Failed and 28/28 intended outcomes correct', () => {
    const results = text(elementOf(markup, 'results'))
    expect(results).toContain('22 Passed')
    expect(results).toContain('6 Passed — Expected Safe Escalation')
    expect(results).toContain('0 Failed')
    expect(results).toContain('28/28 intended outcomes correct')
    expect(plain(markup)).toContain('v0.2 · Run complete · 28 of 28 run')
  })

  test('the tiles sum to 28 with no failure, and SCN-022 now passes', () => {
    expect(tally(markup, 'passed')).toBe(22)
    expect(tally(markup, 'safeEscalation')).toBe(6)
    expect(tally(markup, 'failed')).toBe(0)
    expect(tileTag(markup, BOUNDARY)).toContain('data-state="passed"')
    expect(elementOf(markup, 'results')).not.toContain('text-danger')
    expect(elementOf(html(ResultsScreen, failedV01), 'results')).toContain('text-danger')
  })

  test('nothing is left to rerun, nothing is failed to inspect and there is no cyan', () => {
    expect(disabled(markup, 'rerun')).toBe(true)
    expect(text(elementOf(markup, 'result-detail'))).toContain('No failed scenarios.')
    expect(markup).not.toMatch(CYAN)
  })

  test('the replay for v0.2 shows what it actually did: accept, with no failure mark', () => {
    const open = html(ResultsScreen, replayOpen(passedV02))
    const replay = elementOf(open, 'replay')
    for (const expected of ['SCN-022 · v0.2 · Passed', 'Expected: accept', 'Actual · v0.2', 'Actual: accept']) expect(text(replay)).toContain(expected)
    expect(text(replay)).not.toContain('Actual: escalate')
    expect(replay).not.toContain('text-danger')
  })

  test('v0.2 is never reported as escalating SCN-022, in any state of the page', () => {
    for (const state of [passedV02, selected(passedV02, BOUNDARY), replayOpen(passedV02), compareOpen(selected(passedV02, BOUNDARY))]) {
      expect(text(withoutV01Column(html(ResultsScreen, state)))).not.toContain('Actual: escalate')
    }
  })

  test('the rule drawer opened over v0.2 does not report escalate as the actual result', () => {
    expect(text(elementOf(html(ResultsScreen, ruleOpen(passedV02)), 'rule-drawer'))).not.toContain('Actual: escalate')
  })
})
