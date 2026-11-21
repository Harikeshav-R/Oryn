import { CONSENT_INITIAL } from '@/data/consent'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { DEFAULT_GRANTS, VARIANCE_THRESHOLD } from './permissions'
import { RUN_FRAMES } from '@/data/simulation'
import type { DemonstrationId, EmployeeId, Grant, MeetingId, PersonConsent, State } from './types'

const MEETING_NONE: Readonly<Record<MeetingId, 'absent'>> = { 'zoom-kestrel': 'absent' }

/** Nothing is pre-selected: capture, contribution and meeting consent all start off. */
const initialConsent = (): PersonConsent => ({ ...CONSENT_INITIAL, noticeDeclined: false, meetings: MEETING_NONE })

export interface InitialOptions {
  readonly grants?: readonly Grant[]
  readonly threshold?: string
}

/** The fixed initial snapshot. The film replays ordered actions from here, never from a frame. */
export function createInitialState(options: InitialOptions = {}): State {
  const consent: Record<EmployeeId, PersonConsent> = { priya: initialConsent(), jamal: initialConsent() }
  const demonstrations = Object.fromEntries(DEMONSTRATIONS.map((demo) => [demo.id, 'observed' as const])) as Record<DemonstrationId, 'observed'>
  return {
    phase: 'ST01',
    step: 0,
    route: 'SC02',
    actorId: 'priya',
    theme: 'light',
    running: { simulation: false, job: false, regression: false },
    consent,
    commitment: { status: 'absent', due: null, confirmedDue: null },
    demonstrations,
    playbookPublished: false,
    ownerReviewRequestedBy: null,
    agent: { versions: [], pinned: null, releaseApproved: false, scopeConfirmed: false },
    evaluations: [],
    job: { status: 'notStarted', outcomes: {} },
    selectedCase: null,
    selectedScenario: null,
    approval: { decision: 'pending', by: null, grantId: null },
    readback: { status: 'none' },
    incident: { status: 'none', containedCaseIds: [], manualCompletions: [], correctionRecorded: false, disposition: null },
    repair: { scopeValidated: false, proposed: false },
    release: { stage: 'none', cohort: [], stoppedBy: null },
    policy: { threshold: options.threshold ?? VARIANCE_THRESHOLD, revalidationMarked: false },
    unsafeRequest: 'blocked',
    restoredVersion: null,
    authority: { grants: options.grants ?? DEFAULT_GRANTS },
    notificationsDismissed: [],
    audit: [],
    history: [{ phase: 'ST01', enteredBy: 'INIT', enteredAtStep: 0, exitedBy: null, exitedAtStep: null }],
    rejection: null,
    ui: {
      wizardStep: 'notice',
      noticeExpanded: false,
      overlay: null,
      searchQuery: '',
      deleteDialog: 'closed',
      localHistoryDeleted: false,
      activeTab: 'gmail',
      tabHistory: [],
      foreground: 'work',
      deadlineDraft: null,
      app: {
        record: 'INV-48219',
        mail: 'inbox',
        attachment: false,
        documentView: 'single',
        erp: 'bill',
        vendor: null,
        trackerFocus: null,
        meeting: { ended: false, quote: 'none' },
        hud: { placement: 'upper', motion: 'short', guide: 'closed', dismissed: [] },
      },
      discovery: { filter: 'all', candidateSelected: false, demonstration: null, drawer: null },
      factory: { intent: '' },
      simulator: { view: 'grid', runLabel: 'Run scenarios', runFrames: RUN_FRAMES, runLead: 0, compare: false },
      job: { selection: 'proposed', dialog: 'closed', startCancelled: false, filter: 'all', investigating: false, tip: false, evidence: false, snapshot: 'current' },
      incident: { evidence: false, outcome: null, answer: 'none', ruleLinked: false },
      breadth: {
        map: { view: 'graph', selected: null },
        versions: { compare: null, restore: 'closed', hint: false },
        policy: { tests: false },
        command: { tab: 'command', snapshot: 'current', detail: null },
        audit: { step: 'closed' },
        notifications: { filter: 'all', open: null, read: [], toast: null },
        capability: { view: 'matrix', selected: null },
        timeout: { dismissed: false },
      },
    },
  }
}
