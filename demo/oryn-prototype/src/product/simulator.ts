import { BOUNDARY_REPLAY, SCENARIOS, SUITE_ID, SUITE_SIZE, positionAfter, verdictOf } from '@/data/simulation'
import type { Scenario, SuiteVersion, Verdict } from '@/data/simulation'
import { STATUS_META } from '@/data/status'
import { person, runSummary } from '@/state'
import type { Action, EvaluationRun, EvaluationVersionId, State } from '@/state'
import { PLAYBOOK } from '@/data/playbook'
import type { ProductProps } from './contract'
import { roleOf } from './destinations'
import { refusal } from './discovery'
import type { Access } from './discovery'
import { STREAM_ROW } from './simulator-layout'

/**
 * View decisions shared by SC19 and SC20. Everything is a pure function of the reducer state and the
 * film frame: a verdict is read only from a completed run, an unfinished or cancelled scenario is
 * never a pass, and the tiles of a version are exactly its own run's. Access grants nothing (RT-02):
 * every disabled control repeats the reducer's own refusal.
 */

export type SimPhase = 'idle' | 'running' | 'cancelled' | 'complete'

/** The simulator and its results are run by the Workflow Owner. Access decides what a viewpoint sees and grants nothing. */
export function simulatorAccess(state: State): Access {
  return roleOf(state) === 'Workflow Owner' ? { ok: true } : { ok: false, reason: `The Flight Simulator is run by the Workflow Owner, ${person(PLAYBOOK.ownerId).name}.` }
}

export interface SimView {
  readonly phase: SimPhase
  /** The version the screen shows and the next run binds to. */
  readonly version: SuiteVersion
  /** Scenarios executed so far: 0 to 27 while running or cancelled, 28 once complete. */
  readonly executed: number
  /** `executed` plus the fraction of the scenario in progress: what the bar and the stream follow. */
  readonly position: number
}

export const versionOf = (id: EvaluationVersionId): SuiteVersion => (id === 'agent-v0.2' ? 'v0.2' : 'v0.1')

/** Runs of the sealed suite, oldest first. The repair regression (SIM-AP-RECON-34) is another suite and never shown here. */
export const suiteRuns = (state: State): readonly EvaluationRun[] => state.evaluations.filter((run) => run.suiteId === SUITE_ID)

/** Frames since the run began, including the lead a continuing film declares. */
function elapsedFrames(props: ProductProps, run: EvaluationRun): number {
  const { state, film } = props
  const lead = state.ui.simulator.runLead
  if (!film) return (props.runFrame ?? 0) + lead
  const start = Math.max(film.lastApplied('RUN_SIMULATION') ?? 0, film.lastApplied('FIX_AND_RUN') ?? 0)
  const end = run.status === 'cancelled' ? (film.lastApplied('CANCEL_SIMULATION') ?? film.frame) : film.frame
  return Math.max(0, end - start) + lead
}

/**
 * What SC19 shows. After a failed v0.1 (ST08) the corrected v0.2 is the next run: the screen is idle on
 * it, so the run control binds to v0.2 and none of v0.1's verdicts is carried across.
 */
export function simView(props: ProductProps): SimView {
  const { state } = props
  if (state.phase === 'ST08') return { phase: 'idle', version: 'v0.2', executed: 0, position: 0 }
  const run = suiteRuns(state).at(-1)
  if (!run) return { phase: 'idle', version: state.agent.versions.includes('agent-v0.2') ? 'v0.2' : 'v0.1', executed: 0, position: 0 }
  const version = versionOf(run.versionId)
  if (run.status === 'complete') return { phase: 'complete', version, executed: SUITE_SIZE, position: SUITE_SIZE }
  const position = positionAfter(elapsedFrames(props, run), state.ui.simulator.runFrames)
  return { phase: run.status, version, executed: Math.floor(position), position }
}

export type TileKind = 'notRun' | 'executed' | 'running' | Verdict

/** The state of the `index`-th scenario. Verdicts appear only on a complete run. */
export function tileKind(view: SimView, index: number): TileKind {
  if (view.phase === 'complete') return verdictOf(SCENARIOS[index] as Scenario, view.version)
  if (view.phase === 'running' && index === view.executed) return 'running'
  if ((view.phase === 'running' || view.phase === 'cancelled') && index < view.executed) return 'executed'
  return 'notRun'
}

export const tileLabel = (kind: TileKind): string => (kind === 'notRun' ? 'Not Run' : kind === 'executed' ? 'Executed' : STATUS_META[kind].label)

/** Frame that drives the running glyph: the film's, or the clickable app's run clock. */
export const glyphFrame = (props: ProductProps): number => props.film?.frame ?? props.runFrame ?? 0

/** The row stream follows the scenario in progress: it keeps that row about a third of the way down the viewport, and rests at the top once complete. */
export function streamOffset(view: SimView, viewport: number): number {
  if (view.phase === 'complete') return 0
  const total = SCENARIOS.length * STREAM_ROW
  return Math.min(Math.max(0, STREAM_ROW * view.position - viewport / 2.8), Math.max(0, total - viewport))
}

/** The one guarded run action: after a failed v0.1 it creates and runs v0.2, otherwise it runs the candidate. */
export const runAction = (state: State): Action => (state.phase === 'ST08' ? { type: 'FIX_AND_RUN' } : { type: 'RUN_SIMULATION' })

/** Why the run control is unavailable, or null. */
export const runBlock = (state: State): string | null => refusal(state, runAction(state))

/** Why Cancel is unavailable, or null. */
export const cancelBlock = (state: State): string | null => refusal(state, { type: 'CANCEL_SIMULATION' })

export interface ResultView {
  readonly run: EvaluationRun
  readonly version: SuiteVersion
  readonly passed: number
  readonly safeEscalation: number
  readonly failed: number
  /** Passed plus expected safe escalations: the intended outcomes the version got right. */
  readonly correct: number
}

function viewOf(run: EvaluationRun): ResultView {
  const summary = runSummary(run)
  return { run, version: versionOf(run.versionId), passed: summary.passed, safeEscalation: summary.safeEscalation, failed: summary.failed, correct: summary.passed + summary.safeEscalation }
}

/** The run SC20 reports: the newest completed run of the sealed suite. */
export function resultView(state: State): ResultView | undefined {
  const run = suiteRuns(state).filter((candidate) => candidate.status === 'complete').at(-1)
  return run ? viewOf(run) : undefined
}

/** The newest completed run of one version, or undefined when that version has not been evaluated. */
export function versionResult(state: State, version: SuiteVersion): ResultView | undefined {
  const run = suiteRuns(state).filter((candidate) => candidate.status === 'complete' && versionOf(candidate.versionId) === version).at(-1)
  return run ? viewOf(run) : undefined
}

export const scenarioById = (id: string | null): Scenario | undefined => SCENARIOS.find((scenario) => scenario.id === id)

/** SCN-022's replay for a version: what the scenario expected and what that version did. */
export function replayOf(version: SuiteVersion): { readonly expected: string; readonly actual: string } {
  return { expected: BOUNDARY_REPLAY.expected, actual: version === 'v0.1' ? BOUNDARY_REPLAY.actualV01 : BOUNDARY_REPLAY.expected }
}
