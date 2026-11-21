import { describe, expect, test } from 'bun:test'
import { INVOICE_CASES } from '@/data/invoices'
import { CANONICAL_SCRIPT, jobCounts, jobLabel, reconstruct, replayStrict, unknownCase, type Action, type State } from '@/state'
import { act, expectRejected } from '@/state/test-helpers'

/** SC21 to SC25 job lifecycle: the confirmed start, the evaluation, the decision and the separate readback. */

const UNKNOWN = 'INV-48220'
const APPROVAL = 'INV-48219'

const released = act(reconstruct('ST09'), { type: 'APPROVE_RELEASE' }, { type: 'CONFIRM_SCOPE' })
const selected = act(released, { type: 'CONFIRM_SELECTION' })
const dialog = act(selected, { type: 'OPEN_JOB_SCOPE' })
const running = act(dialog, { type: 'RELEASE_AND_START' })
const evaluate = (state: State, invoices: readonly string[]): State => act(state, ...invoices.map((invoice): Action => ({ type: 'EVALUATE_CASE', invoice })))
const allInvoices = INVOICE_CASES.map((row) => row.invoice)
const snapshot = act(evaluate(running, allInvoices), { type: 'PAUSE_FOR_APPROVAL' })
const daniel = act(snapshot, { type: 'SELECT_ACTOR', personId: 'daniel' })
const approved = act(daniel, { type: 'APPROVE', invoice: APPROVAL })
const readBack = act(approved, { type: 'VERIFY_READBACK', invoice: APPROVAL, result: 'verified' })

/** What a presentation action must never touch. */
const business = (state: State) => ({ job: state.job, approval: state.approval, readback: state.readback, running: state.running, phase: state.phase, audit: state.audit, agent: state.agent })

describe('confirming the 11 invoices and the job scope', () => {
  test('the queue starts proposed with the dialog closed, and nothing is running', () => {
    expect(released.phase).toBe('ST09')
    expect(released.ui.job).toMatchObject({ selection: 'proposed', dialog: 'closed', startCancelled: false })
    expect(released.job).toEqual({ status: 'notStarted', outcomes: {} })
    expect(released.running.job).toBe(false)
  })

  test('CONFIRM_SELECTION confirms once, from ST09 only, and starts nothing', () => {
    expect(selected.ui.job.selection).toBe('confirmed')
    expect(selected.ui.job.dialog).toBe('closed')
    expect(selected.phase).toBe('ST09')
    expect(selected.job.status).toBe('notStarted')
    expect(selected.running.job).toBe(false)
    expectRejected(selected, { type: 'CONFIRM_SELECTION' }, 'selection')
    expectRejected(running, { type: 'CONFIRM_SELECTION' }, 'phase')
  })

  test('CONFIRM_SELECTION needs the release gate and the start-job authority; a role selector grants neither', () => {
    // The gate is unmet before the owner approval and the scope confirmation, even for the workflow owner.
    expectRejected(reconstruct('ST09'), { type: 'CONFIRM_SELECTION' }, 'ownerApproval')
    expectRejected(act(reconstruct('ST09'), { type: 'APPROVE_RELEASE' }), { type: 'CONFIRM_SELECTION' }, 'scopeConfirmation')
    for (const personId of ['daniel', 'tomas', 'priya', 'elena'] as const) {
      const viewer = act(released, { type: 'SELECT_ACTOR', personId })
      expect(expectRejected(viewer, { type: 'CONFIRM_SELECTION' }, 'authority').reason).toContain('Selecting a role does not grant authority')
      expectRejected(act(selected, { type: 'SELECT_ACTOR', personId }), { type: 'OPEN_JOB_SCOPE' }, 'authority')
    }
  })

  test('OPEN_JOB_SCOPE needs the confirmed selection', () => {
    expectRejected(released, { type: 'OPEN_JOB_SCOPE' }, 'selection')
    expect(dialog.ui.job).toMatchObject({ selection: 'confirmed', dialog: 'open', startCancelled: false })
    expect(dialog.job.status).toBe('notStarted')
    expectRejected(running, { type: 'OPEN_JOB_SCOPE' }, 'phase')
  })

  test('CANCEL_JOB_START needs the dialog open, then starts nothing and keeps the selection confirmed', () => {
    expectRejected(released, { type: 'CANCEL_JOB_START' }, 'jobScope')
    expectRejected(selected, { type: 'CANCEL_JOB_START' }, 'jobScope')
    const cancelled = act(dialog, { type: 'CANCEL_JOB_START' })
    expect(cancelled.ui.job).toMatchObject({ selection: 'confirmed', dialog: 'closed', startCancelled: true })
    expect(cancelled.phase).toBe('ST09')
    expect(cancelled.job).toEqual({ status: 'notStarted', outcomes: {} })
    expect(cancelled.running.job).toBe(false)
    expect(cancelled.audit).toEqual(dialog.audit)
    expect(cancelled.agent.pinned).toBe(dialog.agent.pinned)
    expectRejected(cancelled, { type: 'CANCEL_JOB_START' }, 'jobScope')
    // Cancelling is not a start: the run cannot be started without opening the scope again.
    expectRejected(cancelled, { type: 'RELEASE_AND_START' }, 'jobScope')
    const reopened = act(cancelled, { type: 'OPEN_JOB_SCOPE' })
    expect(reopened.ui.job).toMatchObject({ dialog: 'open', startCancelled: false })
    expect(act(reopened, { type: 'RELEASE_AND_START' }).phase).toBe('ST10')
  })
})

describe('RELEASE_AND_START', () => {
  test('is refused with jobScope until the confirmation dialog is open', () => {
    expectRejected(released, { type: 'RELEASE_AND_START' }, 'jobScope')
    expectRejected(selected, { type: 'RELEASE_AND_START' }, 'jobScope')
  })

  test('is refused for the gate and the authority before the dialog is considered', () => {
    expectRejected(reconstruct('ST09'), { type: 'RELEASE_AND_START' }, 'ownerApproval')
    expectRejected(act(reconstruct('ST09'), { type: 'APPROVE_RELEASE' }), { type: 'RELEASE_AND_START' }, 'scopeConfirmation')
    // Daniel keeps the dialog open but has no start-job authority: the dialog is not a grant.
    const asDaniel = act(dialog, { type: 'SELECT_ACTOR', personId: 'daniel' })
    expect(asDaniel.ui.job.dialog).toBe('open')
    expectRejected(asDaniel, { type: 'RELEASE_AND_START' }, 'authority')
  })

  test('starts the job: dialog closed, ST10, eleven queued cases, running, A05', () => {
    expect(running.phase).toBe('ST10')
    expect(running.ui.job.dialog).toBe('closed')
    expect(running.ui.job.startCancelled).toBe(false)
    expect(running.job.status).toBe('running')
    expect(Object.keys(running.job.outcomes)).toEqual(allInvoices)
    expect(Object.values(running.job.outcomes).every((outcome) => outcome === 'queued')).toBe(true)
    expect(jobCounts(running)).toEqual({ verified: 0, escalated: 0, approval: 0, unknown: 0, queued: 11, total: 11 })
    expect(jobLabel(running)).toBe('Queued')
    expect(running.running.job).toBe(true)
    expect(running.audit[running.audit.length - 1]).toBe('A05')
    expectRejected(running, { type: 'RELEASE_AND_START' }, 'phase')
  })
})

describe('evaluation, approval and readback', () => {
  test('cases are evaluated in any order, each once, and the counts always sum to eleven', () => {
    const reversed = [...allInvoices].reverse()
    const state = evaluate(running, reversed)
    expect(jobCounts(state)).toEqual({ verified: 7, escalated: 2, approval: 1, unknown: 1, queued: 0, total: 11 })
    const first = evaluate(running, [UNKNOWN, 'INV-48210'])
    expect(jobCounts(first)).toEqual({ verified: 1, escalated: 0, approval: 0, unknown: 1, queued: 9, total: 11 })
    expect(jobLabel(first)).toBe('Running')
    expect(first.running.job).toBe(true)
    expectRejected(first, { type: 'EVALUATE_CASE', invoice: UNKNOWN }, 'run')
    expectRejected(running, { type: 'EVALUATE_CASE', invoice: 'INV-00000' }, 'target')
  })

  test('pausing for approval waits for every case and then stops the running job', () => {
    expectRejected(evaluate(running, allInvoices.slice(0, 10)), { type: 'PAUSE_FOR_APPROVAL' }, 'casesEvaluated')
    expect(snapshot.phase).toBe('ST11')
    expect(snapshot.running.job).toBe(false)
    expect(snapshot.job.status).toBe('partiallyComplete')
    expect(jobLabel(snapshot)).toBe('Partially Complete')
  })

  test('the first snapshot is 7/2/1/1 with the unknown case held and no resubmission', () => {
    expect(jobCounts(snapshot)).toEqual({ verified: 7, escalated: 2, approval: 1, unknown: 1, queued: 0, total: 11 })
    expect(unknownCase(snapshot)).toEqual({ invoice: UNKNOWN, outcome: 'Outcome Unknown', held: true, resubmission: 'Resubmission unavailable' })
    expect(snapshot.readback.status).toBe('none')
  })

  test('only the approver decides, and an approval leaves 7/2/1/1 with the readback pending', () => {
    for (const personId of ['marcus', 'priya', 'tomas', 'elena'] as const) {
      expectRejected(act(snapshot, { type: 'SELECT_ACTOR', personId }), { type: 'APPROVE', invoice: APPROVAL }, 'authority')
    }
    expect(approved.approval).toMatchObject({ decision: 'approved', by: 'daniel' })
    expect(approved.readback.status).toBe('pending')
    expect(jobCounts(approved)).toEqual({ verified: 7, escalated: 2, approval: 1, unknown: 1, queued: 0, total: 11 })
    expect(approved.job.outcomes[APPROVAL]).toBe('approval')
    expectRejected(approved, { type: 'APPROVE', invoice: APPROVAL }, 'decision')
  })

  test('the independent readback is a separate event and the only one that makes INV-48219 verified: 8/2/0/1', () => {
    expect(readBack.readback.status).toBe('verified')
    expect(readBack.job.outcomes[APPROVAL]).toBe('verified')
    expect(jobCounts(readBack)).toEqual({ verified: 8, escalated: 2, approval: 0, unknown: 1, queued: 0, total: 11 })
    expect(jobLabel(readBack)).toBe('Partially Complete')
    // Neither rejecting nor asking for changes verifies anything.
    for (const type of ['REJECT', 'REQUEST_CHANGES'] as const) {
      const decided = act(daniel, { type, invoice: APPROVAL })
      expect(jobCounts(decided).verified).toBe(7)
      expect(jobCounts(decided).approval).toBe(1)
      expectRejected(decided, { type: 'VERIFY_READBACK', invoice: APPROVAL, result: 'verified' }, 'approval')
    }
    expectRejected(daniel, { type: 'VERIFY_READBACK', invoice: APPROVAL, result: 'verified' }, 'approval')
    // A readback that does not match verifies nothing.
    const mismatch = act(approved, { type: 'VERIFY_READBACK', invoice: APPROVAL, result: 'mismatch' })
    expect(jobCounts(mismatch)).toEqual({ verified: 7, escalated: 2, approval: 1, unknown: 1, queued: 0, total: 11 })
  })

  test('INV-48220 cannot be approved, rejected, changed or read back, before or after the approval and readback', () => {
    for (const state of [daniel, approved, readBack]) {
      for (const type of ['APPROVE', 'REJECT', 'REQUEST_CHANGES'] as const) {
        const rejection = expectRejected(state, { type, invoice: UNKNOWN }, 'target')
        expect(rejection.reason).toContain('Resubmission unavailable')
      }
      expect(expectRejected(state, { type: 'VERIFY_READBACK', invoice: UNKNOWN, result: 'verified' }, 'readback').reason).toContain('Resubmission unavailable')
      expect(state.job.outcomes[UNKNOWN]).toBe('unknown')
      expect(unknownCase(state)?.held).toBe(true)
    }
    expect(jobCounts(readBack).unknown).toBe(1)
  })

  test('no case but INV-48219 has anything to approve, and escalated or verified cases stay as evaluated', () => {
    for (const invoice of ['INV-48210', 'INV-48215', 'INV-48218']) expectRejected(daniel, { type: 'APPROVE', invoice }, 'target')
    expect(readBack.job.outcomes['INV-48215']).toBe('escalated')
  })

  test('the canonical script confirms the start and replays strictly to the end', () => {
    const types = CANONICAL_SCRIPT.map((action) => action.type)
    expect(types.indexOf('CONFIRM_SELECTION')).toBeLessThan(types.indexOf('OPEN_JOB_SCOPE'))
    expect(types.indexOf('OPEN_JOB_SCOPE')).toBeLessThan(types.indexOf('RELEASE_AND_START'))
    const final = replayStrict(CANONICAL_SCRIPT)
    expect(final.phase).toBe('ST24')
    expect(jobCounts(final)).toEqual({ verified: 8, escalated: 2, approval: 0, unknown: 1, queued: 0, total: 11 })
  })
})

describe('job presentation actions', () => {
  const states = { released, selected, dialog, running, snapshot, daniel, approved, readBack }

  test('SET_JOB_FILTER takes only the five filters and never changes business state', () => {
    for (const [label, state] of Object.entries(states)) {
      for (const filter of ['all', 'verified', 'escalated', 'approval', 'unknown'] as const) {
        const next = act(state, { type: 'SET_JOB_FILTER', filter })
        expect(next.ui.job.filter).toBe(filter)
        expect(business(next), label).toEqual(business(state))
      }
    }
    for (const filter of ['retry', 'failed', '', 'Verified']) {
      expectRejected(snapshot, { type: 'SET_JOB_FILTER', filter } as unknown as Action, 'target')
    }
  })

  test('SET_JOB_VIEW sets only the named disclosures and never changes business state', () => {
    for (const [label, state] of Object.entries(states)) {
      const next = act(state, { type: 'SET_JOB_VIEW', investigating: true, tip: true, evidence: true, snapshot: 'before' })
      expect(next.ui.job).toMatchObject({ investigating: true, tip: true, evidence: true, snapshot: 'before' })
      expect(business(next), label).toEqual(business(state))
    }
    const partial = act(snapshot, { type: 'SET_JOB_VIEW', investigating: true }, { type: 'SET_JOB_VIEW', tip: true })
    expect(partial.ui.job).toMatchObject({ investigating: true, tip: true, evidence: false, snapshot: 'current' })
    const closed = act(partial, { type: 'SET_JOB_VIEW', investigating: false, snapshot: 'current' })
    expect(closed.ui.job).toMatchObject({ investigating: false, tip: true, snapshot: 'current' })
  })

  test('SET_JOB_VIEW rejects a value that is not a disclosure or a known snapshot', () => {
    expectRejected(snapshot, { type: 'SET_JOB_VIEW', investigating: 'yes' } as unknown as Action, 'target')
    expectRejected(snapshot, { type: 'SET_JOB_VIEW', tip: 1 } as unknown as Action, 'target')
    expectRejected(snapshot, { type: 'SET_JOB_VIEW', evidence: null } as unknown as Action, 'target')
    expectRejected(snapshot, { type: 'SET_JOB_VIEW', snapshot: 'after' } as unknown as Action, 'target')
  })

  test('opening the job screens changes only the route', () => {
    for (const screen of ['SC21', 'SC22', 'SC23', 'SC24', 'SC25'] as const) {
      const next = act(snapshot, { type: 'OPEN_SCREEN', screen })
      expect(next.route).toBe(screen)
      expect(business(next)).toEqual(business(snapshot))
    }
    expect(act(released, { type: 'OPEN_SCREEN', screen: 'SC21' }).job.status).toBe('notStarted')
  })
})
