import type { DecisionState } from '@/data/approval'
import type { Capability, CapabilityApplication } from '@/data/capabilities'
import type { ConsentState } from '@/data/consent'
import type { NotificationId } from '@/data/notifications'
import type { OperationsNodeId } from '@/data/operations-graph'
import type { PersonId, SupplierId } from '@/data/people'
import type { RegressionResult } from '@/data/regression'
import type { StatusId } from '@/data/status'
import type { VersionComparison, VersionId } from '@/data/versions'

/**
 * RT-01 / RT-02 types. Everything here is plain, serialisable data: the film replays an
 * ordered action list from `createInitialState`, so state never holds functions, dates or
 * handles. `readonly` everywhere: the reducer never mutates its input.
 */

export const STATE_IDS = [
  'ST01', 'ST02', 'ST03', 'ST04', 'ST05', 'ST06', 'ST07', 'ST08',
  'ST09', 'ST10', 'ST11', 'ST12', 'ST13', 'ST14', 'ST15', 'ST16',
  'ST17', 'ST18', 'ST19', 'ST20', 'ST21', 'ST22', 'ST23', 'ST24',
] as const
export type StateId = (typeof STATE_IDS)[number]

export const SCREEN_IDS = [
  'SC01', 'SC02', 'SC03', 'SC04', 'SC05', 'SC06', 'SC07', 'SC08', 'SC09', 'SC10',
  'SC11', 'SC12', 'SC13', 'SC14', 'SC15', 'SC16', 'SC17', 'SC18', 'SC19', 'SC20',
  'SC21', 'SC22', 'SC23', 'SC24', 'SC25', 'SC26', 'SC27', 'SC28', 'SC29', 'SC30',
  'SC31', 'SC32', 'SC33', 'SC34', 'SC35', 'SC36', 'SC37',
] as const
export type ScreenId = (typeof SCREEN_IDS)[number]

export type Theme = 'light' | 'dark'

/** People whose own observation consent the reducer tracks (DAT-01 Employees). */
export type EmployeeId = 'priya' | 'jamal'
export const EMPLOYEE_IDS: readonly EmployeeId[] = ['priya', 'jamal']

/** One meeting at a time is modelled: the Kestrel Zoom call (DAT-08). */
export type MeetingId = 'zoom-kestrel'
export type MeetingConsent = 'absent' | 'granted' | 'denied'

export type DemonstrationId = 'D1' | 'D2' | 'D3'

// ---------------------------------------------------------------------------
// RT-02: authority
// ---------------------------------------------------------------------------

export type Tier = 0 | 1 | 2 | 3

export type AuthAction =
  | 'publish-playbook'
  | 'create-agent'
  | 'run-simulation'
  | 'approve-release'
  | 'confirm-scope'
  | 'start-job'
  | 'approve-variance'
  | 'contain-incident'
  | 'complete-case-manually'
  | 'record-correction'
  | 'validate-scope'
  | 'propose-repair'
  | 'authorize-limited-release'
  | 'expand-and-close'
  | 'export-audit'
  | 'apply-discount'
  | 'restore-version'

/**
 * An explicit grant or delegation. A role label never appears here: authority is a fact
 * about a person, an action, a ceiling tier, an object and a scope.
 */
export interface Grant {
  readonly id: string
  readonly holderId: PersonId
  readonly action: AuthAction
  readonly maxTier: Tier
  /** Exact object id, or `*` for every object of this action. */
  readonly object: string
  /** Team or organization the grant covers. An organization-wide grant covers its teams. */
  readonly scope: string
  readonly status: 'valid' | 'expired' | 'revoked'
  /** Variance threshold the delegation was issued under; only policy-bound grants set it. */
  readonly policyThreshold?: string
}

export interface AuthRequest {
  readonly actorId: PersonId
  readonly action: AuthAction
  readonly tier: Tier
  readonly object: string
  readonly scope: string
}

export type AuthGuard = 'actor' | 'external' | 'grant' | 'status' | 'tier' | 'object' | 'scope' | 'policy'

export type AuthDecision =
  | { readonly allowed: true; readonly grantId: string }
  | { readonly allowed: false; readonly guard: AuthGuard; readonly reason: string }

// ---------------------------------------------------------------------------
// State slices. Each concern is its own field; nothing is derived-and-stored.
// ---------------------------------------------------------------------------

export interface PersonConsent extends ConsentState {
  /** Declining the notice is a recorded choice; capture stays off until it is accepted. */
  readonly noticeDeclined: boolean
  /** Per-meeting consent. Capture consent never implies it, and it never implies capture. */
  readonly meetings: Readonly<Record<MeetingId, MeetingConsent>>
}

export type CommitmentStatus = 'absent' | 'proposed' | 'edited' | 'confirmed'
export interface CommitmentState {
  readonly status: CommitmentStatus
  /** Current due value shown to the user. */
  readonly due: string | null
  /** Set only by confirmation; the reminder and notice read this value. */
  readonly confirmedDue: string | null
}

export type ScenarioVerdict = RegressionResult['verdict']
export type RunStatus = 'running' | 'complete' | 'cancelled'
export type EvaluationVersionId = Extract<VersionId, 'agent-v0.1' | 'agent-v0.2' | 'agent-v1.1'>
export type SuiteId = 'SIM-AP-RECON' | 'SIM-AP-RECON-34'

/** An immutable evaluation. A cancelled or running run never holds verdicts. */
export interface EvaluationRun {
  readonly id: string
  readonly versionId: EvaluationVersionId
  readonly suiteId: SuiteId
  readonly status: RunStatus
  readonly results: readonly RegressionResult[]
}

export interface AgentState {
  /** Versions that exist so far, in creation order. Released versions are never mutated. */
  readonly versions: readonly VersionId[]
  /** Version a job is pinned to once released; null until release. */
  readonly pinned: VersionId | null
  readonly releaseApproved: boolean
  readonly scopeConfirmed: boolean
}

export type CaseOutcome = StatusId | 'queued'
export type JobStatus = 'notStarted' | 'running' | 'partiallyComplete'
export interface JobState {
  readonly status: JobStatus
  /** Outcome per invoice. Counts are derived from this record, never stored. */
  readonly outcomes: Readonly<Record<string, CaseOutcome>>
}

export interface ApprovalState {
  readonly decision: DecisionState
  readonly by: PersonId | null
  readonly grantId: string | null
}

/** Independent readback is separate from the approval that precedes it. */
export type ReadbackStatus = 'none' | 'pending' | 'verified' | 'mismatch'
export interface ReadbackState {
  readonly status: ReadbackStatus
}

export type IncidentStatus = 'none' | 'open' | 'contained' | 'closed'
export interface IncidentState {
  readonly status: IncidentStatus
  readonly containedCaseIds: readonly string[]
  readonly manualCompletions: readonly string[]
  /** Correction is evidence: recording it never changes policy or permissions. */
  readonly correctionRecorded: boolean
  readonly disposition: string | null
}

export interface RepairState {
  readonly scopeValidated: boolean
  readonly proposed: boolean
}

export type ReleaseStage = 'none' | 'limited' | 'expanded'
export type CohortOutcome = 'pending' | 'verified'
export interface ReleaseState {
  readonly stage: ReleaseStage
  /** Three independent cohort outcomes; no identities are invented. */
  readonly cohort: readonly CohortOutcome[]
  /** Set by an unknown outcome or a regression. Expansion is blocked while set. */
  readonly stoppedBy: 'unknown' | 'regression' | null
}

export interface PolicyState {
  /** Threshold currently in force for variance approval. */
  readonly threshold: string
  /** DAT-09 policy change marked at ST19. Separate from any correction. */
  readonly revalidationMarked: boolean
}

export type UnsafeRequestStatus = 'blocked' | 'requested' | 'denied'

export interface PhaseRecord {
  readonly phase: StateId
  readonly enteredBy: ActionType | 'INIT'
  readonly enteredAtStep: number
  readonly exitedBy: ActionType | null
  readonly exitedAtStep: number | null
}

export type GuardId =
  | 'action'
  | 'phase'
  | 'actor'
  | 'authority'
  | 'notice'
  | 'category'
  | 'paused'
  | 'declined'
  | 'meetingConsent'
  | 'contribution'
  | 'target'
  | 'commitment'
  | 'contributorReview'
  | 'examples'
  | 'scenarios'
  | 'edgeCases'
  | 'ownerApproval'
  | 'ownerReview'
  | 'scopeConfirmation'
  | 'suiteSealed'
  | 'run'
  | 'casesEvaluated'
  | 'record'
  | 'meeting'
  | 'guide'
  | 'decision'
  | 'threshold'
  | 'approval'
  | 'readback'
  | 'containment'
  | 'manualCorrection'
  | 'scopeValidated'
  | 'regression'
  | 'cohort'
  | 'route'
  | 'intent'
  | 'selection'
  | 'jobScope'
  | 'correctionDraft'
  | 'expansion'
  | 'version'

export interface Rejection {
  readonly action: ActionType
  readonly guard: GuardId
  /** Human-readable, specific to the failed guard. */
  readonly reason: string
}

// ---------------------------------------------------------------------------
// Presentation slice (BOB-04). Menus, the enrollment step, the delete dialog and the
// browser tab are state, not component-local, so the clickable app and the film replay
// the same ordered actions. None of it carries business authority.
// ---------------------------------------------------------------------------

export const WIZARD_STEPS = ['notice', 'capture', 'scope'] as const
/** SC02 steps: Notice, Capture and sharing, Work scope. */
export type WizardStep = (typeof WIZARD_STEPS)[number]

export const APP_TAB_IDS = ['gmail', 'netsuite', 'tracker', 'slack', 'zoom', 'hubspot'] as const
/** APP-11 browser tabs. */
export type AppTabId = (typeof APP_TAB_IDS)[number]

/** One floating surface at a time: the role selector, the search palette or the companion menu. */
export type OverlayId = 'role' | 'search' | 'companion'

/** APP-12 foreground window. `excluded` is a window the mandatory exclusions keep out of evidence. */
export type ForegroundWindow = 'work' | 'excluded'

// ---------------------------------------------------------------------------
// Presentation slice (BOB-05): the original work applications. One current record drives the
// Gmail message, its document, the NetSuite bill, and the tracker/Slack references together, so
// an identity and its evidence can never be selected apart.
// ---------------------------------------------------------------------------

/** The four invoice contexts the work surfaces show: hero, problem montage, Demonstration D1, Kestrel layout change. */
export const RECORD_IDS = ['INV-48219', 'INV-48210', 'INV-48203', 'INV-48231'] as const
export type RecordId = (typeof RECORD_IDS)[number]

export type MailView = 'inbox' | 'message'
/** `compare` overlaps the earlier and the current Kestrel layouts; it applies to INV-48231 only. */
export type DocumentView = 'single' | 'compare'
/** NetSuite: the vendor bill and its purchase order, the vendor list, or one vendor record. */
export type ErpView = 'bill' | 'vendors' | 'vendor'

/** AP Exceptions Tracker rows (APP-06) and columns. A row is a handoff, never a readback. */
export const TRACKER_INVOICES = ['INV-48203', 'INV-48210', 'INV-48215', 'INV-48218', 'INV-48219', 'INV-48220'] as const
export type TrackerInvoice = (typeof TRACKER_INVOICES)[number]
export const TRACKER_COLUMNS = ['invoice', 'supplier', 'issue', 'owner', 'state'] as const
export type TrackerColumn = (typeof TRACKER_COLUMNS)[number]

/** APP-08 transcript quotation revealed so far: Dana's statement first, then Priya's reply. */
export type MeetingQuote = 'none' | 'dana' | 'priya'
export type QuoteSpeaker = Exclude<MeetingQuote, 'none'>

/** SC04: the card kinds. One card at a time. */
export type HudKind = 'peerFix' | 'commitment'
export type HudPlacement = 'upper' | 'lower'
/** Entry of the card, set per cut: `short` is 150 ms and a 10 px vertical settle; `long` is 500 ms and a 20 px horizontal settle. */
export type HudMotion = 'short' | 'long'
/** Guide Me: closed, step 1 to 3, completed. Completing guidance never resolves the source case. */
export type HudGuide = 'closed' | 1 | 2 | 3 | 'completed'

export interface AppUiState {
  readonly record: RecordId
  readonly mail: MailView
  /** APP-02 viewer beside the open message. */
  readonly attachment: boolean
  readonly documentView: DocumentView
  readonly erp: ErpView
  /** Vendor record open in NetSuite; null unless `erp` is `vendor`. */
  readonly vendor: SupplierId | null
  readonly trackerFocus: { readonly invoice: TrackerInvoice; readonly column: TrackerColumn } | null
  readonly meeting: { readonly ended: boolean; readonly quote: MeetingQuote }
  readonly hud: { readonly placement: HudPlacement; readonly motion: HudMotion; readonly guide: HudGuide; readonly dismissed: readonly HudKind[] }
}

// ---------------------------------------------------------------------------
// Presentation slice (BOB-06): Workflow Discovery (SC13), candidate review (SC14) and the
// playbook (SC15). Selection, filter and the evidence drawer are state so the film replays them;
// none of it is authority. Contributor approval and owner-review requests are business actions.
// ---------------------------------------------------------------------------

/** SC13 filter chips. `needs-review` and `published` partition the one candidate by its status. */
export const DISCOVERY_FILTERS = ['all', 'needs-review', 'published'] as const
export type DiscoveryFilter = (typeof DISCOVERY_FILTERS)[number]

/** The drawer: a demonstration's sanitized source, the detail of one governing rule, the provenance of the release gate's verified examples, or the replay of the boundary scenario (SC20). */
export const DRAWER_KINDS = ['evidence', 'AP-RULE-009', 'AP-RULE-017', 'examples', 'replay'] as const
export type DrawerKind = (typeof DRAWER_KINDS)[number]

export interface DiscoveryUiState {
  readonly filter: DiscoveryFilter
  /** The candidate row is selected (highlighted) before its review opens. */
  readonly candidateSelected: boolean
  /** The demonstration whose card and evidence are selected. */
  readonly demonstration: DemonstrationId | null
  /** Open drawer, or null. The rule drawer belongs to SC14, SC15 and SC17, the evidence drawer to SC14 and SC15, the examples drawer to SC18; leaving the screen closes it. */
  readonly drawer: DrawerKind | null
}

/** BOB-07 Agent Factory (SC17). The intent text is presentation until `CREATE_AGENT` turns it into a candidate; it grants no authority. */
export interface FactoryUiState {
  readonly intent: string
}

/**
 * BOB-08 Flight Simulator (SC19) and results (SC20). Presentation only: none of it carries authority or a verdict.
 * `view` is the 4x7 tile grid or the film-only row stream of the same 28 scenarios; `runLabel` is the cut's
 * wording of the one guarded run action; `runFrames` is the film frames a started run takes to execute the
 * suite (the clickable app ticks the same count) and `runLead` the frames the run had already executed when its
 * action landed (a film that continues a run begun in the clip before); `compare` shows the two versions side
 * by side on SC20.
 */
export const SIMULATOR_VIEWS = ['grid', 'stream'] as const
export type SimulatorView = (typeof SIMULATOR_VIEWS)[number]
export const RUN_LABELS = ['Run scenarios', 'Run Evaluation'] as const
export type RunLabel = (typeof RUN_LABELS)[number]
export const RUN_FRAMES_MAX = 300
export interface SimulatorUiState {
  readonly view: SimulatorView
  readonly runLabel: RunLabel
  readonly runFrames: number
  readonly runLead: number
  readonly compare: boolean
}

/**
 * BOB-09 Jobs (SC21), job progress (SC22), the approval and unknown drawers (SC23, SC24) and the job summary (SC25).
 * Presentation only: none of it carries authority or an outcome. `selection` is the fixed population of 11 invoices
 * (proposed until `CONFIRM_SELECTION`), `dialog` is the `Confirm job scope` dialog, `startCancelled` records that the
 * operator cancelled it (nothing started), `filter` is the SC25 category filter applied to SC22, and `investigating`,
 * `tip` and `evidence` are the open disclosures of SC24 (investigation, the resubmission note) and SC23 (evidence and authority).
 */
export const JOB_FILTERS = ['all', 'verified', 'escalated', 'approval', 'unknown'] as const
export type JobFilter = (typeof JOB_FILTERS)[number]
export interface JobUiState {
  readonly selection: 'proposed' | 'confirmed'
  readonly dialog: 'closed' | 'open'
  readonly startCancelled: boolean
  readonly filter: JobFilter
  readonly investigating: boolean
  readonly tip: boolean
  readonly evidence: boolean
  /** SC25: `current` is the live snapshot; `before` keeps the time-stamped preapproval snapshot on screen after the readback (a stored view of an earlier state, never a verdict). */
  readonly snapshot: 'current' | 'before'
}

/**
 * BOB-10 Incident Center (SC26), Teach Oryn What Changed (SC27), the repair proposal and regression (SC28) and the
 * limited release (SC29). Presentation only: none of it carries authority or an outcome. `evidence` opens the
 * single-case evidence of `selectedCase` on SC26; `outcome` is the watched cohort outcome (0 to 2) whose independent
 * readback evidence is open on SC29; `answer` and `ruleLinked` are the unsaved correction draft on SC27. Saving it
 * (`TEACH`) needs both: a correction is evidence, never policy, and only that explicit action records it.
 */
export type TeachAnswer = 'none' | 'yes'
export interface IncidentUiState {
  readonly evidence: boolean
  readonly outcome: 0 | 1 | 2 | null
  readonly answer: TeachAnswer
  readonly ruleLinked: boolean
}

export interface UiState {
  readonly wizardStep: WizardStep
  /** SC02 `Review notice` disclosure. Expanding it is never consent. */
  readonly noticeExpanded: boolean
  readonly overlay: OverlayId | null
  readonly searchQuery: string
  readonly deleteDialog: 'closed' | 'confirm'
  /** Set only by a confirmed local deletion. Shared contributions and published knowledge are not touched. */
  readonly localHistoryDeleted: boolean
  readonly activeTab: AppTabId
  /** Tabs left behind by selection, newest last; Back pops it. */
  readonly tabHistory: readonly AppTabId[]
  readonly foreground: ForegroundWindow
  /** SC11 deadline field text while it is being edited; null when no edit is in progress. Never the commitment itself. */
  readonly deadlineDraft: string | null
  /** BOB-05 work surfaces (APP-01 to APP-08, SC04). Presentation only: none of it carries business authority. */
  readonly app: AppUiState
  /** BOB-06 Workflow Discovery, candidate review and playbook (SC13-SC15). Presentation only. */
  readonly discovery: DiscoveryUiState
  /** BOB-07 Agent Factory intent (SC17). Presentation only. */
  readonly factory: FactoryUiState
  /** BOB-08 Flight Simulator and results (SC19, SC20). Presentation only. */
  readonly simulator: SimulatorUiState
  /** BOB-09 Jobs, job progress, approval and unknown drawers and the job summary (SC21-SC25). Presentation only. */
  readonly job: JobUiState
  /** BOB-10 Incident Center, teaching, repair and release (SC26-SC29). Presentation only. */
  readonly incident: IncidentUiState
  /** BOB-11 breadth screens (SC16, SC30 to SC36, APP-13). Presentation only. */
  readonly breadth: BreadthUiState
}

/**
 * BOB-11 breadth screens: Operations Map (SC16), version history (SC30), policy change (SC31), Command Center and
 * 14-Day X-Ray (SC33), audit and export (SC34), notifications and the one-at-a-time toast (SC35), the application
 * capability matrix (SC36, APP-10) and the OS timeout banner (APP-13). Presentation only: none of it carries
 * authority or an outcome. A restore, an export and a request for approval are business actions with their own
 * guards; everything here is selection, disclosure and view.
 */
export type MapView = 'graph' | 'table'
export type CommandTab = 'command' | 'xray'
export type CommandSnapshot = 'current' | 'before'
export type CommandDetail = 'job' | 'incident'
export type AuditExportStep = 'closed' | 'drawer' | 'confirm'
export const NOTIFICATION_FILTERS = ['all', 'approvals', 'incidents', 'reminders'] as const
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number]
export type CapabilityView = 'matrix' | 'tiles'
export interface CapabilityCell {
  readonly application: CapabilityApplication
  readonly capability: Capability
}
export interface BreadthUiState {
  /** SC16: the graph or its keyboard-equivalent table, and the selected node (null: none). */
  readonly map: { readonly view: MapView; readonly selected: OperationsNodeId | null }
  /** SC30: the comparison shown (null: the timeline only) and the restore confirmation. */
  readonly versions: { readonly compare: VersionComparison | null; readonly restore: 'closed' | 'confirm'; readonly hint: boolean }
  /** SC31: the proposed boundary tests panel. */
  readonly policy: { readonly tests: boolean }
  /** SC33: the Command Center or the 14-Day X-Ray, the Job snapshot shown and the detail opened. */
  readonly command: { readonly tab: CommandTab; readonly snapshot: CommandSnapshot; readonly detail: CommandDetail | null }
  /** SC34: the export drawer and its confirmation. Export complete is the audit event A15, never this field. */
  readonly audit: { readonly step: AuditExportStep }
  /** SC35: filter, the one expanded notice, the notices opened (read) and the one toast (null: none). */
  readonly notifications: { readonly filter: NotificationFilter; readonly open: NotificationId | null; readonly read: readonly NotificationId[]; readonly toast: NotificationId | null }
  /** SC36 / APP-10: the matrix or the thirteen-tile view and the selected cell (its detail popover). */
  readonly capability: { readonly view: CapabilityView; readonly selected: CapabilityCell | null }
  /** APP-13: the OS banner was closed. Closing it never releases the hold. */
  readonly timeout: { readonly dismissed: boolean }
}

export interface State {
  /** Domain phase ST01–ST24. Never derived from the route. */
  readonly phase: StateId
  /** Count of accepted actions: the position in the replayable history. */
  readonly step: number
  readonly route: ScreenId
  readonly actorId: PersonId
  readonly theme: Theme
  /** Execution flags. They alone turn the arc cyan. */
  readonly running: { readonly simulation: boolean; readonly job: boolean; readonly regression: boolean }
  readonly consent: Readonly<Record<EmployeeId, PersonConsent>>
  readonly commitment: CommitmentState
  readonly demonstrations: Readonly<Record<DemonstrationId, 'observed' | 'approved'>>
  readonly playbookPublished: boolean
  /** Set by `REQUEST_OWNER_REVIEW`: the contributor who asked the owner to review. A request is not an approval. */
  readonly ownerReviewRequestedBy: EmployeeId | null
  readonly agent: AgentState
  readonly evaluations: readonly EvaluationRun[]
  readonly job: JobState
  readonly selectedCase: string | null
  readonly selectedScenario: string | null
  readonly approval: ApprovalState
  readonly readback: ReadbackState
  readonly incident: IncidentState
  readonly repair: RepairState
  readonly release: ReleaseState
  readonly policy: PolicyState
  readonly unsafeRequest: UnsafeRequestStatus
  /** The approved prior version future jobs are restored to, or null. Prior business effects are never undone. */
  readonly restoredVersion: VersionId | null
  readonly authority: { readonly grants: readonly Grant[] }
  readonly notificationsDismissed: readonly NotificationId[]
  /** Ordered ids of audit events that have happened. Definitions live in DAT-11. */
  readonly audit: readonly string[]
  /** ST01–ST24 entry and exit, append-only apart from closing the current record. */
  readonly history: readonly PhaseRecord[]
  /** Set by a rejected action; cleared by the next accepted one. */
  readonly rejection: Rejection | null
  /** Presentation only: menus, wizard step, dialogs, browser tab and desktop foreground. */
  readonly ui: UiState
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type Action =
  // Presentation: work applications (APP-01 to APP-08) and the SC04 card. Never change business state.
  | { readonly type: 'OPEN_MESSAGE'; readonly record: RecordId }
  | { readonly type: 'CLOSE_MESSAGE' }
  | { readonly type: 'OPEN_ATTACHMENT' }
  | { readonly type: 'CLOSE_ATTACHMENT' }
  | { readonly type: 'SET_DOCUMENT_VIEW'; readonly view: DocumentView }
  | { readonly type: 'OPEN_BILL'; readonly record: RecordId }
  | { readonly type: 'OPEN_ERP_VIEW'; readonly view: Exclude<ErpView, 'vendor'> }
  | { readonly type: 'OPEN_VENDOR'; readonly vendorId: SupplierId }
  | { readonly type: 'FOCUS_TRACKER_CELL'; readonly invoice: TrackerInvoice; readonly column: TrackerColumn }
  | { readonly type: 'SHOW_MEETING_QUOTE'; readonly speaker: QuoteSpeaker }
  | { readonly type: 'END_MEETING' }
  | { readonly type: 'OPEN_GUIDE' }
  | { readonly type: 'GUIDE_NEXT' }
  | { readonly type: 'GUIDE_BACK' }
  | { readonly type: 'GUIDE_DONE' }
  | { readonly type: 'DISMISS_HUD' }
  | { readonly type: 'PLACE_HUD'; readonly placement: HudPlacement; readonly motion?: HudMotion }
  | { readonly type: 'DRAFT_DEADLINE'; readonly text: string | null }
  | { readonly type: 'SELECT_CANDIDATE' }
  | { readonly type: 'SET_DISCOVERY_FILTER'; readonly filter: DiscoveryFilter }
  | { readonly type: 'SELECT_DEMONSTRATION'; readonly demoId: DemonstrationId }
  | { readonly type: 'OPEN_DRAWER'; readonly drawer: DrawerKind }
  | { readonly type: 'CLOSE_DRAWER' }
  // Presentation and selection: never change business state.
  | { readonly type: 'OPEN_SCREEN'; readonly screen: ScreenId }
  | { readonly type: 'SELECT_ACTOR'; readonly personId: PersonId }
  | { readonly type: 'SET_THEME'; readonly theme: Theme }
  | { readonly type: 'SELECT_CASE'; readonly caseId: string }
  | { readonly type: 'SELECT_SCENARIO'; readonly scenarioId: string | null }
  | { readonly type: 'DISMISS_NOTIFICATION'; readonly id: NotificationId }
  // Presentation: menus, the SC02 step, SC03 delete dialog, APP-11 tabs and APP-12 foreground.
  | { readonly type: 'WIZARD_NEXT' }
  | { readonly type: 'WIZARD_BACK' }
  | { readonly type: 'SET_NOTICE_EXPANDED'; readonly expanded: boolean }
  | { readonly type: 'SET_OVERLAY'; readonly overlay: OverlayId | null }
  | { readonly type: 'SET_SEARCH_QUERY'; readonly query: string }
  | { readonly type: 'OPEN_DELETE_DIALOG' }
  | { readonly type: 'CANCEL_DELETE' }
  | { readonly type: 'CONFIRM_DELETE_LOCAL_HISTORY' }
  | { readonly type: 'SELECT_APP_TAB'; readonly tab: AppTabId }
  | { readonly type: 'BROWSER_BACK' }
  | { readonly type: 'SET_FOREGROUND'; readonly window: ForegroundWindow }
  // Consent: each value is independent.
  | { readonly type: 'ACKNOWLEDGE_NOTICE' }
  | { readonly type: 'DECLINE_NOTICE' }
  | { readonly type: 'SET_CAPTURE_CATEGORY'; readonly category: 'workApplications' | 'visualObservation'; readonly enabled: boolean }
  | { readonly type: 'SET_CONTRIBUTION'; readonly enabled: boolean }
  | { readonly type: 'PAUSE_OBSERVATION' }
  | { readonly type: 'RESUME_OBSERVATION' }
  | { readonly type: 'GRANT_MEETING_CONSENT'; readonly meetingId: MeetingId }
  | { readonly type: 'DENY_MEETING_CONSENT'; readonly meetingId: MeetingId }
  // Lifecycle transitions and in-phase operations.
  | { readonly type: 'CONSENT' }
  | { readonly type: 'REVIEW_MEETING' }
  | { readonly type: 'EDIT_COMMITMENT'; readonly due: string }
  | { readonly type: 'CONFIRM_COMMITMENT' }
  | { readonly type: 'APPROVE_DEMONSTRATION'; readonly demoId: DemonstrationId }
  | { readonly type: 'REQUEST_OWNER_REVIEW' }
  | { readonly type: 'PUBLISH' }
  | { readonly type: 'SET_INTENT'; readonly text: string }
  | { readonly type: 'CREATE_AGENT' }
  | { readonly type: 'RUN_SIMULATION' }
  | { readonly type: 'CANCEL_SIMULATION' }
  | { readonly type: 'COMPLETE_SIMULATION' }
  | { readonly type: 'SET_SIMULATOR'; readonly view?: SimulatorView; readonly runLabel?: RunLabel; readonly runFrames?: number; readonly runLead?: number }
  | { readonly type: 'SET_COMPARE'; readonly open: boolean }
  | { readonly type: 'CONFIRM_SELECTION' }
  | { readonly type: 'OPEN_JOB_SCOPE' }
  | { readonly type: 'CANCEL_JOB_START' }
  | { readonly type: 'SET_JOB_FILTER'; readonly filter: JobFilter }
  | { readonly type: 'SET_JOB_VIEW'; readonly investigating?: boolean; readonly tip?: boolean; readonly evidence?: boolean; readonly snapshot?: 'current' | 'before' }
  | { readonly type: 'SET_INCIDENT_VIEW'; readonly evidence?: boolean; readonly outcome?: 0 | 1 | 2 | null }
  | { readonly type: 'SET_TEACH_ANSWER'; readonly answer: TeachAnswer }
  | { readonly type: 'LINK_TEACH_RULE'; readonly linked: boolean }
  | { readonly type: 'FIX_AND_RUN' }
  | { readonly type: 'APPROVE_RELEASE' }
  | { readonly type: 'CONFIRM_SCOPE' }
  | { readonly type: 'RELEASE_AND_START' }
  | { readonly type: 'EVALUATE_CASE'; readonly invoice: string }
  | { readonly type: 'PAUSE_FOR_APPROVAL' }
  | { readonly type: 'APPROVE'; readonly invoice: string }
  | { readonly type: 'REJECT'; readonly invoice: string }
  | { readonly type: 'REQUEST_CHANGES'; readonly invoice: string }
  | { readonly type: 'VERIFY_READBACK'; readonly invoice: string; readonly result: 'verified' | 'mismatch' }
  | { readonly type: 'NEXT_CYCLE_INCIDENT' }
  | { readonly type: 'CONTAIN_INCIDENT'; readonly caseIds: readonly string[] }
  | { readonly type: 'COMPLETE_CASE_MANUALLY'; readonly caseId: string }
  | { readonly type: 'TEACH' }
  | { readonly type: 'VALIDATE_SCOPE'; readonly scope: string }
  | { readonly type: 'PROPOSE_REPAIR' }
  | { readonly type: 'RUN_REGRESSION' }
  | { readonly type: 'CANCEL_REGRESSION' }
  | { readonly type: 'COMPLETE_REGRESSION'; readonly results: readonly RegressionResult[] }
  | { readonly type: 'LIMITED_RELEASE' }
  | { readonly type: 'VERIFY_COHORT_OUTCOME'; readonly index: number; readonly result: 'verified' | 'unknown' | 'regression' }
  | { readonly type: 'EXPAND_RELEASE' }
  | { readonly type: 'CLOSE_INCIDENT' }
  | { readonly type: 'OPEN_MONTAGE' }
  | { readonly type: 'NEXT' }
  | { readonly type: 'REQUEST_APPROVAL' }
  | { readonly type: 'EXPORT_AUDIT_PACK' }
  | { readonly type: 'DENY_UNSAFE_REQUEST' }
  | { readonly type: 'SET_MAP_VIEW'; readonly view: MapView }
  | { readonly type: 'SELECT_MAP_NODE'; readonly node: OperationsNodeId | null }
  | { readonly type: 'SET_VERSION_VIEW'; readonly compare?: VersionComparison | null; readonly restore?: 'closed' | 'confirm'; readonly hint?: boolean }
  | { readonly type: 'RESTORE_VERSION' }
  | { readonly type: 'SET_POLICY_VIEW'; readonly tests: boolean }
  | { readonly type: 'SET_COMMAND_VIEW'; readonly tab?: CommandTab; readonly snapshot?: CommandSnapshot; readonly detail?: CommandDetail | null }
  | { readonly type: 'SET_AUDIT_EXPORT'; readonly step: AuditExportStep }
  | { readonly type: 'SET_NOTIFICATION_VIEW'; readonly filter?: NotificationFilter; readonly open?: NotificationId | null }
  | { readonly type: 'SURFACE_TOAST'; readonly id: NotificationId }
  | { readonly type: 'DISMISS_TOAST' }
  | { readonly type: 'SET_CAPABILITY_VIEW'; readonly view?: CapabilityView; readonly selected?: CapabilityCell | null }
  | { readonly type: 'DISMISS_TIMEOUT_BANNER' }
  | { readonly type: 'RESET' }

export type ActionType = Action['type']

export type GuardFailure = { readonly guard: GuardId; readonly reason: string }

export type Transition =
  | { readonly ok: true; readonly state: State }
  | { readonly ok: false; readonly state: State; readonly rejection: Rejection }
