import { describe, expect, test } from 'bun:test'
import { REGRESSION_PASS_RESULTS } from '@/data/regression'
import { INCIDENT, REPAIR } from '@/data/incident'
import {
  CANONICAL_SCRIPT,
  createInitialState,
  currentRole,
  exampleCount,
  gateChecks,
  gateSatisfied,
  jobCounts,
  jobLabel,
  observationActive,
  reconstruct,
  recordingActive,
  regressionVerdict,
  replayStrict,
  runSummary,
  suiteVerdicts,
  unknownCase,
  type Action,
  type EvaluationRun,
  type State,
} from '@/state'
import { act, expectRejected } from '@/state/test-helpers'

const ids = (...list: string[]) => list
const results = (patch: Record<string, 'passed' | 'safeEscalation' | 'failed'> = {}) =>
  REGRESSION_PASS_RESULTS.map((result) => ({ id: result.id, verdict: patch[result.id] ?? result.verdict }))

/** A completed v0.2 run with chosen verdicts, for gate boundary checks. */
function withV02(state: State, patch: Record<string, 'passed' | 'safeEscalation' | 'failed'>): State {
  const base = state.evaluations.find((run) => run.versionId === 'agent-v0.2') as EvaluationRun
  const edited: EvaluationRun = { ...base, results: base.results.map((r) => ({ id: r.id, verdict: patch[r.id] ?? r.verdict })) }
  return { ...state, evaluations: state.evaluations.map((run) => (run === base ? edited : run)) }
}

describe('ST01 enrollment and consent', () => {
  test('capture needs notice acceptance and a selected category; each failure names its guard', () => {
    let state = createInitialState()
    expectRejected(state, { type: 'CONSENT' }, 'notice')
    state = act(state, { type: 'ACKNOWLEDGE_NOTICE' })
    expectRejected(state, { type: 'CONSENT' }, 'category')
    state = act(state, { type: 'SET_CAPTURE_CATEGORY', category: 'visualObservation', enabled: true })
    const paused = act(state, { type: 'PAUSE_OBSERVATION' })
    expectRejected(paused, { type: 'CONSENT' }, 'paused')
    expect(act(state, { type: 'CONSENT' }).phase).toBe('ST02')
  })

  test('a declined notice keeps capture off and cannot start observation', () => {
    const declined = act(createInitialState(), { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }, { type: 'DECLINE_NOTICE' })
    expect(declined.consent.priya.workApplications).toBe(false)
    expectRejected(declined, { type: 'CONSENT' }, 'declined')
    expect(observationActive(declined, 'priya')).toBe(false)
    expect(declined.phase).toBe('ST01')
  })

  test('observation is off until ST02, then follows each person\u2019s own consent', () => {
    const consented = act(createInitialState(), { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true })
    expect(observationActive(consented, 'priya')).toBe(false)
    const observing = act(consented, { type: 'CONSENT' })
    expect(observationActive(observing, 'priya')).toBe(true)
    expect(observationActive(observing, 'jamal')).toBe(false)
    expect(observationActive(act(observing, { type: 'PAUSE_OBSERVATION' }), 'priya')).toBe(false)
  })

  test('capture and contribution consent are independent in both directions', () => {
    const start = createInitialState()
    const contributionOnly = act(start, { type: 'SET_CONTRIBUTION', enabled: true })
    expect(contributionOnly.consent.priya.workApplications).toBe(false)
    expectRejected(contributionOnly, { type: 'CONSENT' }, 'notice')
    const captureOnly = act(start, { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true })
    expect(captureOnly.consent.priya.contribution).toBe(false)
    const pausedKeepsSharing = act(contributionOnly, { type: 'PAUSE_OBSERVATION' })
    expect(pausedKeepsSharing.consent.priya.contribution).toBe(true)

    const review = reconstruct('ST04')
    const noContribution = { ...review, consent: { ...review.consent, priya: { ...review.consent.priya, contribution: false } } }
    expectRejected(noContribution, { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' }, 'contribution')
    const noCapture = { ...review, consent: { ...review.consent, priya: { ...review.consent.priya, workApplications: false } } }
    expectRejected(noCapture, { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' }, 'category')
  })

  test('only an Employee changes observation consent, and only their own', () => {
    const state = act(createInitialState(), { type: 'SELECT_ACTOR', personId: 'tomas' })
    expectRejected(state, { type: 'ACKNOWLEDGE_NOTICE' }, 'actor')
    expectRejected(act(state, { type: 'SELECT_ACTOR', personId: 'marcus' }), { type: 'SET_CONTRIBUTION', enabled: true }, 'actor')
    const jamal = act(createInitialState(), { type: 'SELECT_ACTOR', personId: 'jamal' }, { type: 'ACKNOWLEDGE_NOTICE' })
    expect(jamal.consent.jamal.noticeAccepted).toBe(true)
    expect(jamal.consent.priya.noticeAccepted).toBe(false)
  })
})

describe('ST02 and ST03 meeting consent and commitment', () => {
  const observing = reconstruct('ST02')

  test('Priya without per-meeting consent cannot review the meeting; recording stays off', () => {
    expect(recordingActive(observing, 'priya')).toBe(false)
    expectRejected(observing, { type: 'REVIEW_MEETING' }, 'meetingConsent')
    const denied = act(observing, { type: 'DENY_MEETING_CONSENT', meetingId: 'zoom-kestrel' })
    expect(expectRejected(denied, { type: 'REVIEW_MEETING' }, 'meetingConsent').reason).toContain('denied')
    expect(recordingActive(denied, 'priya')).toBe(false)
  })

  test('Priya with per-meeting consent reviews it; meeting consent does not imply capture', () => {
    const granted = act(observing, { type: 'GRANT_MEETING_CONSENT', meetingId: 'zoom-kestrel' })
    expect(recordingActive(granted, 'priya')).toBe(true)
    const paused = act(granted, { type: 'PAUSE_OBSERVATION' })
    expect(recordingActive(paused, 'priya')).toBe(false)
    expectRejected(paused, { type: 'REVIEW_MEETING' }, 'paused')
    const reviewed = act(granted, { type: 'REVIEW_MEETING' })
    expect(reviewed.phase).toBe('ST03')
    expect(reviewed.commitment).toEqual({ status: 'proposed', due: 'Fri 17:00', confirmedDue: null })
  })

  test('only the commitment owner confirms it, and the reminder uses the confirmed deadline', () => {
    const review = reconstruct('ST03')
    expectRejected(act(review, { type: 'SELECT_ACTOR', personId: 'marcus' }), { type: 'CONFIRM_COMMITMENT' }, 'actor')
    expectRejected(review, { type: 'EDIT_COMMITMENT', due: '  ' }, 'commitment')
    const confirmed = act(review, { type: 'EDIT_COMMITMENT', due: 'Fri 12:00' }, { type: 'CONFIRM_COMMITMENT' })
    expect(confirmed.commitment).toEqual({ status: 'confirmed', due: 'Fri 12:00', confirmedDue: 'Fri 12:00' })
    expect(confirmed.phase).toBe('ST04')
  })
})

describe('ST04 publication', () => {
  const review = reconstruct('ST04')
  const approved = act(review, { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' }, { type: 'APPROVE_DEMONSTRATION', demoId: 'D2' })

  test('publishing needs every contributor review before owner approval', () => {
    const owner = act(review, { type: 'SELECT_ACTOR', personId: 'marcus' })
    const rejection = expectRejected(owner, { type: 'PUBLISH' }, 'contributorReview')
    expect(rejection.reason).toContain('D1, D2, D3')
  })

  test('each contributor approves only their own Demonstration', () => {
    expectRejected(review, { type: 'APPROVE_DEMONSTRATION', demoId: 'D3' }, 'actor')
    expectRejected(approved, { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' }, 'contributorReview')
    expect(exampleCount(approved)).toBe(4)
  })

  test('with every review done, owner review is requested by a contributor before an authorized owner publishes', () => {
    const reviewed = act(approved, { type: 'SELECT_ACTOR', personId: 'jamal' }, { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }, { type: 'SET_CONTRIBUTION', enabled: true }, { type: 'APPROVE_DEMONSTRATION', demoId: 'D3' })
    // Every contribution is approved, yet nobody has asked the owner to review: publishing stays refused for everyone.
    expectRejected(act(reviewed, { type: 'SELECT_ACTOR', personId: 'marcus' }), { type: 'PUBLISH' }, 'ownerReview')
    const requested = act(reviewed, { type: 'REQUEST_OWNER_REVIEW' })
    expect(requested.ownerReviewRequestedBy).toBe('jamal')
    expect(requested.phase).toBe('ST04')
    expect(requested.audit).toEqual(['A01', 'A02'])
    for (const personId of ['priya', 'daniel', 'tomas'] as const) {
      expectRejected(act(requested, { type: 'SELECT_ACTOR', personId }), { type: 'PUBLISH' }, 'authority')
    }
    const published = act(requested, { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'PUBLISH' })
    expect(published.phase).toBe('ST05')
    expect(published.playbookPublished).toBe(true)
    expect(published.audit).toEqual(['A01', 'A02', 'A03'])
  })

  test('a request for owner review is not an approval: it needs a contributor, every contribution approved, and happens once', () => {
    const jamal = act(approved, { type: 'SELECT_ACTOR', personId: 'jamal' })
    expectRejected(jamal, { type: 'REQUEST_OWNER_REVIEW' }, 'contributorReview')
    const reviewed = act(jamal, { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }, { type: 'SET_CONTRIBUTION', enabled: true }, { type: 'APPROVE_DEMONSTRATION', demoId: 'D3' })
    for (const personId of ['marcus', 'daniel', 'tomas'] as const) {
      expectRejected(act(reviewed, { type: 'SELECT_ACTOR', personId }), { type: 'REQUEST_OWNER_REVIEW' }, 'actor')
    }
    const requested = act(reviewed, { type: 'REQUEST_OWNER_REVIEW' })
    expectRejected(requested, { type: 'REQUEST_OWNER_REVIEW' }, 'ownerReview')
    expectRejected(act(requested, { type: 'SELECT_ACTOR', personId: 'priya' }), { type: 'REQUEST_OWNER_REVIEW' }, 'ownerReview')
    expect(requested.playbookPublished).toBe(false)
  })
})

describe('ST06 to ST08 simulation', () => {
  const draft = reconstruct('ST06')

  test('the 28-scenario candidate is pinned for the run and shows Not Run until it completes', () => {
    const running = act(draft, { type: 'RUN_SIMULATION' })
    expect(running.phase).toBe('ST07')
    expect(running.running.simulation).toBe(true)
    expect(running.evaluations).toEqual([{ id: 'RUN-1', versionId: 'agent-v0.1', suiteId: 'SIM-AP-RECON', status: 'running', results: [] }])
    const verdicts = suiteVerdicts(running)
    expect(verdicts).toHaveLength(28)
    expect(verdicts.every((entry) => entry.verdict === 'notRun')).toBe(true)
  })

  test('cancellation stays incomplete: no verdicts, no ST08, no ST09', () => {
    const cancelled = act(draft, { type: 'RUN_SIMULATION' }, { type: 'CANCEL_SIMULATION' })
    expect(cancelled.phase).toBe('ST07')
    expect(cancelled.running.simulation).toBe(false)
    expect(cancelled.evaluations[0]?.status).toBe('cancelled')
    expect(suiteVerdicts(cancelled).every((entry) => entry.verdict === 'notRun')).toBe(true)
    expect(runSummary(cancelled.evaluations[0] as EvaluationRun)).toMatchObject({ complete: false, passed: 0, safeEscalation: 0, failed: 0, notRun: 28 })
    expectRejected(cancelled, { type: 'COMPLETE_SIMULATION' }, 'run')
    expectRejected(cancelled, { type: 'CANCEL_SIMULATION' }, 'run')
    expect(act(cancelled, { type: 'RUN_SIMULATION' }).running.simulation).toBe(true)
    expectRejected(act(draft, { type: 'RUN_SIMULATION' }), { type: 'RUN_SIMULATION' }, 'run')
  })

  test('v0.1 completes 21/6/1 into ST08; the fix reruns as v0.2 and keeps the old evaluation', () => {
    const failed = act(draft, { type: 'RUN_SIMULATION' }, { type: 'COMPLETE_SIMULATION' })
    expect(failed.phase).toBe('ST08')
    expect(runSummary(failed.evaluations[0] as EvaluationRun)).toMatchObject({ passed: 21, safeEscalation: 6, failed: 1 })
    expect(suiteVerdicts(failed).find((entry) => entry.id === 'SCN-022')?.verdict).toBe('failed')
    expectRejected(failed, { type: 'RUN_SIMULATION' }, 'phase')

    const rerun = act(failed, { type: 'FIX_AND_RUN' })
    expect(rerun.phase).toBe('ST07')
    expect(rerun.running.simulation).toBe(true)
    expect(rerun.agent.versions).toEqual(['agent-v0.1', 'agent-v0.2'])
    // 22/6/0 appears only after the rerun completes; until then the gate sees nothing.
    expect(gateChecks(rerun).find((check) => check.id === 'scenarios')?.met).toBe(false)
    const cancelledRerun = act(rerun, { type: 'CANCEL_SIMULATION' })
    expect(cancelledRerun.phase).toBe('ST07')
    expect(suiteVerdicts(cancelledRerun, 'agent-v0.1').find((entry) => entry.id === 'SCN-022')?.verdict).toBe('failed')
    expect(suiteVerdicts(cancelledRerun, 'agent-v0.2').every((entry) => entry.verdict === 'notRun')).toBe(true)

    const restarted = act(cancelledRerun, { type: 'RUN_SIMULATION' })
    expect(restarted.evaluations.map((run) => [run.versionId, run.status])).toEqual([['agent-v0.1', 'complete'], ['agent-v0.2', 'cancelled'], ['agent-v0.2', 'running']])
    expect(act(restarted, { type: 'COMPLETE_SIMULATION' }).phase).toBe('ST09')

    const passed = act(rerun, { type: 'COMPLETE_SIMULATION' })
    expect(passed.phase).toBe('ST09')
    expect(runSummary(passed.evaluations[0] as EvaluationRun)).toMatchObject({ passed: 21, safeEscalation: 6, failed: 1 })
    expect(runSummary(passed.evaluations[1] as EvaluationRun)).toMatchObject({ passed: 22, safeEscalation: 6, failed: 0 })
  })

  test('only an authorized owner runs and cancels simulations', () => {
    expectRejected(act(draft, { type: 'SELECT_ACTOR', personId: 'tomas' }), { type: 'RUN_SIMULATION' }, 'authority')
    expectRejected(act(draft, { type: 'SELECT_ACTOR', personId: 'priya' }), { type: 'RUN_SIMULATION' }, 'authority')
  })
})

describe('ST09 release gate', () => {
  const passed = reconstruct('ST09')
  const approved = act(passed, { type: 'APPROVE_RELEASE' })
  const ready = act(approved, { type: 'CONFIRM_SCOPE' })

  test('the checklist shows only independently evidenced checks until the owner approves', () => {
    expect(gateChecks(passed).map((check) => [check.id, check.met, check.label])).toEqual([
      ['examples', true, '5/5 verified human examples'],
      ['scenarios', true, '28/25 representative scenarios'],
      ['edgeCases', true, '6/5 edge/negative'],
      ['ownerApproval', false, 'Owner approval'],
      ['scopeConfirmation', false, 'Scope confirmation'],
      ['authorization', true, 'Action authorization'],
    ])
    expect(gateSatisfied(passed)).toBe(false)
    expect(gateSatisfied(ready)).toBe(true)
  })

  test('start is refused with the specific reason for each missing requirement', () => {
    expectRejected(passed, { type: 'RELEASE_AND_START' }, 'ownerApproval')
    expectRejected(approved, { type: 'RELEASE_AND_START' }, 'scopeConfirmation')
    const reviews = { ...ready, demonstrations: { ...ready.demonstrations, D1: 'observed' as const } }
    expect(expectRejected(reviews, { type: 'RELEASE_AND_START' }, 'examples').reason).toContain('4 are verified')
  })

  test('scenario thresholds: 25 correct is enough, 24 is not; five edge/negative are required', () => {
    const verdicts = (count: number) => {
      const patch: Record<string, 'failed'> = {}
      ;['SCN-001', 'SCN-002', 'SCN-003'].slice(0, 28 - count).forEach((id) => { patch[id] = 'failed' })
      return patch
    }
    expect(gateSatisfied(withV02(ready, verdicts(25)))).toBe(true)
    const short = withV02(ready, { ...verdicts(25), 'SCN-004': 'failed' })
    expect(expectRejected(short, { type: 'RELEASE_AND_START' }, 'scenarios').reason).toContain('24 are verified')
    // Two safe escalations become plain passes: 28 correct but only four edge/negative.
    const fewEdge = withV02(ready, { 'SCN-023': 'passed', 'SCN-024': 'passed' })
    expect(expectRejected(fewEdge, { type: 'RELEASE_AND_START' }, 'edgeCases').reason).toContain('4 are verified')
    expect(gateSatisfied(withV02(ready, { 'SCN-023': 'passed' }))).toBe(true)
  })

  test('only the evaluation of v0.2 counts; v0.1 failing never satisfies the gate', () => {
    const onlyV01 = { ...ready, evaluations: ready.evaluations.slice(0, 1) }
    expect(gateChecks(onlyV01).find((check) => check.id === 'scenarios')?.met).toBe(false)
    expectRejected(onlyV01, { type: 'RELEASE_AND_START' }, 'scenarios')
    expectRejected(reconstruct('ST08'), { type: 'APPROVE_RELEASE' }, 'phase')
  })

  test('owner approval waits for a passing evaluation and for the owner', () => {
    expectRejected(act(passed, { type: 'SELECT_ACTOR', personId: 'daniel' }), { type: 'APPROVE_RELEASE' }, 'authority')
    expectRejected({ ...passed, evaluations: passed.evaluations.slice(0, 1) }, { type: 'APPROVE_RELEASE' }, 'scenarios')
    expectRejected(approved, { type: 'APPROVE_RELEASE' }, 'ownerApproval')
  })

  test('action authorization is its own grant: the approver and the admin cannot start the job', () => {
    for (const personId of ['daniel', 'tomas', 'priya', 'elena'] as const) {
      const rejection = expectRejected(act(ready, { type: 'SELECT_ACTOR', personId }), { type: 'RELEASE_AND_START' }, 'authority')
      expect(rejection.reason).toContain('Selecting a role does not grant authority')
    }
    const started = act(ready, { type: 'CONFIRM_SELECTION' }, { type: 'OPEN_JOB_SCOPE' }, { type: 'RELEASE_AND_START' })
    expect(started.phase).toBe('ST10')
    expect(started.agent.pinned).toBe('agent-v1.0')
    expect(started.audit[started.audit.length - 1]).toBe('A05')
  })
})

describe('ST10 and ST11 job, approval, readback', () => {
  const running = reconstruct('ST10')

  test('the job starts queued; cases complete one at a time; counts always sum to eleven', () => {
    expect(running.running.job).toBe(true)
    expect(jobLabel(running)).toBe('Queued')
    expect(jobCounts(running)).toMatchObject({ queued: 11, total: 11 })
    const partial = act(running, { type: 'EVALUATE_CASE', invoice: 'INV-48210' }, { type: 'EVALUATE_CASE', invoice: 'INV-48220' })
    expect(jobCounts(partial)).toMatchObject({ verified: 1, unknown: 1, queued: 9, total: 11 })
    expect(jobLabel(partial)).toBe('Running')
    expectRejected(partial, { type: 'EVALUATE_CASE', invoice: 'INV-48210' }, 'run')
    expectRejected(running, { type: 'EVALUATE_CASE', invoice: 'INV-00000' }, 'target')
    expect(expectRejected(partial, { type: 'PAUSE_FOR_APPROVAL' }, 'casesEvaluated').reason).toContain('9 of 11')
  })

  test('the first snapshot is 7/2/1/1, Partially Complete, with the unknown case held', () => {
    const snapshot = reconstruct('ST11')
    expect(jobCounts(snapshot)).toEqual({ verified: 7, escalated: 2, approval: 1, unknown: 1, queued: 0, total: 11 })
    expect(jobLabel(snapshot)).toBe('Partially Complete')
    expect(snapshot.running.job).toBe(false)
    expect(unknownCase(snapshot)).toEqual({ invoice: 'INV-48220', outcome: 'Outcome Unknown', held: true, resubmission: 'Resubmission unavailable' })
  })

  test('approval and readback are separate: a decision alone changes no count', () => {
    const decided = act(reconstruct('ST11'), { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'APPROVE', invoice: 'INV-48219' })
    expect(decided.approval).toMatchObject({ decision: 'approved', by: 'daniel', grantId: 'delegation-daniel-tier3' })
    expect(decided.readback.status).toBe('pending')
    expect(jobCounts(decided)).toMatchObject({ verified: 7, approval: 1, unknown: 1 })
    expect(jobLabel(decided)).toBe('Partially Complete')
    expectRejected(decided, { type: 'NEXT_CYCLE_INCIDENT' }, 'readback')
    expectRejected(decided, { type: 'APPROVE', invoice: 'INV-48219' }, 'decision')

    const mismatch = act(decided, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'mismatch' })
    expect(mismatch.readback.status).toBe('mismatch')
    expect(jobCounts(mismatch).approval).toBe(1)
    expectRejected(mismatch, { type: 'NEXT_CYCLE_INCIDENT' }, 'readback')

    const verified = act(mismatch, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' })
    expect(jobCounts(verified)).toEqual({ verified: 8, escalated: 2, approval: 0, unknown: 1, queued: 0, total: 11 })
    expect(jobLabel(verified)).toBe('Partially Complete')
    expectRejected(verified, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' }, 'readback')
  })

  test('readback needs a recorded approval, and a rejection verifies nothing', () => {
    const state = reconstruct('ST11')
    expectRejected(state, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' }, 'approval')
    const rejected = act(state, { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'REJECT', invoice: 'INV-48219' })
    expect(rejected.approval.decision).toBe('rejected')
    expectRejected(rejected, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' }, 'approval')
    expectRejected(rejected, { type: 'NEXT_CYCLE_INCIDENT' }, 'approval')
    expect(jobCounts(rejected).approval).toBe(1)
    const changes = act(state, { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'REQUEST_CHANGES', invoice: 'INV-48219' })
    expect(changes.approval.decision).toBe('changesRequested')
  })

  test('Outcome Unknown stays held: it cannot be decided, read back or resubmitted', () => {
    const daniel = act(reconstruct('ST11'), { type: 'SELECT_ACTOR', personId: 'daniel' })
    for (const type of ['APPROVE', 'REJECT', 'REQUEST_CHANGES'] as const) {
      const rejection = expectRejected(daniel, { type, invoice: 'INV-48220' }, 'target')
      expect(rejection.reason).toContain('Resubmission unavailable')
    }
    expect(expectRejected(daniel, { type: 'VERIFY_READBACK', invoice: 'INV-48220', result: 'verified' }, 'readback').reason).toContain('Resubmission unavailable')
    expectRejected(daniel, { type: 'APPROVE', invoice: 'INV-48210' }, 'target')
    expect(unknownCase(replayStrict(CANONICAL_SCRIPT))?.held).toBe(true)
  })
})

describe('ST12 and ST13 containment and correction', () => {
  const open = reconstruct('ST12')
  const marcus = act(open, { type: 'SELECT_ACTOR', personId: 'marcus' })
  const affected = INCIDENT.affectedCases.map((row) => row.id)

  test('containment covers exactly the three Kestrel cases', () => {
    for (const caseIds of [ids(), ids('INV-48231'), ids('INV-48231', 'INV-48233'), [...affected, 'INV-48210'], ids('INV-48231', 'INV-48233', 'INV-48210')]) {
      expectRejected(marcus, { type: 'CONTAIN_INCIDENT', caseIds }, 'containment')
    }
    expectRejected(act(open, { type: 'SELECT_ACTOR', personId: 'tomas' }), { type: 'CONTAIN_INCIDENT', caseIds: affected }, 'authority')
    const contained = act(marcus, { type: 'CONTAIN_INCIDENT', caseIds: affected })
    expect(contained.incident.status).toBe('contained')
    expect(contained.incident.containedCaseIds).toEqual(affected)
    expectRejected(contained, { type: 'CONTAIN_INCIDENT', caseIds: affected }, 'containment')
  })

  test('teaching needs containment first, then Elena completing INV-48231 manually', () => {
    expectRejected(act(open, { type: 'SELECT_ACTOR', personId: 'elena' }), { type: 'TEACH' }, 'containment')
    expectRejected(act(open, { type: 'SELECT_ACTOR', personId: 'elena' }), { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' }, 'containment')
    const contained = act(marcus, { type: 'CONTAIN_INCIDENT', caseIds: affected })
    const elena = act(contained, { type: 'SELECT_ACTOR', personId: 'elena' })
    expectRejected(elena, { type: 'TEACH' }, 'manualCorrection')
    expectRejected(act(contained, { type: 'SELECT_ACTOR', personId: 'marcus' }), { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' }, 'authority')
    expectRejected(elena, { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48210' }, 'target')
    const completed = act(elena, { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' })
    expectRejected(completed, { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' }, 'manualCorrection')
    expectRejected(act(completed, { type: 'SELECT_ACTOR', personId: 'marcus' }), { type: 'TEACH' }, 'authority')
    // The correction is saved only from a complete draft: Yes, and the linked source rule.
    expectRejected(completed, { type: 'TEACH' }, 'correctionDraft')
    expectRejected(completed, { type: 'LINK_TEACH_RULE', linked: true }, 'correctionDraft')
    const answered = act(completed, { type: 'SET_TEACH_ANSWER', answer: 'yes' })
    expectRejected(answered, { type: 'TEACH' }, 'correctionDraft')
    expect(act(answered, { type: 'LINK_TEACH_RULE', linked: true }, { type: 'SET_TEACH_ANSWER', answer: 'none' }).ui.incident).toMatchObject({ answer: 'none', ruleLinked: false })
    const linked = act(answered, { type: 'LINK_TEACH_RULE', linked: true })
    expect(linked.phase).toBe('ST12')
    expect(linked.incident.correctionRecorded).toBe(false)
    const taught = act(linked, { type: 'TEACH' })
    expect(taught.phase).toBe('ST13')
    expect(taught.incident.correctionRecorded).toBe(true)
    expectRejected(taught, { type: 'SET_TEACH_ANSWER', answer: 'none' }, 'phase')
  })

  test('a correction is evidence: policy, thresholds, grants and the agent do not change', () => {
    const before = reconstruct('ST12')
    const after = reconstruct('ST13')
    expect(after.policy).toEqual(before.policy)
    expect(after.policy.threshold).toBe('2.00%')
    expect(after.authority.grants).toBe(before.authority.grants)
    expect(after.agent).toEqual(before.agent)
  })

  test('repair needs the bounded scope validated by the owner before it is proposed', () => {
    const taught = act(reconstruct('ST13'), { type: 'SELECT_ACTOR', personId: 'marcus' })
    expectRejected(taught, { type: 'PROPOSE_REPAIR' }, 'scopeValidated')
    expect(expectRejected(taught, { type: 'VALIDATE_SCOPE', scope: 'All Kestrel layouts' }, 'scopeValidated').reason).toContain(REPAIR.scope)
    expectRejected(act(taught, { type: 'SELECT_ACTOR', personId: 'elena' }), { type: 'VALIDATE_SCOPE', scope: REPAIR.scope }, 'authority')
    const validated = act(taught, { type: 'VALIDATE_SCOPE', scope: REPAIR.scope })
    expectRejected(validated, { type: 'VALIDATE_SCOPE', scope: REPAIR.scope }, 'scopeValidated')
    expectRejected(act(validated, { type: 'SELECT_ACTOR', personId: 'daniel' }), { type: 'PROPOSE_REPAIR' }, 'authority')
    const proposed = act(validated, { type: 'PROPOSE_REPAIR' })
    expect(proposed.phase).toBe('ST14')
    expect(proposed.agent.versions).toContain('agent-v1.1')
    expect(proposed.policy).toEqual(reconstruct('ST12').policy)
  })
})

describe('ST14 regression and limited release', () => {
  const testing = reconstruct('ST14')

  test('regression is complete only with one result for each of the 34 scenarios', () => {
    const running = act(testing, { type: 'RUN_REGRESSION' })
    expect(running.running.regression).toBe(true)
    expect(regressionVerdict(running)).toBe('running')
    expectRejected(running, { type: 'RUN_REGRESSION' }, 'run')
    const incomplete = results().slice(0, -1)
    const rejection = expectRejected(running, { type: 'COMPLETE_REGRESSION', results: incomplete }, 'regression')
    expect(rejection.reason).toContain('34')
    expect(rejection.reason).not.toMatch(/\b(33|27)\b/)
    expectRejected(running, { type: 'COMPLETE_REGRESSION', results: [...results().slice(0, 33), { id: 'SCN-001', verdict: 'passed' }] }, 'regression')
    expectRejected(testing, { type: 'COMPLETE_REGRESSION', results: results() }, 'run')
  })

  test('a passing run shows 28 passed, 6 safe escalations, 0 failed and releases nothing by itself', () => {
    const done = act(testing, { type: 'RUN_REGRESSION' }, { type: 'COMPLETE_REGRESSION', results: results() })
    expect(regressionVerdict(done)).toBe('passed')
    expect(done.running.regression).toBe(false)
    expect(runSummary(done.evaluations[done.evaluations.length - 1] as EvaluationRun)).toMatchObject({ passed: 28, safeEscalation: 6, failed: 0, notRun: 0 })
    expect(done.release.stage).toBe('none')
    expect(done.audit).toContain('A11')
  })

  test('a failed regression blocks limited release with its real reason, and can be rerun', () => {
    const failedRun = act(testing, { type: 'RUN_REGRESSION' }, { type: 'COMPLETE_REGRESSION', results: results({ 'SCN-022': 'failed' }) })
    expect(regressionVerdict(failedRun)).toBe('failed')
    expect(failedRun.audit).not.toContain('A11')
    const owner = act(failedRun, { type: 'SELECT_ACTOR', personId: 'marcus' })
    const rejection = expectRejected(owner, { type: 'LIMITED_RELEASE' }, 'regression')
    expect(rejection.reason).toContain('34 intended outcomes')
    expect(rejection.reason).toContain('1 failed')
    expect(rejection.reason).not.toMatch(/\b(33|27)\b/)
    const rerun = act(owner, { type: 'RUN_REGRESSION' }, { type: 'COMPLETE_REGRESSION', results: results() })
    expect(regressionVerdict(rerun)).toBe('passed')
    expectRejected(rerun, { type: 'RUN_REGRESSION' }, 'regression')
  })

  test('an unrun or cancelled regression never releases', () => {
    const owner = act(testing, { type: 'SELECT_ACTOR', personId: 'marcus' })
    expectRejected(owner, { type: 'LIMITED_RELEASE' }, 'regression')
    const cancelled = act(owner, { type: 'RUN_REGRESSION' }, { type: 'CANCEL_REGRESSION' })
    expect(regressionVerdict(cancelled)).toBe('cancelled')
    expect(cancelled.running.regression).toBe(false)
    expect(suiteVerdicts(cancelled).every((entry) => entry.verdict === 'notRun')).toBe(true)
    expectRejected(cancelled, { type: 'LIMITED_RELEASE' }, 'regression')
    expectRejected(cancelled, { type: 'CANCEL_REGRESSION' }, 'run')
  })

  test('limited release needs the owner\u2019s own authorization', () => {
    const passed = act(testing, { type: 'RUN_REGRESSION' }, { type: 'COMPLETE_REGRESSION', results: results() })
    for (const personId of ['daniel', 'tomas', 'elena'] as const) {
      expectRejected(act(passed, { type: 'SELECT_ACTOR', personId }), { type: 'LIMITED_RELEASE' }, 'authority')
    }
    const released = act(passed, { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'LIMITED_RELEASE' })
    expect(released.phase).toBe('ST15')
    expect(released.release).toEqual({ stage: 'limited', cohort: ['pending', 'pending', 'pending'], stoppedBy: null })
  })
})

describe('ST15 expansion and closure', () => {
  const limited = reconstruct('ST15')

  test('expansion needs 3/3 independently verified outcomes', () => {
    const one = act(limited, { type: 'VERIFY_COHORT_OUTCOME', index: 0, result: 'verified' })
    expect(expectRejected(one, { type: 'EXPAND_RELEASE' }, 'cohort').reason).toContain('1/3')
    expectRejected(one, { type: 'CLOSE_INCIDENT' }, 'expansion')
    expectRejected(limited, { type: 'VERIFY_COHORT_OUTCOME', index: 3, result: 'verified' }, 'target')
    expectRejected(one, { type: 'VERIFY_COHORT_OUTCOME', index: 0, result: 'verified' }, 'cohort')
    expect(one.audit).not.toContain('A13')
  })

  test('an unknown outcome or a regression stops expansion even at 3/3', () => {
    for (const result of ['unknown', 'regression'] as const) {
      const stopped = act(limited, { type: 'VERIFY_COHORT_OUTCOME', index: 0, result }, { type: 'VERIFY_COHORT_OUTCOME', index: 1, result: 'verified' }, { type: 'VERIFY_COHORT_OUTCOME', index: 2, result: 'verified' })
      expect(stopped.release.stoppedBy).toBe(result)
      expect(expectRejected(stopped, { type: 'EXPAND_RELEASE' }, 'cohort').reason).toContain(result)
    }
  })

  test('with 3/3 verified only the owner expands, and expansion does not close the incident', () => {
    const verified = act(limited, ...[0, 1, 2].map((index): Action => ({ type: 'VERIFY_COHORT_OUTCOME', index, result: 'verified' })))
    expect(verified.audit).toContain('A13')
    for (const personId of ['daniel', 'tomas', 'priya'] as const) {
      expectRejected(act(verified, { type: 'SELECT_ACTOR', personId }), { type: 'EXPAND_RELEASE' }, 'authority')
    }
    expectRejected(verified, { type: 'CLOSE_INCIDENT' }, 'expansion')
    const expanded = act(verified, { type: 'EXPAND_RELEASE' })
    expect(expanded.phase).toBe('ST15')
    expect(expanded.release.stage).toBe('expanded')
    expect(expanded.incident.status).toBe('contained')
    expect(expanded.audit).not.toContain('A14')
    expectRejected(expanded, { type: 'EXPAND_RELEASE' }, 'expansion')
    for (const personId of ['daniel', 'tomas', 'priya'] as const) {
      expectRejected(act(expanded, { type: 'SELECT_ACTOR', personId }), { type: 'CLOSE_INCIDENT' }, 'authority')
    }
  })

  test('closure follows expansion and records Repaired - Validated; the case history stays', () => {
    const closed = act(limited, ...[0, 1, 2].map((index): Action => ({ type: 'VERIFY_COHORT_OUTCOME', index, result: 'verified' })), { type: 'EXPAND_RELEASE' }, { type: 'CLOSE_INCIDENT' })
    expect(closed.phase).toBe('ST16')
    expect(closed.release.stage).toBe('expanded')
    expect(closed.incident).toMatchObject({ status: 'closed', disposition: 'Repaired - Validated', containedCaseIds: INCIDENT.affectedCases.map((row) => row.id), manualCompletions: ['INV-48231'] })
    expect(closed.audit[closed.audit.length - 1]).toBe('A14')
  })
})

describe('ST17 to ST24 montage', () => {
  test('policy revalidation is marked at ST19 and unsafe action stays a request', () => {
    expect(reconstruct('ST18').policy.revalidationMarked).toBe(false)
    expect(reconstruct('ST19').policy.revalidationMarked).toBe(true)
    const blocked = reconstruct('ST20')
    expect(blocked.unsafeRequest).toBe('blocked')
    expect(act(blocked, { type: 'REQUEST_APPROVAL' }).unsafeRequest).toBe('requested')
    expectRejected(reconstruct('ST19'), { type: 'REQUEST_APPROVAL' }, 'phase')
  })

  test('audit export needs authority and happens once', () => {
    const exportStep = reconstruct('ST23')
    for (const personId of ['priya', 'daniel', 'elena'] as const) {
      expectRejected(act(exportStep, { type: 'SELECT_ACTOR', personId }), { type: 'EXPORT_AUDIT_PACK' }, 'authority')
    }
    expect(act(exportStep, { type: 'SELECT_ACTOR', personId: 'tomas' }, { type: 'EXPORT_AUDIT_PACK' }).audit).toContain('A15')
    const exported = act(exportStep, { type: 'EXPORT_AUDIT_PACK' })
    expectRejected(exported, { type: 'EXPORT_AUDIT_PACK' }, 'target')
    expectRejected(reconstruct('ST22'), { type: 'EXPORT_AUDIT_PACK' }, 'phase')
  })

  test('the full run ends with every outcome the storyboard names, and no old repair figure', () => {
    const end = replayStrict(CANONICAL_SCRIPT)
    expect(end.audit).toHaveLength(15)
    expect(currentRole(end).name).toBe('Marcus Webb')
    const serialised = JSON.stringify(end)
    expect(serialised).not.toMatch(/"(33|27)"/)
    expect(runSummary(end.evaluations[end.evaluations.length - 1] as EvaluationRun)).toMatchObject({ passed: 28, safeEscalation: 6, failed: 0 })
  })
})
