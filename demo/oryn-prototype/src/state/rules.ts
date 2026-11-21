import { APPROVAL_INVOICE, UNKNOWN_INVOICE } from '@/data/approval'
import { AUDIT_EVENTS } from '@/data/audit'
import { CAPTURE_BLOCK_TEXT, captureBlock } from '@/data/consent'
import { COMMITMENT } from '@/data/commitment'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { INCIDENT, REPAIR } from '@/data/incident'
import { INVOICE_CASES, JOB_ID } from '@/data/invoices'
import { NOTIFICATIONS } from '@/data/notifications'
import { CAPABILITY_MATRIX } from '@/data/capabilities'
import { OPERATIONS_NODES } from '@/data/operations-graph'
import { PEOPLE, SUPPLIERS, TEAM } from '@/data/people'
import { REGRESSION_CASES, REGRESSION_SUITE_ID } from '@/data/regression'
import { BOUNDARY_REPLAY, SCENARIOS, SUITE_ID, SUITE_SIZE, verdictOf } from '@/data/simulation'
import { AGENT_DEFINITION } from '@/data/versions'
import { COMMITMENT_SUPPLIER } from '@/data/work-records'
import { createInitialState } from './initial'
import {
  AGENT_NAME,
  AGENT_V10_OBJECT,
  AGENT_V11_OBJECT,
  AUDIT_PACK_OBJECT,
  COPY,
  KESTREL_SCOPE,
  authorize,
  exceedsThreshold,
  thresholdHundredths,
} from './permissions'
import {
  REGRESSION_SIZE,
  gateChecks,
  hudKind,
  isEmployee,
  latestRun,
  noticeOccurred,
  person,
  recordingActive,
  regressionPasses,
  runSummary,
} from './selectors'
import { SCREEN_MIN_PHASE, STATES, isScreenId, nextPhase, phaseIndex } from './states'
import type {
  Action,
  AppTabId,
  AppUiState,
  ActionType,
  AuthAction,
  BreadthUiState,
  CaseOutcome,
  MapView,
  DiscoveryUiState,
  DrawerKind,
  EmployeeId,
  EvaluationRun,
  EvaluationVersionId,
  GuardFailure,
  GuardId,
  PersonConsent,
  StateId,
  State,
  Tier,
  HudKind,
  ScreenId,
  SimulatorUiState,
  JobUiState,
  IncidentUiState,
} from './types'
import { APP_TAB_IDS, DISCOVERY_FILTERS, DRAWER_KINDS, JOB_FILTERS, NOTIFICATION_FILTERS, RECORD_IDS, RUN_FRAMES_MAX, RUN_LABELS, SIMULATOR_VIEWS, STATE_IDS, TRACKER_COLUMNS, TRACKER_INVOICES } from './types'

/**
 * RT-01 rules: for each action, the phases it applies in, its guard, its effect and, for
 * lifecycle transitions, the phase it leads to. The engine (reducer.ts) is the only caller.
 * Guards never mutate; effects return a new state with only the slices they own changed.
 */
export interface Rule<A extends Action> {
  readonly from: readonly StateId[]
  readonly guard: (state: State, action: A) => GuardFailure | null
  readonly apply: (state: State, action: A) => State
  /** Phase after the effect; omitted means the action stays in the current phase. */
  readonly to?: (next: State, action: A) => StateId
}

type RuleMap = { readonly [K in ActionType]: Rule<Extract<Action, { type: K }>> }

const fail = (guard: GuardId, reason: string): GuardFailure => ({ guard, reason })
const ANY: readonly StateId[] = STATE_IDS
const IN = (...phases: StateId[]): readonly StateId[] => phases

function requireAuth(state: State, action: AuthAction, tier: Tier, object: string, scope: string = TEAM): GuardFailure | null {
  const decision = authorize(state, { actorId: state.actorId, action, tier, object, scope })
  return decision.allowed ? null : fail('authority', decision.reason)
}

function requireActor(state: State, id: State['actorId'], why: string): GuardFailure | null {
  if (state.actorId === id) return null
  const actor = person(state.actorId)
  return fail('actor', `${why} Current person is ${actor.name}.`)
}

function requireEmployee(state: State): GuardFailure | null {
  if (isEmployee(state.actorId)) return null
  const actor = person(state.actorId)
  return fail('actor', `${actor.name} is ${actor.role ?? 'external'}; only an Employee manages their own observation consent.`)
}

/** Capture guard shared by every step that needs this person's own capture to be on. */
function captureFailure(consent: PersonConsent, name: string): GuardFailure | null {
  if (consent.noticeDeclined) return fail('declined', `Capture is off: ${name} declined the notice.`)
  const block = captureBlock(consent)
  return block === null ? null : fail(block, CAPTURE_BLOCK_TEXT[block])
}

function patchConsent(state: State, id: EmployeeId, patch: Partial<PersonConsent>): State {
  return { ...state, consent: { ...state.consent, [id]: { ...state.consent[id], ...patch } } }
}

function patchUi(state: State, patch: Partial<State['ui']>): State {
  return { ...state, ui: { ...state.ui, ...patch } }
}

function patchApp(state: State, patch: Partial<AppUiState>): State {
  return patchUi(state, { app: { ...state.ui.app, ...patch } })
}

function patchDiscovery(state: State, patch: Partial<DiscoveryUiState>): State {
  return patchUi(state, { discovery: { ...state.ui.discovery, ...patch } })
}

function patchSimulator(state: State, patch: Partial<SimulatorUiState>): State {
  return patchUi(state, { simulator: { ...state.ui.simulator, ...patch } })
}

function patchJob(state: State, patch: Partial<JobUiState>): State {
  return patchUi(state, { job: { ...state.ui.job, ...patch } })
}

function patchIncident(state: State, patch: Partial<IncidentUiState>): State {
  return patchUi(state, { incident: { ...state.ui.incident, ...patch } })
}

function patchBreadth(state: State, patch: Partial<BreadthUiState>): State {
  return patchUi(state, { breadth: { ...state.ui.breadth, ...patch } })
}

const MAP_VIEWS: readonly MapView[] = ['graph', 'table']

/** Screens each drawer opens from. The rule drawer also opens from the Agent Factory draft, the examples drawer only from the release gate. */
const DRAWER_ROUTES: Readonly<Record<DrawerKind, readonly ScreenId[]>> = {
  evidence: ['SC14', 'SC15'],
  'AP-RULE-009': ['SC14', 'SC15', 'SC17', 'SC20'],
  'AP-RULE-017': ['SC14', 'SC15'],
  examples: ['SC18'],
  replay: ['SC20'],
}

const DRAWER_WHERE: Readonly<Record<DrawerKind, string>> = {
  evidence: 'The evidence drawer opens from the candidate review or the playbook.',
  'AP-RULE-009': 'The rule drawer opens from the candidate review, the playbook, the agent draft or the evaluation results.',
  'AP-RULE-017': 'The rule drawer opens from the candidate review or the playbook.',
  examples: 'The examples drawer opens from the release gate.',
  replay: 'The replay opens from the evaluation results.',
}

const INTENT_LIMIT = 280

/** An intent is accepted only when it is the demonstration intent (ignoring surrounding and repeated whitespace): the prototype drafts no other definition. */
function intentFailure(state: State): GuardFailure | null {
  const intent = state.ui.factory.intent.trim().replace(/\s+/g, ' ')
  if (intent === '') return fail('intent', 'Enter an intent to create an agent.')
  return intent === AGENT_DEFINITION.intent ? null : fail('intent', 'Only the demonstration intent drafts a definition in this prototype.')
}

/** SC13 to SC15 show the candidate, which exists once the commitment is confirmed. */
function candidateExists(state: State): GuardFailure | null {
  return phaseIndex(state.phase) >= phaseIndex('ST04')
    ? null
    : fail('route', `There is no candidate yet: it appears once the commitment is confirmed (ST04), and this run is at ${state.phase}.`)
}

/** Opening a work-application screen brings its browser tab forward, so a route and its tab never disagree. */
const SCREEN_TAB: Partial<Record<ScreenId, AppTabId>> = { SC04: 'netsuite', SC05: 'gmail', SC06: 'netsuite', SC07: 'tracker', SC08: 'slack', SC09: 'zoom', SC10: 'hubspot', SC32: 'hubspot' }

function withScreenTab(state: State, screen: ScreenId): State {
  const tab = SCREEN_TAB[screen]
  if (tab === undefined || tab === state.ui.activeTab) return state
  return patchUi(state, { activeTab: tab, tabHistory: [...state.ui.tabHistory, state.ui.activeTab] })
}

function actorConsent(state: State): { id: EmployeeId; consent: PersonConsent } {
  if (!isEmployee(state.actorId)) throw new Error('Consent rules run only after requireEmployee')
  return { id: state.actorId, consent: state.consent[state.actorId] }
}

/** Audit events are an ordered, append-only history; out-of-order or duplicate ids are bugs. */
function appendAudit(state: State, id: string): State {
  if (state.audit.includes(id)) return state
  const event = AUDIT_EVENTS.find((candidate) => candidate.id === id)
  if (!event) throw new Error(`Unknown audit event ${id}`)
  const lastId = state.audit[state.audit.length - 1]
  const last = AUDIT_EVENTS.find((candidate) => candidate.id === lastId)
  if (last && last.order >= event.order) throw new Error(`Audit event ${id} would break the recorded order`)
  return { ...state, audit: [...state.audit, id] }
}

const withOutcome = (state: State, invoice: string, outcome: CaseOutcome): State => ({
  ...state,
  job: { ...state.job, outcomes: { ...state.job.outcomes, [invoice]: outcome } },
})

const knownInvoice = (invoice: string) => INVOICE_CASES.some((row) => row.invoice === invoice)
const affectedIds: readonly string[] = INCIDENT.affectedCases.map((row) => row.id)

function startRun(state: State, versionId: EvaluationVersionId, suiteId: EvaluationRun['suiteId']): State {
  const run: EvaluationRun = { id: `RUN-${state.evaluations.length + 1}`, versionId, suiteId, status: 'running', results: [] }
  return { ...state, evaluations: [...state.evaluations, run] }
}

function settleRun(state: State, status: 'complete' | 'cancelled', results: EvaluationRun['results']): State {
  const current = state.evaluations[state.evaluations.length - 1]
  if (!current || current.status !== 'running') throw new Error('No running evaluation to settle')
  const settled: EvaluationRun = { ...current, status, results: status === 'complete' ? results : [] }
  return { ...state, evaluations: [...state.evaluations.slice(0, -1), settled] }
}

const runningGuard = (state: State, suiteId: EvaluationRun['suiteId'], what: string): GuardFailure | null => {
  const run = latestRun(state)
  return run && run.suiteId === suiteId && run.status === 'running' ? null : fail('run', `No ${what} is running.`)
}

function decisionGuard(state: State, invoice: string): GuardFailure | null {
  if (invoice === UNKNOWN_INVOICE.invoice) {
    return fail('target', `${invoice} is Outcome Unknown and stays held. ${COPY.resubmissionUnavailable}; it cannot be decided.`)
  }
  if (invoice !== APPROVAL_INVOICE.invoice) return fail('target', `${invoice} has no pending approval.`)
  if (state.job.outcomes[invoice] !== 'approval') return fail('target', `${invoice} is not waiting for approval.`)
  if (state.approval.decision !== 'pending') return fail('decision', 'A decision is already recorded for this case.')
  if (APPROVAL_INVOICE.poAmountCents == null) return fail('threshold', `${invoice} has no known PO amount to compare.`)
  if (!exceedsThreshold(APPROVAL_INVOICE.amountCents, APPROVAL_INVOICE.poAmountCents, thresholdHundredths(state.policy.threshold))) {
    return fail('threshold', `${invoice} is within the ${state.policy.threshold} threshold and needs no Tier 3 approval.`)
  }
  return requireAuth(state, 'approve-variance', 3, invoice)
}

function decide(decision: 'approved' | 'rejected' | 'changesRequested') {
  return (state: State, action: { readonly invoice: string }): State => {
    const verdict = authorize(state, { actorId: state.actorId, action: 'approve-variance', tier: 3, object: action.invoice, scope: TEAM })
    const next = {
      ...state,
      approval: { decision, by: state.actorId, grantId: verdict.allowed ? verdict.grantId : null },
      readback: { status: decision === 'approved' ? ('pending' as const) : ('none' as const) },
    }
    return decision === 'approved' ? appendAudit(next, 'A06') : next
  }
}

function releaseBlock(state: State): GuardFailure | null {
  const checks = gateChecks(state)
  const byId = (id: string) => checks.find((check) => check.id === id)
  for (const id of ['examples', 'scenarios', 'edgeCases', 'ownerApproval', 'scopeConfirmation'] as const) {
    const check = byId(id)
    if (check && !check.met) return fail(id, check.detail)
  }
  return requireAuth(state, 'start-job', 2, JOB_ID)
}

const regressionIds = new Set([...SCENARIOS.map((s) => s.id), ...REGRESSION_CASES.map((s) => s.id)])

export const RULES: RuleMap = {
  // -- presentation and selection ----------------------------------------------------
  OPEN_SCREEN: {
    from: ANY,
    guard: (state, { screen }) => {
      if (!isScreenId(screen)) return fail('target', `${screen} is not a screen.`)
      const needed = SCREEN_MIN_PHASE[screen]
      if (phaseIndex(state.phase) >= phaseIndex(needed)) return null
      return fail('route', `${screen} is not reachable yet: it needs ${needed} ${STATES[needed].name}, and this run is at ${state.phase}. Reconstruct the prerequisites instead of opening it directly.`)
    },
    apply: (state, { screen }) => {
      // The evidence drawer belongs to SC14 and SC15: leaving the screen closes it, and so do the breadth dialogs, drawers and popovers.
      const left = screen === state.route ? state : patchBreadth(patchDiscovery({ ...state, route: screen }, { drawer: null }), {
        versions: { ...state.ui.breadth.versions, restore: 'closed' },
        audit: { step: 'closed' },
        capability: { ...state.ui.breadth.capability, selected: null },
        notifications: { ...state.ui.breadth.notifications, open: null },
      })
      return withScreenTab(left, screen)
    },
  },
  SELECT_ACTOR: {
    from: ANY,
    guard: (_state, { personId }) => {
      const selected = PEOPLE.find((candidate) => candidate.id === personId)
      if (!selected) return fail('target', `${String(personId)} is not a person.`)
      return selected.role === null
        ? fail('actor', `${selected.name} is an external supplier representative; there is no internal viewpoint to select.`)
        : null
    },
    apply: (state, { personId }) => ({ ...state, actorId: personId }),
  },
  SET_THEME: { from: ANY, guard: () => null, apply: (state, { theme }) => ({ ...state, theme }) },
  SELECT_CASE: {
    from: ANY,
    guard: (_state, { caseId }) => (knownInvoice(caseId) || affectedIds.includes(caseId) ? null : fail('target', `${caseId} is not a known case.`)),
    apply: (state, { caseId }) => ({ ...state, selectedCase: caseId }),
  },
  SELECT_SCENARIO: {
    from: ANY,
    guard: (_state, { scenarioId }) => (scenarioId === null || regressionIds.has(scenarioId) ? null : fail('target', `${scenarioId} is not a known scenario.`)),
    apply: (state, { scenarioId }) => ({ ...state, selectedScenario: scenarioId }),
  },
  SET_SIMULATOR: {
    from: ANY,
    guard: (_state, { view, runLabel, runFrames, runLead }) => {
      if (view !== undefined && !(SIMULATOR_VIEWS as readonly string[]).includes(view)) return fail('target', `${String(view)} is not a simulator view.`)
      if (runLabel !== undefined && !(RUN_LABELS as readonly string[]).includes(runLabel)) return fail('target', `${String(runLabel)} is not a run action label.`)
      if (runFrames !== undefined && !(Number.isInteger(runFrames) && runFrames >= 1 && runFrames <= RUN_FRAMES_MAX)) return fail('target', `A run takes 1 to ${RUN_FRAMES_MAX} frames.`)
      if (runLead !== undefined && !(Number.isInteger(runLead) && runLead >= 0 && runLead <= RUN_FRAMES_MAX)) return fail('target', `A run lead is 0 to ${RUN_FRAMES_MAX} frames.`)
      return null
    },
    apply: (state, { view, runLabel, runFrames, runLead }) =>
      patchSimulator(state, {
        ...(view === undefined ? {} : { view }),
        ...(runLabel === undefined ? {} : { runLabel }),
        ...(runFrames === undefined ? {} : { runFrames }),
        ...(runLead === undefined ? {} : { runLead }),
      }),
  },
  SET_COMPARE: {
    from: ANY,
    guard: (state, { open }) =>
      !open || state.evaluations.some((run) => run.suiteId === SUITE_ID && run.status === 'complete') ? null : fail('run', 'There is no completed evaluation to compare.'),
    apply: (state, { open }) => patchSimulator(state, { compare: open }),
  },
  CONFIRM_SELECTION: {
    from: IN('ST09'),
    guard: (state) => {
      if (state.ui.job.selection === 'confirmed') return fail('selection', `The ${INVOICE_CASES.length} invoices of ${JOB_ID} are already confirmed.`)
      return releaseBlock(state)
    },
    apply: (state) => patchJob(state, { selection: 'confirmed', startCancelled: false }),
  },
  OPEN_JOB_SCOPE: {
    from: IN('ST09'),
    guard: (state) => {
      if (state.ui.job.selection !== 'confirmed') return fail('selection', `Confirm the ${INVOICE_CASES.length} invoices before the job scope.`)
      return releaseBlock(state)
    },
    apply: (state) => patchJob(state, { dialog: 'open', startCancelled: false }),
  },
  CANCEL_JOB_START: {
    from: IN('ST09'),
    guard: (state) => (state.ui.job.dialog === 'open' ? null : fail('jobScope', 'No job start is open: there is nothing to cancel.')),
    apply: (state) => patchJob(state, { dialog: 'closed', startCancelled: true }),
  },
  SET_JOB_FILTER: {
    from: ANY,
    guard: (_state, { filter }) => ((JOB_FILTERS as readonly string[]).includes(filter) ? null : fail('target', `${String(filter)} is not a job filter.`)),
    apply: (state, { filter }) => patchJob(state, { filter }),
  },
  SET_JOB_VIEW: {
    from: ANY,
    guard: (_state, { investigating, tip, evidence, snapshot }) => {
      if (![investigating, tip, evidence].every((value) => value === undefined || typeof value === 'boolean')) return fail('target', 'A job disclosure is open or closed.')
      return snapshot === undefined || snapshot === 'current' || snapshot === 'before' ? null : fail('target', `${String(snapshot)} is not a job snapshot.`)
    },
    apply: (state, { investigating, tip, evidence, snapshot }) =>
      patchJob(state, {
        ...(investigating === undefined ? {} : { investigating }),
        ...(tip === undefined ? {} : { tip }),
        ...(evidence === undefined ? {} : { evidence }),
        ...(snapshot === undefined ? {} : { snapshot }),
      }),
  },
  SET_INCIDENT_VIEW: {
    from: ANY,
    guard: (_state, { evidence, outcome }) => {
      if (evidence !== undefined && typeof evidence !== 'boolean') return fail('target', 'Case evidence is open or closed.')
      return outcome === undefined || outcome === null || outcome === 0 || outcome === 1 || outcome === 2 ? null : fail('target', `Cohort outcome ${String(outcome)} does not exist: the watch has three outcomes.`)
    },
    apply: (state, { evidence, outcome }) => patchIncident(state, { ...(evidence === undefined ? {} : { evidence }), ...(outcome === undefined ? {} : { outcome }) }),
  },
  SET_TEACH_ANSWER: {
    from: IN('ST12'),
    guard: (state, { answer }) => {
      if (answer !== 'none' && answer !== 'yes') return fail('target', `${String(answer)} is not an answer to the question.`)
      return state.incident.correctionRecorded ? fail('correctionDraft', 'The correction is already saved; it is evidence and no longer a draft.') : null
    },
    // Withdrawing the answer also unlinks the rule: a rule is linked to an answer.
    apply: (state, { answer }) => patchIncident(state, answer === 'yes' ? { answer } : { answer, ruleLinked: false }),
  },
  LINK_TEACH_RULE: {
    from: IN('ST12'),
    guard: (state, { linked }) => {
      if (typeof linked !== 'boolean') return fail('target', 'A rule is linked or not linked.')
      if (state.incident.correctionRecorded) return fail('correctionDraft', 'The correction is already saved; it is evidence and no longer a draft.')
      return !linked || state.ui.incident.answer === 'yes' ? null : fail('correctionDraft', 'Answer the question first: the rule is linked to the answer.')
    },
    apply: (state, { linked }) => patchIncident(state, { ruleLinked: linked }),
  },
  DISMISS_NOTIFICATION: {
    from: ANY,
    guard: (state, { id }) => {
      const notice = NOTIFICATIONS[id]
      if (!notice) return fail('target', `${id} is not a known notice.`)
      return notice.recipient === state.actorId ? null : fail('actor', `${id} belongs to ${notice.recipient}; only its recipient can dismiss it.`)
    },
    apply: (state, { id }) => {
      const dismissed = { ...state, notificationsDismissed: state.notificationsDismissed.includes(id) ? state.notificationsDismissed : [...state.notificationsDismissed, id] }
      const { notifications } = state.ui.breadth
      return notifications.toast === id || notifications.open === id
        ? patchBreadth(dismissed, { notifications: { ...notifications, toast: notifications.toast === id ? null : notifications.toast, open: notifications.open === id ? null : notifications.open } })
        : dismissed
    },
  },

  // -- presentation: wizard, overlays, dialogs, tabs (never business state) --------------
  WIZARD_NEXT: {
    from: ANY,
    guard: (state) => {
      const wrongActor = requireEmployee(state)
      if (wrongActor) return wrongActor
      const { id, consent } = actorConsent(state)
      const name = person(id).name
      if (state.ui.wizardStep === 'notice') {
        return consent.noticeAccepted ? null : fail('notice', `${name} has not acknowledged the notice: Accept and continue stays unavailable.`)
      }
      if (state.ui.wizardStep === 'capture') {
        return consent.workApplications || consent.visualObservation ? null : fail('category', `${name} has chosen no capture category: Continue stays unavailable.`)
      }
      return fail('target', 'Work scope is the last step: Continue there finishes enrollment.')
    },
    apply: (state) => patchUi(state, { wizardStep: state.ui.wizardStep === 'notice' ? 'capture' : 'scope' }),
  },
  WIZARD_BACK: {
    from: ANY,
    guard: (state) => (state.ui.wizardStep === 'notice' ? fail('target', 'Notice is the first step; there is nothing to go back to.') : null),
    apply: (state) => patchUi(state, { wizardStep: state.ui.wizardStep === 'scope' ? 'capture' : 'notice' }),
  },
  SET_NOTICE_EXPANDED: {
    from: ANY,
    guard: () => null,
    apply: (state, { expanded }) => patchUi(state, { noticeExpanded: expanded }),
  },
  SET_OVERLAY: {
    from: ANY,
    guard: (state, { overlay }) => (overlay === 'companion' ? requireEmployee(state) : null),
    apply: (state, { overlay }) => patchUi(state, { overlay, searchQuery: overlay === 'search' ? state.ui.searchQuery : '' }),
  },
  SET_SEARCH_QUERY: {
    from: ANY,
    guard: (state) => (state.ui.overlay === 'search' ? null : fail('target', 'The search palette is not open.')),
    apply: (state, { query }) => patchUi(state, { searchQuery: query }),
  },
  OPEN_DELETE_DIALOG: {
    from: ANY,
    guard: requireEmployee,
    apply: (state) => patchUi(state, { deleteDialog: 'confirm' }),
  },
  CANCEL_DELETE: {
    from: ANY,
    guard: (state) => (state.ui.deleteDialog === 'confirm' ? null : fail('target', 'No deletion is waiting for confirmation.')),
    apply: (state) => patchUi(state, { deleteDialog: 'closed' }),
  },
  CONFIRM_DELETE_LOCAL_HISTORY: {
    from: ANY,
    guard: (state) => requireEmployee(state) ?? (state.ui.deleteDialog === 'confirm' ? null : fail('target', 'No deletion is waiting for confirmation.')),
    apply: (state) => patchUi(state, { deleteDialog: 'closed', localHistoryDeleted: true }),
  },
  SELECT_APP_TAB: {
    from: ANY,
    guard: (_state, { tab }) => ((APP_TAB_IDS as readonly string[]).includes(tab) ? null : fail('target', `${String(tab)} is not a browser tab.`)),
    apply: (state, { tab }) => (tab === state.ui.activeTab ? state : patchUi(state, { activeTab: tab, tabHistory: [...state.ui.tabHistory, state.ui.activeTab] })),
  },
  BROWSER_BACK: {
    from: ANY,
    guard: (state) => (state.ui.tabHistory.length > 0 ? null : fail('target', 'There is no earlier view to go back to.')),
    apply: (state) => patchUi(state, { activeTab: state.ui.tabHistory[state.ui.tabHistory.length - 1] as State['ui']['activeTab'], tabHistory: state.ui.tabHistory.slice(0, -1) }),
  },
  SET_FOREGROUND: {
    from: ANY,
    guard: () => null,
    apply: (state, { window }) => patchUi(state, { foreground: window }),
  },

  // -- presentation: work applications and the SC04 card (never business state) ---------------
  OPEN_MESSAGE: {
    from: ANY,
    guard: (_state, { record }) => ((RECORD_IDS as readonly string[]).includes(record) ? null : fail('record', `${String(record)} is not a known record.`)),
    apply: (state, { record }) => patchApp(state, { record, mail: 'message', attachment: false, documentView: 'single' }),
  },
  CLOSE_MESSAGE: {
    from: ANY,
    guard: (state) => (state.ui.app.mail === 'message' ? null : fail('target', 'No message is open.')),
    apply: (state) => patchApp(state, { mail: 'inbox', attachment: false, documentView: 'single' }),
  },
  OPEN_ATTACHMENT: {
    from: ANY,
    guard: (state) => (state.ui.app.mail === 'message' ? null : fail('target', 'No message is open: an attachment opens from its message.')),
    apply: (state) => patchApp(state, { attachment: true }),
  },
  CLOSE_ATTACHMENT: {
    from: ANY,
    guard: (state) => (state.ui.app.attachment ? null : fail('target', 'No document is open.')),
    apply: (state) => patchApp(state, { attachment: false, documentView: 'single' }),
  },
  SET_DOCUMENT_VIEW: {
    from: ANY,
    guard: (state, { view }) => {
      if (!state.ui.app.attachment) return fail('target', 'No document is open.')
      if (view === 'compare' && state.ui.app.record !== 'INV-48231') {
        return fail('record', `${state.ui.app.record} has one layout; only INV-48231 compares an earlier and a current layout.`)
      }
      return null
    },
    apply: (state, { view }) => patchApp(state, { documentView: view }),
  },
  OPEN_BILL: {
    from: ANY,
    guard: (_state, { record }) => ((RECORD_IDS as readonly string[]).includes(record) ? null : fail('record', `${String(record)} is not a known record.`)),
    apply: (state, { record }) => patchApp(state, { record, erp: 'bill', vendor: null, attachment: false, documentView: 'single' }),
  },
  OPEN_ERP_VIEW: {
    from: ANY,
    guard: (_state, { view }) => (view === 'bill' || view === 'vendors' ? null : fail('target', `${String(view)} is not a NetSuite view.`)),
    apply: (state, { view }) => patchApp(state, { erp: view, vendor: null }),
  },
  OPEN_VENDOR: {
    from: ANY,
    guard: (_state, { vendorId }) => (SUPPLIERS.some((supplier) => supplier.id === vendorId) ? null : fail('target', `${String(vendorId)} is not a vendor.`)),
    apply: (state, { vendorId }) => {
      const { hud } = state.ui.app
      // Opening the Kestrel record again is a fresh context: a dismissed reminder may show once more.
      const reopened = vendorId === COMMITMENT_SUPPLIER ? { ...hud, dismissed: hud.dismissed.filter((kind) => kind !== 'commitment') } : hud
      return patchApp(state, { erp: 'vendor', vendor: vendorId, hud: reopened })
    },
  },
  FOCUS_TRACKER_CELL: {
    from: ANY,
    guard: (_state, { invoice, column }) =>
      (TRACKER_INVOICES as readonly string[]).includes(invoice) && (TRACKER_COLUMNS as readonly string[]).includes(column)
        ? null
        : fail('target', `${String(invoice)} / ${String(column)} is not a tracker cell.`),
    apply: (state, { invoice, column }) => patchApp(state, { trackerFocus: { invoice, column } }),
  },
  SHOW_MEETING_QUOTE: {
    from: ANY,
    guard: (state, { speaker }) => {
      const { meeting } = state.ui.app
      if (meeting.ended) return fail('meeting', 'The meeting has ended: nothing further is captured from it.')
      if (!recordingActive(state, 'priya')) return fail('meetingConsent', "No quotation appears without this meeting's consent: capture is not on for this meeting.")
      if (speaker === 'dana') return meeting.quote === 'none' ? null : fail('meeting', "Dana's statement is already shown.")
      if (meeting.quote === 'priya') return fail('meeting', "Priya's reply is already shown.")
      return meeting.quote === 'dana' ? null : fail('meeting', "Priya replies after Dana's statement.")
    },
    apply: (state, { speaker }) => patchApp(state, { meeting: { ...state.ui.app.meeting, quote: speaker } }),
  },
  END_MEETING: {
    from: ANY,
    guard: (state) => (state.ui.app.meeting.ended ? fail('meeting', 'The meeting has already ended.') : null),
    apply: (state) => patchApp(state, { meeting: { ...state.ui.app.meeting, ended: true } }),
  },
  OPEN_GUIDE: {
    from: ANY,
    guard: (state) => {
      if (hudKind(state) !== 'peerFix') return fail('guide', 'Guide Me belongs to the peer-fix card, which is not showing.')
      return state.ui.app.hud.guide === 'closed' ? null : fail('guide', 'Guidance is already open.')
    },
    apply: (state) => patchApp(state, { hud: { ...state.ui.app.hud, guide: 1 } }),
  },
  GUIDE_NEXT: {
    from: ANY,
    guard: ({ ui }) => {
      const { guide } = ui.app.hud
      if (guide === 1 || guide === 2) return null
      return fail('guide', guide === 3 ? 'This is the last step: Done closes the guide.' : 'Guidance is not open.')
    },
    apply: (state) => patchApp(state, { hud: { ...state.ui.app.hud, guide: state.ui.app.hud.guide === 1 ? 2 : 3 } }),
  },
  GUIDE_BACK: {
    from: ANY,
    guard: ({ ui }) => {
      const { guide } = ui.app.hud
      if (guide === 2 || guide === 3) return null
      return fail('guide', guide === 1 ? 'Step 1 is the first step.' : 'Guidance is not open.')
    },
    apply: (state) => patchApp(state, { hud: { ...state.ui.app.hud, guide: state.ui.app.hud.guide === 3 ? 2 : 1 } }),
  },
  GUIDE_DONE: {
    from: ANY,
    guard: ({ ui }) => (ui.app.hud.guide === 3 ? null : fail('guide', 'Done is available on the last guide step.')),
    // Completing guidance records nothing about the case it was about: no outcome, no readback.
    apply: (state) => patchApp(state, { hud: { ...state.ui.app.hud, guide: 'completed' } }),
  },
  DISMISS_HUD: {
    from: ANY,
    guard: (state) => (hudKind(state) === null ? fail('guide', 'No card is showing.') : null),
    apply: (state) => {
      const kind = hudKind(state) as HudKind
      const { hud } = state.ui.app
      return patchApp(state, { hud: { ...hud, guide: 'closed', dismissed: [...hud.dismissed, kind] } })
    },
  },
  PLACE_HUD: {
    from: ANY,
    guard: (_state, { placement, motion }) => {
      if (placement !== 'upper' && placement !== 'lower') return fail('target', `${String(placement)} is not a card placement.`)
      return motion === undefined || motion === 'short' || motion === 'long' ? null : fail('target', `${String(motion)} is not a card entry motion.`)
    },
    apply: (state, { placement, motion }) => patchApp(state, { hud: { ...state.ui.app.hud, placement, motion: motion ?? state.ui.app.hud.motion } }),
  },
  DRAFT_DEADLINE: {
    from: ANY,
    guard: (state, { text }) => {
      if (text === null) return null
      const wrongActor = requireActor(state, 'priya', 'Only the commitment owner, Priya Nair, edits the deadline.')
      if (wrongActor) return wrongActor
      return state.phase === 'ST03' ? null : fail('commitment', 'There is no proposed commitment to edit.')
    },
    apply: (state, { text }) => patchUi(state, { deadlineDraft: text }),
  },
  SELECT_CANDIDATE: {
    from: ANY,
    guard: candidateExists,
    apply: (state) => patchDiscovery(state, { candidateSelected: true }),
  },
  SET_DISCOVERY_FILTER: {
    from: ANY,
    guard: (_state, { filter }) => ((DISCOVERY_FILTERS as readonly string[]).includes(filter) ? null : fail('target', `${String(filter)} is not a Workflow Discovery filter.`)),
    apply: (state, { filter }) => patchDiscovery(state, { filter }),
  },
  SELECT_DEMONSTRATION: {
    from: ANY,
    guard: (state, { demoId }) => candidateExists(state) ?? (DEMONSTRATIONS.some((demo) => demo.id === demoId) ? null : fail('target', `${String(demoId)} is not a known Demonstration.`)),
    apply: (state, { demoId }) => patchDiscovery(state, { demonstration: demoId }),
  },
  OPEN_DRAWER: {
    from: ANY,
    guard: (state, { drawer }) => {
      const missing = candidateExists(state)
      if (missing) return missing
      if (!(DRAWER_KINDS as readonly string[]).includes(drawer)) return fail('target', `${String(drawer)} is not a drawer.`)
      if (!DRAWER_ROUTES[drawer].includes(state.route)) return fail('target', DRAWER_WHERE[drawer])
      if (drawer === 'replay') {
        if (state.selectedScenario !== BOUNDARY_REPLAY.scenarioId) return fail('target', `Select ${BOUNDARY_REPLAY.scenarioId} (${BOUNDARY_REPLAY.key}) to open its replay; no other scenario has a replay.`)
        return state.evaluations.some((run) => run.suiteId === SUITE_ID && run.status === 'complete') ? null : fail('run', 'A replay needs a completed evaluation.')
      }
      return drawer === 'evidence' && state.ui.discovery.demonstration === null ? fail('target', 'Select a Demonstration to open its evidence.') : null
    },
    apply: (state, { drawer }) => patchDiscovery(state, { drawer }),
  },
  CLOSE_DRAWER: {
    from: ANY,
    guard: (state) => (state.ui.discovery.drawer === null ? fail('target', 'No drawer is open.') : null),
    apply: (state) => patchDiscovery(state, { drawer: null }),
  },

  // -- consent: independent values ----------------------------------------------------
  ACKNOWLEDGE_NOTICE: {
    from: ANY,
    guard: requireEmployee,
    apply: (state) => {
      const { id } = actorConsent(state)
      return patchConsent(state, id, { noticeAccepted: true, noticeDeclined: false })
    },
  },
  DECLINE_NOTICE: {
    from: ANY,
    guard: requireEmployee,
    apply: (state) => {
      const { id } = actorConsent(state)
      return patchConsent(state, id, { noticeAccepted: false, noticeDeclined: true, workApplications: false, visualObservation: false })
    },
  },
  SET_CAPTURE_CATEGORY: {
    from: ANY,
    guard: requireEmployee,
    apply: (state, { category, enabled }) => {
      const { id } = actorConsent(state)
      return patchConsent(state, id, { [category]: enabled })
    },
  },
  SET_CONTRIBUTION: {
    from: ANY,
    guard: requireEmployee,
    apply: (state, { enabled }) => {
      const { id } = actorConsent(state)
      return patchConsent(state, id, { contribution: enabled })
    },
  },
  PAUSE_OBSERVATION: {
    from: ANY,
    guard: requireEmployee,
    apply: (state) => patchConsent(state, actorConsent(state).id, { paused: true }),
  },
  RESUME_OBSERVATION: {
    from: ANY,
    guard: requireEmployee,
    apply: (state) => patchConsent(state, actorConsent(state).id, { paused: false }),
  },
  GRANT_MEETING_CONSENT: {
    from: ANY,
    guard: (state) => requireEmployee(state) ?? (state.ui.app.meeting.ended ? fail('meeting', 'The meeting has ended: consent can no longer start capture for it.') : null),
    apply: (state, { meetingId }) => {
      const { id, consent } = actorConsent(state)
      return patchConsent(state, id, { meetings: { ...consent.meetings, [meetingId]: 'granted' } })
    },
  },
  DENY_MEETING_CONSENT: {
    from: ANY,
    guard: requireEmployee,
    apply: (state, { meetingId }) => {
      const { id, consent } = actorConsent(state)
      return patchConsent(state, id, { meetings: { ...consent.meetings, [meetingId]: 'denied' } })
    },
  },

  // -- ST01 to ST04: enrollment, meeting, commitment, publication ---------------------
  CONSENT: {
    from: IN('ST01'),
    guard: (state) =>
      requireActor(state, 'priya', 'Enrollment is completed by the employee being enrolled, Priya Nair.') ??
      captureFailure(state.consent.priya, 'Priya Nair'),
    apply: (state) => appendAudit(state, 'A01'),
    to: () => 'ST02',
  },
  REVIEW_MEETING: {
    from: IN('ST02'),
    guard: (state) => {
      const wrongActor = requireActor(state, 'priya', 'Only the meeting participant, Priya Nair, reviews this meeting.')
      if (wrongActor) return wrongActor
      const meeting = state.consent.priya.meetings['zoom-kestrel']
      if (meeting === 'denied') return fail('meetingConsent', 'Per-meeting consent was denied: this meeting cannot be reviewed.')
      if (meeting !== 'granted') return fail('meetingConsent', 'Per-meeting consent is required before this meeting can be reviewed: Priya Nair has not opted in.')
      return captureFailure(state.consent.priya, 'Priya Nair')
    },
    apply: (state) => ({ ...state, commitment: { status: 'proposed', due: COMMITMENT.originalDue, confirmedDue: null } }),
    to: () => 'ST03',
  },
  EDIT_COMMITMENT: {
    from: IN('ST03'),
    guard: (state, { due }) =>
      requireActor(state, 'priya', 'Only the commitment owner, Priya Nair, edits the deadline.') ??
      (due.trim().length === 0 ? fail('commitment', 'A deadline is required.') : null),
    apply: (state, { due }) => ({ ...state, commitment: { ...state.commitment, status: 'edited', due: due.trim() }, ui: { ...state.ui, deadlineDraft: null } }),
  },
  CONFIRM_COMMITMENT: {
    from: IN('ST03'),
    guard: (state) => {
      const wrongActor = requireActor(state, 'priya', 'Only the commitment owner, Priya Nair, confirms it.')
      if (wrongActor) return wrongActor
      return state.commitment.status === 'proposed' || state.commitment.status === 'edited'
        ? null
        : fail('commitment', 'There is no proposed commitment to confirm.')
    },
    apply: (state) => ({ ...state, commitment: { ...state.commitment, status: 'confirmed', confirmedDue: state.commitment.due }, ui: { ...state.ui, deadlineDraft: null } }),
    to: () => 'ST04',
  },
  APPROVE_DEMONSTRATION: {
    from: IN('ST04'),
    guard: (state, { demoId }) => {
      const demo = DEMONSTRATIONS.find((candidate) => candidate.id === demoId)
      if (!demo) return fail('target', `${demoId} is not a known Demonstration.`)
      const contributor = person(demo.contributorId)
      const wrongActor = requireActor(state, demo.contributorId, `Only ${contributor.name} reviews and approves their own ${demoId}.`)
      if (wrongActor) return wrongActor
      if (state.demonstrations[demoId] === 'approved') return fail('contributorReview', `${demoId} is already approved.`)
      if (!isEmployee(demo.contributorId)) return fail('actor', `${contributor.name} is not an Employee contributor.`)
      const consent = state.consent[demo.contributorId]
      const capture = captureFailure(consent, contributor.name)
      if (capture) return capture
      return consent.contribution
        ? null
        : fail('contribution', `Contribution is off: ${contributor.name} has not agreed to share ${demoId}. Capture consent does not imply it.`)
    },
    apply: (state, { demoId }) => {
      const next = { ...state, demonstrations: { ...state.demonstrations, [demoId]: 'approved' as const } }
      return DEMONSTRATIONS.every((demo) => next.demonstrations[demo.id] === 'approved') ? appendAudit(next, 'A02') : next
    },
  },
  REQUEST_OWNER_REVIEW: {
    from: IN('ST04'),
    guard: (state) => {
      const contributor = DEMONSTRATIONS.some((demo) => demo.contributorId === state.actorId)
      if (!contributor) return fail('actor', `Only a contributor to this candidate requests owner review. Current person is ${person(state.actorId).name}.`)
      const pending = DEMONSTRATIONS.filter((demo) => state.demonstrations[demo.id] !== 'approved').map((demo) => demo.id)
      if (pending.length > 0) return fail('contributorReview', `Contributor review is incomplete: ${pending.join(', ')} not approved by their contributors.`)
      if (state.ownerReviewRequestedBy !== null) return fail('ownerReview', `Owner review is already requested by ${person(state.ownerReviewRequestedBy).name}.`)
      return null
    },
    apply: (state) => ({ ...state, ownerReviewRequestedBy: isEmployee(state.actorId) ? state.actorId : null }),
  },
  PUBLISH: {
    from: IN('ST04'),
    guard: (state) => {
      const pending = DEMONSTRATIONS.filter((demo) => state.demonstrations[demo.id] !== 'approved').map((demo) => demo.id)
      if (pending.length > 0) return fail('contributorReview', `Contributor review is incomplete: ${pending.join(', ')} not approved by their contributors.`)
      if (state.ownerReviewRequestedBy === null) return fail('ownerReview', 'Owner review has not been requested.')
      return requireAuth(state, 'publish-playbook', 1, 'PB-AP-RECON')
    },
    apply: (state) => appendAudit(patchDiscovery({ ...state, playbookPublished: true }, { drawer: null }), 'A03'),
    to: () => 'ST05',
  },

  // -- ST05 to ST09: agent, simulation, release ------------------------------------
  SET_INTENT: {
    from: IN('ST05'),
    guard: (_state, { text }) => {
      if (typeof text !== 'string') return fail('intent', 'The intent must be text.')
      return text.length <= INTENT_LIMIT ? null : fail('intent', `The intent is limited to ${INTENT_LIMIT} characters.`)
    },
    apply: (state, { text }) => patchUi(state, { factory: { ...state.ui.factory, intent: text } }),
  },
  CREATE_AGENT: {
    from: IN('ST05'),
    guard: (state) => intentFailure(state) ?? requireAuth(state, 'create-agent', 1, AGENT_NAME),
    apply: (state) => ({ ...state, agent: { ...state.agent, versions: [...state.agent.versions, 'agent-v0.1'] } }),
    to: () => 'ST06',
  },
  RUN_SIMULATION: {
    from: IN('ST06', 'ST07'),
    guard: (state) => {
      if (SCENARIOS.length !== SUITE_SIZE || new Set(SCENARIOS.map((s) => s.id)).size !== SUITE_SIZE) {
        return fail('suiteSealed', `The suite is not sealed at ${SUITE_SIZE} unique scenarios.`)
      }
      const run = latestRun(state)
      if (state.phase === 'ST07' && run?.status !== 'cancelled') return fail('run', 'A simulation is already running or complete.')
      return requireAuth(state, 'run-simulation', 0, SUITE_ID)
    },
    apply: (state) => {
      const candidate: EvaluationVersionId = state.agent.versions.includes('agent-v0.2') ? 'agent-v0.2' : 'agent-v0.1'
      // A run lead belongs to the run that was in progress when it was set: a new run starts from nothing.
      return { ...startRun(patchSimulator(state, { runLead: 0 }), candidate, SUITE_ID), running: { ...state.running, simulation: true } }
    },
    to: () => 'ST07',
  },
  CANCEL_SIMULATION: {
    from: IN('ST07'),
    guard: (state) => runningGuard(state, SUITE_ID, 'simulation') ?? requireAuth(state, 'run-simulation', 0, SUITE_ID),
    apply: (state) => ({ ...settleRun(state, 'cancelled', []), running: { ...state.running, simulation: false } }),
  },
  COMPLETE_SIMULATION: {
    from: IN('ST07'),
    guard: (state) => runningGuard(state, SUITE_ID, 'simulation'),
    apply: (state) => {
      const run = latestRun(state)
      const version = run?.versionId === 'agent-v0.2' ? 'v0.2' : 'v0.1'
      const results = SCENARIOS.map((scenario) => ({ id: scenario.id, verdict: verdictOf(scenario, version) }))
      return { ...settleRun(state, 'complete', results), running: { ...state.running, simulation: false } }
    },
    to: (next) => {
      const run = latestRun(next)
      return run && runSummary(run).failed === 0 ? 'ST09' : 'ST08'
    },
  },
  FIX_AND_RUN: {
    from: IN('ST08'),
    guard: (state) => requireAuth(state, 'run-simulation', 0, SUITE_ID),
    apply: (state) => {
      const fixed = { ...state, agent: { ...state.agent, versions: [...state.agent.versions, 'agent-v0.2' as const] } }
      // A new evaluation starts with no scenario selected and the versions no longer side by side; v0.1's run stays as it was.
      const fresh = patchSimulator({ ...fixed, selectedScenario: null }, { compare: false, runLead: 0 })
      return { ...startRun(fresh, 'agent-v0.2', SUITE_ID), running: { ...state.running, simulation: true } }
    },
    to: () => 'ST07',
  },
  APPROVE_RELEASE: {
    from: IN('ST09'),
    guard: (state) => {
      const scenarios = gateChecks(state).find((check) => check.id === 'scenarios')
      if (scenarios && !scenarios.met) return fail('scenarios', `Release cannot be approved before the evaluation passes. ${scenarios.detail}`)
      if (state.agent.releaseApproved) return fail('ownerApproval', 'The release is already approved.')
      return requireAuth(state, 'approve-release', 2, AGENT_V10_OBJECT)
    },
    apply: (state) => appendAudit({ ...state, agent: { ...state.agent, releaseApproved: true } }, 'A04'),
  },
  CONFIRM_SCOPE: {
    from: IN('ST09'),
    guard: (state) => requireAuth(state, 'confirm-scope', 2, AGENT_V10_OBJECT),
    apply: (state) => ({ ...state, agent: { ...state.agent, scopeConfirmed: true } }),
  },
  RELEASE_AND_START: {
    from: IN('ST09'),
    guard: (state) => releaseBlock(state) ?? (state.ui.job.dialog === 'open' ? null : fail('jobScope', `Confirm the job scope of ${JOB_ID} before it starts: the confirmation precedes the run.`)),
    apply: (state) =>
      appendAudit(
        {
          ...patchJob(state, { dialog: 'closed', startCancelled: false }),
          agent: { ...state.agent, versions: [...state.agent.versions, 'agent-v1.0'], pinned: 'agent-v1.0' },
          job: { status: 'running', outcomes: Object.fromEntries(INVOICE_CASES.map((row) => [row.invoice, 'queued' as const])) },
          running: { ...state.running, job: true },
        },
        'A05',
      ),
    to: () => 'ST10',
  },

  // -- ST10 and ST11: job, approval, readback --------------------------------------
  EVALUATE_CASE: {
    from: IN('ST10'),
    guard: (state, { invoice }) => {
      if (!knownInvoice(invoice)) return fail('target', `${invoice} is not a case of ${JOB_ID}.`)
      return state.job.outcomes[invoice] === 'queued' ? null : fail('run', `${invoice} already has an outcome.`)
    },
    apply: (state, { invoice }) => {
      const fixture = INVOICE_CASES.find((row) => row.invoice === invoice)
      if (!fixture) throw new Error(`Unknown invoice ${invoice}`)
      return withOutcome(state, invoice, fixture.outcome)
    },
  },
  PAUSE_FOR_APPROVAL: {
    from: IN('ST10'),
    guard: (state) => {
      const waiting = Object.values(state.job.outcomes).filter((outcome) => outcome === 'queued').length
      return waiting === 0 ? null : fail('casesEvaluated', `${waiting} of ${INVOICE_CASES.length} cases have no outcome yet.`)
    },
    apply: (state) => ({ ...state, job: { ...state.job, status: 'partiallyComplete' }, running: { ...state.running, job: false } }),
    to: () => 'ST11',
  },
  APPROVE: { from: IN('ST11'), guard: (state, { invoice }) => decisionGuard(state, invoice), apply: decide('approved') },
  REJECT: { from: IN('ST11'), guard: (state, { invoice }) => decisionGuard(state, invoice), apply: decide('rejected') },
  REQUEST_CHANGES: { from: IN('ST11'), guard: (state, { invoice }) => decisionGuard(state, invoice), apply: decide('changesRequested') },
  VERIFY_READBACK: {
    from: IN('ST11'),
    guard: (state, { invoice }) => {
      if (invoice === UNKNOWN_INVOICE.invoice) {
        return fail('readback', `${invoice} stays held: no independent readback exists for an Outcome Unknown case. ${COPY.resubmissionUnavailable}.`)
      }
      if (invoice !== APPROVAL_INVOICE.invoice) return fail('target', `${invoice} has no approval to read back.`)
      if (state.approval.decision !== 'approved') return fail('approval', 'Readback follows an approval, and no approval is recorded.')
      return state.readback.status === 'verified' ? fail('readback', 'The approval is already independently verified.') : null
    },
    apply: (state, { invoice, result }) => {
      if (result === 'mismatch') return { ...state, readback: { status: 'mismatch' } }
      return appendAudit(withOutcome({ ...state, readback: { status: 'verified' } }, invoice, 'verified'), 'A07')
    },
  },
  NEXT_CYCLE_INCIDENT: {
    from: IN('ST11'),
    guard: (state) => {
      if (state.approval.decision !== 'approved') return fail('approval', 'The incident arrives after the approval is recorded and verified; no approval is recorded.')
      return state.readback.status === 'verified' ? null : fail('readback', 'The incident arrives only after independent readback verifies the approval.')
    },
    apply: (state) => ({ ...state, incident: { ...state.incident, status: 'open' } }),
    to: () => 'ST12',
  },

  // -- ST12 and ST13: containment, correction, repair ---------------------------------
  CONTAIN_INCIDENT: {
    from: IN('ST12'),
    guard: (state, { caseIds }) => {
      const exact = caseIds.length === affectedIds.length && affectedIds.every((id) => caseIds.includes(id))
      if (!exact) return fail('containment', `Containment must pause exactly the three affected Kestrel cases: ${affectedIds.join(', ')}.`)
      if (state.incident.status !== 'open') return fail('containment', 'INC-0042 is not open for containment.')
      return requireAuth(state, 'contain-incident', 1, INCIDENT.id)
    },
    apply: (state, { caseIds }) => appendAudit({ ...state, theme: 'dark', incident: { ...state.incident, status: 'contained', containedCaseIds: [...caseIds] } }, 'A08'),
  },
  COMPLETE_CASE_MANUALLY: {
    from: IN('ST12'),
    guard: (state, { caseId }) => {
      if (state.incident.status !== 'contained') return fail('containment', 'Contain and pause the three Kestrel cases before a case is completed manually.')
      if (!affectedIds.includes(caseId)) return fail('target', `${caseId} is not an affected Kestrel case.`)
      if (state.incident.manualCompletions.includes(caseId)) return fail('manualCorrection', `${caseId} is already completed manually.`)
      return requireAuth(state, 'complete-case-manually', 1, caseId)
    },
    apply: (state, { caseId }) => ({ ...state, incident: { ...state.incident, manualCompletions: [...state.incident.manualCompletions, caseId] } }),
  },
  TEACH: {
    from: IN('ST12'),
    guard: (state) => {
      if (state.incident.status !== 'contained') return fail('containment', 'Contain and pause the three Kestrel cases before teaching.')
      if (!state.incident.manualCompletions.includes(INCIDENT.correction.caseId)) {
        return fail('manualCorrection', `${INCIDENT.correction.caseId} must be completed manually before the correction is taught.`)
      }
      return (
        requireAuth(state, 'record-correction', 0, INCIDENT.correction.caseId) ??
        (state.ui.incident.answer === 'yes' && state.ui.incident.ruleLinked
          ? null
          : fail('correctionDraft', 'Answer Yes and link AP-RULE-017 before saving: the correction is recorded only from a complete answer with its source.'))
      )
    },
    // A correction is evidence: no policy, threshold or grant changes here.
    apply: (state) => appendAudit({ ...state, incident: { ...state.incident, correctionRecorded: true } }, 'A09'),
    to: () => 'ST13',
  },
  VALIDATE_SCOPE: {
    from: IN('ST13'),
    guard: (state, { scope }) => {
      if (scope !== REPAIR.scope) return fail('scopeValidated', `The repair scope must be exactly "${REPAIR.scope}".`)
      if (state.repair.scopeValidated) return fail('scopeValidated', 'The repair scope is already validated.')
      return requireAuth(state, 'validate-scope', 1, REPAIR.id)
    },
    apply: (state) => appendAudit({ ...state, repair: { ...state.repair, scopeValidated: true } }, 'A10'),
  },
  PROPOSE_REPAIR: {
    from: IN('ST13'),
    guard: (state) => (state.repair.scopeValidated ? requireAuth(state, 'propose-repair', 1, REPAIR.id) : fail('scopeValidated', `Validate the bounded scope "${REPAIR.scope}" before proposing a repair.`)),
    apply: (state) => ({
      ...state,
      repair: { ...state.repair, proposed: true },
      agent: { ...state.agent, versions: [...state.agent.versions, 'agent-v1.1'] },
    }),
    to: () => 'ST14',
  },

  // -- ST14 and ST15: regression, release, expansion ------------------------------------
  RUN_REGRESSION: {
    from: IN('ST14'),
    guard: (state) => {
      const run = latestRun(state)
      if (run?.suiteId === REGRESSION_SUITE_ID && run.status === 'running') return fail('run', 'The regression is already running.')
      if (regressionPasses(run)) return fail('regression', 'The regression already passed.')
      return requireAuth(state, 'run-simulation', 0, REGRESSION_SUITE_ID)
    },
    apply: (state) => ({ ...startRun(state, 'agent-v1.1', REGRESSION_SUITE_ID), running: { ...state.running, regression: true } }),
  },
  CANCEL_REGRESSION: {
    from: IN('ST14'),
    guard: (state) => runningGuard(state, REGRESSION_SUITE_ID, 'regression') ?? requireAuth(state, 'run-simulation', 0, REGRESSION_SUITE_ID),
    apply: (state) => ({ ...settleRun(state, 'cancelled', []), running: { ...state.running, regression: false } }),
  },
  COMPLETE_REGRESSION: {
    from: IN('ST14'),
    guard: (state, { results }) => {
      const running = runningGuard(state, REGRESSION_SUITE_ID, 'regression')
      if (running) return running
      const ids = results.map((result) => result.id)
      const complete = ids.length === REGRESSION_SIZE && new Set(ids).size === REGRESSION_SIZE && ids.every((id) => regressionIds.has(id))
      return complete ? null : fail('regression', `Regression evidence is incomplete: it needs one result for each of the ${REGRESSION_SIZE} scenarios.`)
    },
    apply: (state, { results }) => {
      const settled = { ...settleRun(state, 'complete', results), running: { ...state.running, regression: false } }
      return appendAudit(settled, 'A11')
    },
  },
  LIMITED_RELEASE: {
    from: IN('ST14'),
    guard: (state) => {
      const run = latestRun(state)
      if (run?.suiteId !== REGRESSION_SUITE_ID || run.status !== 'complete') {
        return fail('regression', `Limited release needs a completed regression with ${REGRESSION_SIZE} intended outcomes; none has completed.`)
      }
      if (!regressionPasses(run)) {
        return fail('regression', `Limited release needs ${REGRESSION_SIZE} intended outcomes and 0 failed; the latest run has ${runSummary(run).failed} failed.`)
      }
      if (!state.repair.scopeValidated) return fail('scopeValidated', 'The bounded repair scope is not validated.')
      return requireAuth(state, 'authorize-limited-release', 2, AGENT_V11_OBJECT, KESTREL_SCOPE)
    },
    apply: (state) =>
      appendAudit({ ...state, release: { stage: 'limited', cohort: ['pending', 'pending', 'pending'], stoppedBy: null } }, 'A12'),
    to: () => 'ST15',
  },
  VERIFY_COHORT_OUTCOME: {
    from: IN('ST15'),
    guard: (state, { index }) => {
      if (!Number.isInteger(index) || index < 0 || index >= state.release.cohort.length) return fail('target', `Cohort outcome ${index} does not exist.`)
      return state.release.cohort[index] === 'pending' ? null : fail('cohort', `Cohort outcome ${index + 1} is already verified.`)
    },
    apply: (state, { index, result }) => {
      if (result !== 'verified') return { ...state, release: { ...state.release, stoppedBy: state.release.stoppedBy ?? result } }
      const cohort = state.release.cohort.map((outcome, i) => (i === index ? ('verified' as const) : outcome))
      const next = { ...state, release: { ...state.release, cohort } }
      return cohort.every((outcome) => outcome === 'verified') ? appendAudit(next, 'A13') : next
    },
  },
  EXPAND_RELEASE: {
    from: IN('ST15'),
    guard: (state) => {
      if (state.release.stage === 'expanded') return fail('expansion', 'The release is already expanded.')
      if (state.release.stoppedBy !== null) return fail('cohort', `Expansion is blocked: a ${state.release.stoppedBy} outcome stopped the release.`)
      const verified = state.release.cohort.filter((outcome) => outcome === 'verified').length
      if (verified < state.release.cohort.length || state.release.cohort.length === 0) {
        return fail('cohort', `Expansion needs 3/3 independently verified outcomes; ${verified}/3 are verified.`)
      }
      return requireAuth(state, 'expand-and-close', 2, INCIDENT.id)
    },
    // Expansion is the owner's decision. It never closes the incident: closure is its own, later action.
    apply: (state) => ({ ...state, release: { ...state.release, stage: 'expanded' } }),
  },
  CLOSE_INCIDENT: {
    from: IN('ST15'),
    guard: (state) => {
      if (state.release.stage !== 'expanded') return fail('expansion', 'Closure follows the owner\u2019s expansion: expand the release first.')
      if (state.release.stoppedBy !== null) return fail('cohort', `Closure is blocked: a ${state.release.stoppedBy} outcome stopped the release.`)
      return requireAuth(state, 'expand-and-close', 2, INCIDENT.id)
    },
    apply: (state) => appendAudit({ ...state, incident: { ...state.incident, status: 'closed', disposition: REPAIR.release.disposition } }, 'A14'),
    to: () => 'ST16',
  },

  // -- ST16 to ST24: montage (navigation only) --------------------------------------
  OPEN_MONTAGE: { from: IN('ST16'), guard: () => null, apply: (state) => state, to: () => 'ST17' },
  NEXT: {
    from: IN('ST17', 'ST18', 'ST19', 'ST20', 'ST21', 'ST22', 'ST23'),
    guard: () => null,
    apply: (state) => state,
    to: (next) => nextPhase(next.phase),
  },
  REQUEST_APPROVAL: {
    from: IN('ST20'),
    guard: (state) => {
      const actor = person(state.actorId)
      if (actor.role === null) return fail('actor', `${actor.name} is an external supplier representative and cannot request approval.`)
      return state.unsafeRequest === 'blocked' ? null : fail('decision', state.unsafeRequest === 'requested' ? 'Approval is already requested; the action stays blocked until Daniel Okafor decides.' : 'The request was denied; the action stays blocked.')
    },
    // A request is not an execution: the blocked 12% discount stays blocked pending Tier 3.
    apply: (state) => ({ ...state, unsafeRequest: 'requested' }),
  },
  // Only a denial is modelled: an authorized approval is never depicted (APP-09), and nobody holds the apply-discount grant.
  DENY_UNSAFE_REQUEST: {
    from: IN('ST20'),
    guard: (state) => {
      if (state.actorId !== 'daniel') return fail('actor', 'Only the named approver, Daniel Okafor, decides the request.')
      return state.unsafeRequest === 'requested' ? null : fail('decision', 'There is no request to decide: request approval first.')
    },
    apply: (state) => ({ ...state, unsafeRequest: 'denied' }),
  },
  EXPORT_AUDIT_PACK: {
    from: IN('ST23', 'ST24'),
    guard: (state) => (state.audit.includes('A15') ? fail('target', 'The audit pack is already exported.') : requireAuth(state, 'export-audit', 0, AUDIT_PACK_OBJECT)),
    apply: (state) => patchBreadth(appendAudit(state, 'A15'), { audit: { step: 'closed' } }),
  },

  // -- BOB-11 breadth screens (presentation; RESTORE_VERSION is the one business action) ---------------------
  SET_MAP_VIEW: {
    from: ANY,
    guard: (_state, { view }) => (MAP_VIEWS.includes(view) ? null : fail('target', `${String(view)} is not a map view.`)),
    apply: (state, { view }) => patchBreadth(state, { map: { ...state.ui.breadth.map, view } }),
  },
  SELECT_MAP_NODE: {
    from: ANY,
    guard: (_state, { node }) => (node === null || OPERATIONS_NODES.some((candidate) => candidate.id === node) ? null : fail('target', `${String(node)} is not a node of the Operations Map.`)),
    apply: (state, { node }) => patchBreadth(state, { map: { ...state.ui.breadth.map, selected: node } }),
  },
  SET_VERSION_VIEW: {
    from: ANY,
    guard: (state, { compare, restore, hint }) => {
      if (compare !== undefined && compare !== null && compare !== 'evaluation' && compare !== 'repair') return fail('target', `${String(compare)} is not a version comparison.`)
      if (restore !== undefined && restore !== 'closed' && restore !== 'confirm') return fail('target', `${String(restore)} is not a restore state.`)
      if (hint !== undefined && typeof hint !== 'boolean') return fail('target', 'The restore explanation is shown or hidden.')
      return restore === 'confirm' && state.restoredVersion !== null ? fail('version', 'The previous approved version is already restored for future jobs.') : null
    },
    apply: (state, { compare, restore, hint }) => {
      const { versions } = state.ui.breadth
      return patchBreadth(state, { versions: { compare: compare === undefined ? versions.compare : compare, restore: restore ?? versions.restore, hint: hint ?? versions.hint } })
    },
  },
  RESTORE_VERSION: {
    from: IN('ST21', 'ST22', 'ST23', 'ST24'),
    guard: (state) => {
      if (state.ui.breadth.versions.restore !== 'confirm') return fail('version', 'Open the restore confirmation first: a restore needs an explicit confirmation of its future-only scope.')
      if (state.restoredVersion !== null) return fail('version', 'The previous approved version is already restored for future jobs.')
      return requireAuth(state, 'restore-version', 2, AGENT_NAME)
    },
    // Future jobs only: no committed ERP transaction, readback, incident or audit record is touched.
    apply: (state) => patchBreadth({ ...state, restoredVersion: 'agent-v1.0' }, { versions: { ...state.ui.breadth.versions, restore: 'closed' } }),
  },
  SET_POLICY_VIEW: {
    from: ANY,
    guard: (_state, { tests }) => (typeof tests === 'boolean' ? null : fail('target', 'The boundary tests are shown or hidden.')),
    apply: (state, { tests }) => patchBreadth(state, { policy: { tests } }),
  },
  SET_COMMAND_VIEW: {
    from: ANY,
    guard: (_state, { tab, snapshot, detail }) => {
      if (tab !== undefined && tab !== 'command' && tab !== 'xray') return fail('target', `${String(tab)} is not a Command Center tab.`)
      if (snapshot !== undefined && snapshot !== 'current' && snapshot !== 'before') return fail('target', `${String(snapshot)} is not a Job snapshot.`)
      return detail === undefined || detail === null || detail === 'job' || detail === 'incident' ? null : fail('target', `${String(detail)} is not a Command Center detail.`)
    },
    apply: (state, { tab, snapshot, detail }) => {
      const { command } = state.ui.breadth
      return patchBreadth(state, { command: { tab: tab ?? command.tab, snapshot: snapshot ?? command.snapshot, detail: detail === undefined ? command.detail : detail } })
    },
  },
  SET_AUDIT_EXPORT: {
    from: ANY,
    guard: (state, { step }) => {
      if (step !== 'closed' && step !== 'drawer' && step !== 'confirm') return fail('target', `${String(step)} is not an export step.`)
      if (step === 'confirm' && state.ui.breadth.audit.step !== 'drawer') return fail('target', 'Preview the export scope in the drawer before confirming.')
      return step === 'confirm' && state.audit.includes('A15') ? fail('target', 'The audit pack is already exported.') : null
    },
    apply: (state, { step }) => patchBreadth(state, { audit: { step } }),
  },
  SET_NOTIFICATION_VIEW: {
    from: ANY,
    guard: (state, { filter, open }) => {
      if (filter !== undefined && !NOTIFICATION_FILTERS.includes(filter)) return fail('target', `${String(filter)} is not a notification filter.`)
      if (open === undefined || open === null) return null
      if (!Object.hasOwn(NOTIFICATIONS, open)) return fail('target', `${String(open)} is not a known notice.`)
      return noticeOccurred(state, open) ? null : fail('target', `${open} has not been triggered yet: it appears only after its own event.`)
    },
    apply: (state, { filter, open }) => {
      const { notifications } = state.ui.breadth
      const read = open !== undefined && open !== null && !notifications.read.includes(open) ? [...notifications.read, open] : notifications.read
      return patchBreadth(state, { notifications: { ...notifications, filter: filter ?? notifications.filter, open: open === undefined ? notifications.open : open, read } })
    },
  },
  SURFACE_TOAST: {
    from: ANY,
    guard: (state, { id }) => {
      if (!Object.hasOwn(NOTIFICATIONS, id)) return fail('target', `${String(id)} is not a known notice.`)
      const showing = state.ui.breadth.notifications.toast
      if (showing !== null) return fail('target', `One toast at a time: ${showing} is showing; dismiss it before another surfaces.`)
      if (person(state.actorId).role === null) return fail('actor', 'An external supplier representative has no Oryn notifications.')
      if (state.notificationsDismissed.includes(id)) return fail('target', `${id} was dismissed.`)
      return noticeOccurred(state, id) ? null : fail('target', `${id} has not been triggered yet: it appears only after its own event.`)
    },
    apply: (state, { id }) => patchBreadth(state, { notifications: { ...state.ui.breadth.notifications, toast: id } }),
  },
  // Dismissing a toast hides the toast only: the notice, its object and any decision stay as they were.
  DISMISS_TOAST: {
    from: ANY,
    guard: (state) => (state.ui.breadth.notifications.toast === null ? fail('target', 'No toast is showing.') : null),
    apply: (state) => patchBreadth(state, { notifications: { ...state.ui.breadth.notifications, toast: null } }),
  },
  SET_CAPABILITY_VIEW: {
    from: ANY,
    guard: (_state, { view, selected }) => {
      if (view !== undefined && view !== 'matrix' && view !== 'tiles') return fail('target', `${String(view)} is not a capability view.`)
      if (selected === undefined || selected === null) return null
      const row = CAPABILITY_MATRIX.find((candidate) => candidate.application === selected.application)
      return row && Object.hasOwn(row.capabilities, selected.capability) ? null : fail('target', `${String(selected.application)} \u00b7 ${String(selected.capability)} is not a cell of the capability matrix.`)
    },
    apply: (state, { view, selected }) => {
      const { capability } = state.ui.breadth
      return patchBreadth(state, { capability: { view: view ?? capability.view, selected: selected === undefined ? capability.selected : selected } })
    },
  },
  // Closing the OS banner dismisses the notification only: the hold on the unknown outcome is job state and stays.
  DISMISS_TIMEOUT_BANNER: {
    from: ANY,
    guard: () => null,
    apply: (state) => patchBreadth(state, { timeout: { dismissed: true } }),
  },
  RESET: {
    from: IN('ST24'),
    guard: () => null,
    apply: (state) => createInitialState({ grants: state.authority.grants, threshold: state.policy.threshold }),
  },
}

