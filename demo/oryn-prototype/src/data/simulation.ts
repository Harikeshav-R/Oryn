import type { StatusId } from './status'

/**
 * DAT-05 base suite SIM-AP-RECON (28 scenarios) and the pure run sampler for CMP-14.
 * Verdicts are fixture rows: v0.1 fails SCN-022, v0.2 passes it. A verdict is read only
 * from a completed run; an unfinished or cancelled scenario is never a pass.
 */
export const SUITE_ID = 'SIM-AP-RECON'
export const SUITE_SIZE = 28

export type Verdict = Extract<StatusId, 'passed' | 'safeEscalation' | 'failed'>

export interface Scenario {
  readonly id: string
  readonly name: string
  readonly v01: Verdict
  readonly v02: Verdict
}

const P = 'passed' as const
const S = 'safeEscalation' as const

const ORDINARY: readonly [string, string][] = [
  ['SCN-001', 'Exact invoice/PO match; stage and verify'],
  ['SCN-002', 'Brightwater ordinary invoice; match'],
  ['SCN-003', 'Copperline ordinary invoice; match'],
  ['SCN-004', 'Northgate ordinary invoice; match'],
  ['SCN-005', 'Orchard Lane ordinary invoice; match'],
  ['SCN-006', 'Harlow ordinary invoice; match'],
  ['SCN-007', 'Vantage ordinary invoice; match'],
  ['SCN-008', 'Meadowbrook ordinary invoice; match'],
  ['SCN-009', 'Approved vendor and matching PO reference; match'],
  ['SCN-010', 'Invoice lines in different order; verify total'],
  ['SCN-011', 'Invoice has multiple matching lines; verify total'],
  ['SCN-012', 'Zero variance, two-decimal formatting; match'],
  ['SCN-013', 'Case-insensitive PO prefix; identify approved record'],
  ['SCN-014', 'Approved invoice date; match'],
  ['SCN-015', 'Existing tax amount covered by PO; match'],
  ['SCN-016', 'Approved handling line covered by terms; match'],
  ['SCN-017', 'Variance below threshold; accept within match'],
  ['SCN-018', 'Variance one cent below threshold; accept within match'],
  ['SCN-019', 'Negative variance within threshold; accept within match'],
  ['SCN-020', 'Already matched record with evidence; avoid duplicate write'],
  ['SCN-021', 'Verification readback matches staged values; verified complete'],
]

const ESCALATIONS: readonly [string, string][] = [
  ['SCN-023', 'Missing PO, Ironbark; escalate'],
  ['SCN-024', 'Missing PO, Sable; escalate'],
  ['SCN-025', 'Duplicate invoice; stop and escalate'],
  ['SCN-026', 'Variance above 2.00%; request Tier 3 approval'],
  ['SCN-027', 'ERP submit timeout; hold Outcome Unknown, do not resubmit'],
  ['SCN-028', 'Unreadable PDF; stop and escalate'],
]

export const SCENARIOS: readonly Scenario[] = Object.freeze([
  ...ORDINARY.map(([id, name]) => Object.freeze({ id, name, v01: P, v02: P })),
  Object.freeze({ id: 'SCN-022', name: 'Exact 2.00%; auto-accept within match', v01: 'failed' as const, v02: P }),
  ...ESCALATIONS.map(([id, name]) => Object.freeze({ id, name, v01: S, v02: S })),
].sort((a, b) => a.id.localeCompare(b.id)))

export const BOUNDARY_REPLAY = Object.freeze({
  scenarioId: 'SCN-022',
  key: 'variance_exactly_2.00pct',
  expected: 'accept',
  actualV01: 'escalate',
  correctedComparison: '> 2.00% requires approval',
} as const)

/**
 * The six expected safe escalations by the short name the Flight Simulator lists (inventory SC19): `Missing Purchase
 * Order` twice (SCN-023 Ironbark, SCN-024 Sable), `Duplicate invoice`, `Over-threshold variance`, `ERP timeout`,
 * `Unreadable PDF`. Each is an intended pass: stopping is the correct outcome.
 */
export const SAFE_CASES = Object.freeze([
  { id: 'SCN-023', label: 'Missing Purchase Order' },
  { id: 'SCN-024', label: 'Missing Purchase Order' },
  { id: 'SCN-025', label: 'Duplicate invoice' },
  { id: 'SCN-026', label: 'Over-threshold variance' },
  { id: 'SCN-027', label: 'ERP timeout' },
  { id: 'SCN-028', label: 'Unreadable PDF' },
] as const)

/** Name a scenario carries on screen: SCN-022 is the boundary scenario and is named by its key. */
export const scenarioTitle = (scenario: Scenario): string => (scenario.id === BOUNDARY_REPLAY.scenarioId ? BOUNDARY_REPLAY.key : scenario.name)

/**
 * The equality comparator each version applies to SCN-022 (storyboard L-101). v0.1 treats exactly 2.00% as above the
 * threshold and escalates; v0.2 follows AP-RULE-009: only a variance strictly above 2.00% requires approval.
 */
export const COMPARATORS = Object.freeze({
  'v0.1': '≥ 2.00% requires approval',
  'v0.2': BOUNDARY_REPLAY.correctedComparison,
} as const)

/**
 * The simulator's category chips. The 21 ordinary cases and the boundary case are `Normal`; the two safe stops that
 * depend on a threshold or the ERP are `Edge`; the four stops caused by absent or unusable input are `Negative`.
 * Edge plus Negative is the six expected safe escalations, the count the release gate asks for.
 */
export const CATEGORIES = Object.freeze([
  { id: 'normal', label: 'Normal', count: 22 },
  { id: 'edge', label: 'Edge', count: 2 },
  { id: 'negative', label: 'Negative', count: 4 },
] as const)

export type SuiteVersion = 'v0.1' | 'v0.2'

export function verdictOf(scenario: Scenario, version: SuiteVersion): Verdict {
  return version === 'v0.1' ? scenario.v01 : scenario.v02
}

export interface SuiteTotals {
  passed: number
  safeEscalation: number
  failed: number
}

export function suiteTotals(version: SuiteVersion): SuiteTotals {
  const totals: SuiteTotals = { passed: 0, safeEscalation: 0, failed: 0 }
  for (const scenario of SCENARIOS) totals[verdictOf(scenario, version)] += 1
  return totals
}

/** Frame events for one run. A run starts once and ends by cancel or complete. */
export type RunEvent = { frame: number; type: 'start' | 'cancel' | 'complete' }

export type RunPhase = 'notStarted' | 'running' | 'complete' | 'cancelled'

export interface RunSample {
  phase: RunPhase
  /** Scenarios executed so far, 0..28. */
  executed: number
  /** Fraction of the suite executed, 0..1. Exactly 1 only after a complete event. */
  progress: number
  /** True only between start and the terminal event. Drives every arc-cyan element. */
  running: boolean
}

/** Frames the runner takes to execute the suite once started (3 s at 30 fps in the specimen). */
export const RUN_FRAMES = 90

/**
 * Scenarios executed, with the fraction of the one in progress, `elapsed` frames after a run began when the run
 * takes `runFrames`. A run still in progress stays below 28: the suite is whole only after a complete event.
 */
export const positionAfter = (elapsed: number, runFrames: number = RUN_FRAMES): number =>
  Math.min(SUITE_SIZE - 0.001, Math.max(0, (elapsed / runFrames) * SUITE_SIZE))

/** Whole scenarios executed after `elapsed` frames: at most 27 of 28 until a complete event. */
export const executedAfter = (elapsed: number, runFrames: number = RUN_FRAMES): number => Math.floor(positionAfter(elapsed, runFrames))

/**
 * Pure function of the events and the frame, so a seek lands on the same sample every
 * time, forward or backward. Progress ramps linearly from start but cannot reach the whole
 * suite until a complete event: running is capped at 27 of 28. Cancel freezes the executed
 * count at the cancel frame and never produces a pass.
 */
export function sampleRun(events: readonly RunEvent[], frame: number, runFrames: number = RUN_FRAMES): RunSample {
  const ordered = [...events].sort((a, b) => a.frame - b.frame)
  const start = ordered.find((event) => event.type === 'start')
  if (!start || frame < start.frame) return { phase: 'notStarted', executed: 0, progress: 0, running: false }

  const end = ordered.find((event) => event.type !== 'start' && event.frame >= start.frame)
  const rampAt = (at: number) => executedAfter(at - start.frame, runFrames)

  if (end && frame >= end.frame) {
    if (end.type === 'complete') return { phase: 'complete', executed: SUITE_SIZE, progress: 1, running: false }
    const executed = rampAt(end.frame)
    return { phase: 'cancelled', executed, progress: executed / SUITE_SIZE, running: false }
  }
  const executed = rampAt(frame)
  return { phase: 'running', executed, progress: executed / SUITE_SIZE, running: true }
}
