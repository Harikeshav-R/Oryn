import { UNKNOWN_INVOICE, type JobCounts } from '@/data/approval'
import { AUDIT_EVENTS, type AuditEvent } from '@/data/audit'
import { COMMITMENT } from '@/data/commitment'
import { captureBlock } from '@/data/consent'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { GATE } from '@/data/gate'
import { INCIDENT } from '@/data/incident'
import { JOB_ID } from '@/data/invoices'
import { NOTIFICATIONS, isNotificationEligible, selectNotification, type NotificationId, type NotificationTarget } from '@/data/notifications'
import { PEOPLE, TEAM, type Person, type PersonId } from '@/data/people'
import { POLICY_IMPACT } from '@/data/policy-impact'
import { REGRESSION_CASES, REGRESSION_SUITE_ID } from '@/data/regression'
import { SCENARIOS } from '@/data/simulation'
import { authorize } from './permissions'
import { phaseIndex } from './states'
import { COMMITMENT_SUPPLIER } from '@/data/work-records'
import type { DemonstrationId, EmployeeId, EvaluationRun, EvaluationVersionId, HudKind, ScenarioVerdict, State } from './types'
import { EMPLOYEE_IDS } from './types'

/** RT-01 selectors. Pure functions of state; no counter is stored anywhere. */

export const MIN_CORRECT_SCENARIOS = 25
export const MIN_EDGE_SCENARIOS = 5
export const REGRESSION_SIZE = SCENARIOS.length + REGRESSION_CASES.length

export const isEmployee = (id: PersonId): id is EmployeeId => (EMPLOYEE_IDS as readonly string[]).includes(id)

export function person(id: PersonId): Person {
  const found = PEOPLE.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Unknown person fixture ${id}`)
  return found
}

// -- evaluations -------------------------------------------------------------------------

export interface RunSummary {
  readonly complete: boolean
  readonly passed: number
  readonly safeEscalation: number
  readonly failed: number
  /** Scenarios of the suite without a verdict (not run, running or cancelled). */
  readonly notRun: number
}

export function latestRun(state: State, versionId?: EvaluationVersionId): EvaluationRun | undefined {
  for (let i = state.evaluations.length - 1; i >= 0; i -= 1) {
    const run = state.evaluations[i]
    if (run && (versionId === undefined || run.versionId === versionId)) return run
  }
  return undefined
}

export function latestCompleteRun(state: State, versionId: EvaluationVersionId): EvaluationRun | undefined {
  return [...state.evaluations].reverse().find((run) => run.versionId === versionId && run.status === 'complete')
}

export function suiteSize(run: Pick<EvaluationRun, 'suiteId'>): number {
  return run.suiteId === REGRESSION_SUITE_ID ? REGRESSION_SIZE : SCENARIOS.length
}

export function runSummary(run: EvaluationRun): RunSummary {
  let passed = 0
  let safeEscalation = 0
  let failed = 0
  for (const result of run.results) {
    if (result.verdict === 'passed') passed += 1
    else if (result.verdict === 'safeEscalation') safeEscalation += 1
    else failed += 1
  }
  return { complete: run.status === 'complete', passed, safeEscalation, failed, notRun: suiteSize(run) - run.results.length }
}

export type SuiteVerdict = ScenarioVerdict | 'notRun'

/**
 * Per-scenario verdicts of the latest run of a version. Only a completed run carries
 * verdicts: running and cancelled runs, and versions never run, show every scenario as
 * `notRun`. An unfinished scenario is never a pass.
 */
export function suiteVerdicts(state: State, versionId?: EvaluationVersionId): readonly { readonly id: string; readonly verdict: SuiteVerdict }[] {
  const run = versionId === undefined ? latestRun(state) : latestRun(state, versionId)
  const ids = run?.suiteId === REGRESSION_SUITE_ID
    ? [...SCENARIOS.map((scenario) => scenario.id), ...REGRESSION_CASES.map((scenario) => scenario.id)]
    : SCENARIOS.map((scenario) => scenario.id)
  const results = new Map(run?.status === 'complete' ? run.results.map((result) => [result.id, result.verdict]) : [])
  return ids.map((id) => ({ id, verdict: results.get(id) ?? 'notRun' }))
}

export function regressionVerdict(state: State): 'notRun' | 'running' | 'cancelled' | 'passed' | 'failed' {
  const run = [...state.evaluations].reverse().find((candidate) => candidate.suiteId === REGRESSION_SUITE_ID)
  if (!run) return 'notRun'
  if (run.status !== 'complete') return run.status
  return regressionPasses(run) ? 'passed' : 'failed'
}

/** 34 completed intended outcomes (28 passed + 6 safe escalations) and no failure. */
export function regressionPasses(run: EvaluationRun | undefined): boolean {
  if (!run || run.suiteId !== REGRESSION_SUITE_ID || run.status !== 'complete') return false
  const summary = runSummary(run)
  return summary.failed === 0 && summary.notRun === 0 && summary.passed + summary.safeEscalation === REGRESSION_SIZE
}

// -- release gate ------------------------------------------------------------------------

export function exampleCount(state: State): number {
  const reviewed = DEMONSTRATIONS.filter((demo) => state.demonstrations[demo.id] === 'approved').length
  return reviewed + GATE.archivedSmeVerified
}

export interface GateCheck {
  readonly id: 'examples' | 'scenarios' | 'edgeCases' | 'ownerApproval' | 'scopeConfirmation' | 'authorization'
  readonly label: string
  readonly met: boolean
  /** Why the check is not met (empty when met). */
  readonly detail: string
}

/** The v0.2 evaluation is the one that counts for release; v0.1's failure never does. */
function releaseEvaluation(state: State): { correct: number; edge: number } {
  const run = latestCompleteRun(state, 'agent-v0.2')
  if (!run) return { correct: 0, edge: 0 }
  const summary = runSummary(run)
  return { correct: summary.passed + summary.safeEscalation, edge: summary.safeEscalation }
}

/** CMP-23: only independently evidenced checks are met; the rest stay pending. */
export function gateChecks(state: State, actorId: PersonId = state.actorId): readonly GateCheck[] {
  const examples = exampleCount(state)
  const evaluation = releaseEvaluation(state)
  const auth = authorize(state, { actorId, action: 'start-job', tier: 2, object: JOB_ID, scope: TEAM })
  const scenariosMet = evaluation.correct >= MIN_CORRECT_SCENARIOS
  return [
    {
      id: 'examples',
      label: `${examples}/${GATE.required} verified human examples`,
      met: examples >= GATE.required,
      detail: examples >= GATE.required ? '' : `Needs ${GATE.required} verified human examples; ${examples} are verified.`,
    },
    {
      id: 'scenarios',
      label: `${evaluation.correct}/${MIN_CORRECT_SCENARIOS} representative scenarios`,
      met: scenariosMet,
      detail: scenariosMet ? '' : `Needs at least ${MIN_CORRECT_SCENARIOS} correct scenarios from a completed v0.2 evaluation; ${evaluation.correct} are verified.`,
    },
    {
      id: 'edgeCases',
      label: `${evaluation.edge}/${MIN_EDGE_SCENARIOS} edge/negative`,
      met: evaluation.edge >= MIN_EDGE_SCENARIOS,
      detail: evaluation.edge >= MIN_EDGE_SCENARIOS ? '' : `Needs at least ${MIN_EDGE_SCENARIOS} edge/negative scenarios; ${evaluation.edge} are verified.`,
    },
    {
      id: 'ownerApproval',
      label: 'Owner approval',
      met: state.agent.releaseApproved,
      detail: state.agent.releaseApproved ? '' : 'The workflow owner has not approved this release.',
    },
    {
      id: 'scopeConfirmation',
      label: 'Scope confirmation',
      met: state.agent.scopeConfirmed,
      detail: state.agent.scopeConfirmed ? '' : `Scope ${TEAM} is not confirmed.`,
    },
    {
      id: 'authorization',
      label: 'Action authorization',
      met: auth.allowed,
      detail: auth.allowed ? '' : auth.reason,
    },
  ]
}

export function gateSatisfied(state: State, actorId: PersonId = state.actorId): boolean {
  return gateChecks(state, actorId).every((check) => check.met)
}

// -- job ---------------------------------------------------------------------------------

export interface JobCountsView extends JobCounts {
  /** Cases not yet evaluated. verified + escalated + approval + unknown + queued = total. */
  readonly queued: number
  readonly total: number
}

export function jobCounts(state: State): JobCountsView {
  const view = { verified: 0, escalated: 0, approval: 0, unknown: 0, queued: 0 }
  for (const outcome of Object.values(state.job.outcomes)) {
    if (outcome === 'verified') view.verified += 1
    else if (outcome === 'escalated') view.escalated += 1
    else if (outcome === 'approval') view.approval += 1
    else if (outcome === 'unknown') view.unknown += 1
    else if (outcome === 'queued') view.queued += 1
  }
  return { ...view, total: Object.keys(state.job.outcomes).length }
}

export type JobLabel = 'Not started' | 'Queued' | 'Running' | 'Partially Complete'

/** `Partially Complete` while INV-48220 is held; `Completed with exceptions` is never used. */
export function jobLabel(state: State): JobLabel {
  if (state.job.status === 'notStarted') return 'Not started'
  if (state.job.status === 'running') return jobCounts(state).queued === jobCounts(state).total ? 'Queued' : 'Running'
  return 'Partially Complete'
}

export interface UnknownCaseView {
  readonly invoice: string
  readonly outcome: 'Outcome Unknown'
  readonly held: boolean
  readonly resubmission: 'Resubmission unavailable'
}

/** The held-unknown case. It is never retried: no action can resubmit it. */
export function unknownCase(state: State): UnknownCaseView | null {
  if (state.job.outcomes[UNKNOWN_INVOICE.invoice] !== 'unknown') return null
  return { invoice: UNKNOWN_INVOICE.invoice, outcome: 'Outcome Unknown', held: true, resubmission: 'Resubmission unavailable' }
}

export function isRunning(state: State): boolean {
  return state.running.simulation || state.running.job || state.running.regression
}

// -- actor and observation --------------------------------------------------------------

export interface CurrentRole {
  readonly personId: PersonId
  readonly name: string
  readonly title: string
  readonly role: Person['role']
  /** `Daniel Okafor · Tier 3` only while a valid Tier 3 delegation is held. */
  readonly authorityLabel: string | null
}

export function currentRole(state: State): CurrentRole {
  const actor = person(state.actorId)
  const tier3 = state.authority.grants.some((grant) => grant.holderId === actor.id && grant.maxTier === 3 && grant.status === 'valid')
  return { personId: actor.id as PersonId, name: actor.name, title: actor.title, role: actor.role, authorityLabel: tier3 ? `${actor.name} \u00b7 Tier 3` : null }
}

/** Capture runs from ST02 on, for a person whose own notice, category and pause allow it. */
export function observationActive(state: State, personId: EmployeeId): boolean {
  const consent = state.consent[personId]
  return phaseIndex(state.phase) >= phaseIndex('ST02') && !consent.noticeDeclined && captureBlock(consent) === null
}

/** The recording indicator needs capture AND the separate per-meeting consent. */
export function recordingActive(state: State, personId: EmployeeId): boolean {
  return observationActive(state, personId) && state.consent[personId].meetings['zoom-kestrel'] === 'granted'
}

// -- notifications -----------------------------------------------------------------------

const NOTIFICATION_ACCESS: Readonly<Record<'daniel' | 'marcus' | 'priya', readonly NotificationTarget[]>> = {
  daniel: ['INV-48219'],
  marcus: ['INC-0042', 'REP-0042-1', 'v1.1-limited-cohort'],
  priya: ['kestrel-commitment'],
}

function notificationEligibility(state: State, viewerId: PersonId) {
  const recipient = viewerId === 'daniel' || viewerId === 'marcus' || viewerId === 'priya' ? viewerId : null
  if (recipient === null) return null
  return {
    recipient,
    approvalRequired: phaseIndex(state.phase) >= phaseIndex('ST11') && state.approval.decision === 'pending',
    incidentContained: state.incident.status === 'contained' || state.incident.status === 'closed',
    commitmentConfirmed: state.commitment.status === 'confirmed',
    regressionPassed: regressionVerdict(state) === 'passed',
    releaseAuthorized: state.release.stage !== 'none',
    canAccess: (target: NotificationTarget) => NOTIFICATION_ACCESS[recipient].includes(target),
    dismissed: state.notificationsDismissed,
  }
}

/** Notices the viewer may see now: right recipient, lifecycle reached, object readable. */
export function visibleNotifications(state: State, viewerId: PersonId = state.actorId): readonly NotificationId[] {
  const eligibility = notificationEligibility(state, viewerId)
  if (eligibility === null) return []
  return (Object.keys(NOTIFICATIONS) as NotificationId[]).filter((id) => isNotificationEligible(id, eligibility))
}

/** One toast at a time, never a stack. */
export function activeNotification(state: State, viewerId: PersonId = state.actorId): NotificationId | undefined {
  const eligibility = notificationEligibility(state, viewerId)
  return eligibility === null ? undefined : selectNotification(eligibility)
}

/**
 * The lifecycle event behind a notice has happened. This is neither recipient access, nor reading, nor dismissal:
 * N-04 exists only after the regression passed and N-05 only after the limited release was authorized (DAT-10).
 * An approval notice stays occurred after the decision (it is resolved, not removed).
 */
export function noticeOccurred(state: State, id: NotificationId): boolean {
  switch (id) {
    case 'N-01':
      return phaseIndex(state.phase) >= phaseIndex('ST11')
    case 'N-02':
      return state.incident.status === 'contained' || state.incident.status === 'closed'
    case 'N-03':
      return state.commitment.status === 'confirmed'
    case 'N-04':
      return regressionVerdict(state) === 'passed'
    case 'N-05':
      return state.release.stage !== 'none'
  }
}

// -- evidence ----------------------------------------------------------------------------

export interface EvidenceItem {
  readonly id: string
  readonly kind: 'rawCapture' | 'meetingCapture' | 'sanitizedDemonstration' | 'commitment' | 'caseEvidence' | 'incidentEvidence'
  readonly label: string
  /** Whose capture it is, for raw capture. Raw capture is visible to its owner only. */
  readonly ownerId: EmployeeId | null
}

/**
 * Role-specific evidence. Raw private capture stays local: only its owner sees it, and only
 * while their own observation is active. Another employee, the workflow owner and the
 * Admin never do, whatever role is selected. Sanitized and case evidence follow
 * object-level access, not the role label.
 */
export function accessibleEvidence(state: State, viewerId: PersonId = state.actorId): readonly EvidenceItem[] {
  const items: EvidenceItem[] = []
  for (const demo of DEMONSTRATIONS) {
    const owner = demo.contributorId as EmployeeId
    if (viewerId === owner && observationActive(state, owner)) {
      items.push({ id: `raw-${demo.id}`, kind: 'rawCapture', label: `${demo.id} raw capture (local only)`, ownerId: owner })
    }
    const reviewed = state.demonstrations[demo.id as DemonstrationId] === 'approved'
    if (reviewed && (viewerId === owner || viewerId === 'marcus')) {
      items.push({ id: demo.id, kind: 'sanitizedDemonstration', label: `${demo.id} sanitized Demonstration`, ownerId: null })
    }
  }
  if (viewerId === 'priya' && recordingActive(state, 'priya')) {
    items.push({ id: 'raw-zoom-kestrel', kind: 'meetingCapture', label: `${COMMITMENT.source} meeting capture (local only)`, ownerId: 'priya' })
  }
  if (viewerId === 'priya' && state.commitment.status === 'confirmed') {
    items.push({ id: COMMITMENT.id, kind: 'commitment', label: COMMITMENT.title, ownerId: null })
  }
  if (phaseIndex(state.phase) >= phaseIndex('ST11') && (viewerId === 'daniel' || viewerId === 'marcus')) {
    items.push({ id: 'INV-48219', kind: 'caseEvidence', label: 'INV-48219 approval evidence', ownerId: null })
    items.push({ id: 'INV-48220', kind: 'caseEvidence', label: 'INV-48220 unknown-outcome evidence', ownerId: null })
  }
  if (state.incident.status !== 'none' && (viewerId === 'marcus' || viewerId === 'elena')) {
    for (const evidence of INCIDENT.evidence) {
      items.push({ id: evidence.id, kind: 'incidentEvidence', label: `${evidence.id} ${evidence.description}`, ownerId: null })
    }
  }
  return items
}

// -- audit and policy --------------------------------------------------------------------

/** Ordered, immutable facts up to now. Future events are absent, not hidden. */
export function auditSlice(state: State): readonly AuditEvent[] {
  return AUDIT_EVENTS.filter((event) => state.audit.includes(event.id))
}

export interface PolicyImpactView {
  readonly status: typeof POLICY_IMPACT.status
  readonly playbooks: number
  readonly agents: number
  readonly tests: number
}

/** DAT-09 impact, present only once the policy change is marked at ST19. */
export function policyImpact(state: State): PolicyImpactView | null {
  if (!state.policy.revalidationMarked) return null
  const count = (kind: 'playbook' | 'agent' | 'tests') => POLICY_IMPACT.dependencies.find((dependency) => dependency.kind === kind)?.count ?? 0
  return { status: POLICY_IMPACT.status, playbooks: count('playbook'), agents: count('agent'), tests: count('tests') }
}

/** Reason text for a Tier 3 action the viewer cannot take, or null when authorized. */
export function approvalBlock(state: State, actorId: PersonId = state.actorId): string | null {
  const decision = authorize(state, { actorId, action: 'approve-variance', tier: 3, object: 'INV-48219', scope: TEAM })
  return decision.allowed ? null : decision.reason
}

// -- SC04 contextual card ---------------------------------------------------------------

/** Routes whose screen is the desktop with the work applications. */
const WORK_ROUTES: readonly State['route'][] = ['SC04', 'SC05', 'SC06', 'SC07', 'SC08', 'SC09']

/**
 * The one SC04 card that shows now, or null. The peer fix belongs to route SC04 and the NetSuite
 * context; the commitment reminder needs the confirmed commitment AND the Kestrel vendor record
 * open in NetSuite. A dismissed kind stays hidden until its own context is opened again. The
 * reminder reads `commitment.confirmedDue`, never the draft or the earlier proposal.
 */
export function hudKind(state: State): HudKind | null {
  const { ui, route } = state
  if (ui.activeTab !== 'netsuite' || !WORK_ROUTES.includes(route)) return null
  if (route === 'SC04') return ui.app.hud.dismissed.includes('peerFix') ? null : 'peerFix'
  const reminder = ui.app.erp === 'vendor' && ui.app.vendor === COMMITMENT_SUPPLIER && state.commitment.status === 'confirmed'
  return reminder && !ui.app.hud.dismissed.includes('commitment') ? 'commitment' : null
}
