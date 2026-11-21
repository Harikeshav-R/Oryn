import { APPROVAL_AFTER, APPROVAL_BEFORE, APPROVAL_INVOICE, APPROVAL_PENDING_VERIFICATION, UNKNOWN_FACTS, UNKNOWN_INVOICE } from '@/data/approval'
import { INVOICE_CASES, JOB_ID, JOB_NAME, formatCents } from '@/data/invoices'
import { STATUS_META } from '@/data/status'
import type { StatusId } from '@/data/status'
import { jobCounts, person } from '@/state'
import type { Action, JobFilter, State } from '@/state'
import { roleOf } from './destinations'
import { refusal } from './discovery'
import type { Access } from './discovery'

/**
 * View decisions shared by SC21 to SC25. Access only decides what a viewpoint sees: it grants nothing (RT-02).
 * Every refusal text comes from the reducer's own guard (`refusal`) or from `approvalBlock`, so a disabled control and
 * the rejected action explain themselves in the same words. Nothing here is stored: counts, labels and rows are
 * derived from `state.job`, `state.approval` and `state.readback`, so an approval can never move a verified count.
 */

export const JOB_TEAM_LABEL = 'AP East'
export const JOB_VERSION_LABEL = JOB_NAME
export const INVOICE_COUNT = INVOICE_CASES.length
export const POPULATION_LABEL = `${INVOICE_COUNT} invoices`

/** Jobs, the job table, the approval drawer, the unknown-outcome drawer and the summary are read by the Workflow Owner and the Approver. */
export function jobAccess(state: State): Access {
  const role = roleOf(state)
  return role === 'Workflow Owner' || role === 'Approver' ? { ok: true } : { ok: false, reason: 'Jobs are read by the Workflow Owner and the Approver.' }
}

/** Why `Confirm 11 invoices` is unavailable, or null. Selection is the first step of a start and needs the same authority. */
export const selectionBlock = (state: State): string | null => (state.phase !== 'ST09' ? `${JOB_ID} is already started.` : refusal(state, { type: 'CONFIRM_SELECTION' }))

/** Why `Confirm job scope` is unavailable, or null. */
export const scopeBlock = (state: State): string | null => (state.phase !== 'ST09' ? `${JOB_ID} is already started.` : refusal(state, { type: 'OPEN_JOB_SCOPE' }))

/** Why `Start job` is unavailable, or null: authority and the release gate first, then the open scope confirmation. */
export const startBlock = (state: State): string | null => (state.phase !== 'ST09' ? `${JOB_ID} is already started.` : refusal(state, { type: 'RELEASE_AND_START' }))

/** The authority or gate reason that blocks a start for this viewpoint regardless of the dialog, or null when this viewpoint may start. */
export function authorityBlock(state: State): string | null {
  if (state.phase !== 'ST09') return null
  const reason = refusal({ ...state, ui: { ...state.ui, job: { ...state.ui.job, selection: 'confirmed', dialog: 'open' } } }, { type: 'RELEASE_AND_START' })
  return reason
}

// -- SC22 rows ----------------------------------------------------------------------------------

export type RowKind = 'queued' | 'running' | StatusId

export interface CaseRowView {
  readonly invoice: string
  readonly supplier: string
  readonly amount: string
  readonly po: string
  /** `queued`, `running` (the one active row) or the reducer's outcome. */
  readonly kind: RowKind
  /** Exact status text. `Approval Required (Tier 3)`, `Escalated: Missing Purchase Order`, `Verified Complete`, `Outcome Unknown`, `Queued`, `Running`. */
  readonly label: string
  /** Second line for a decided approval row: `Approved · Awaiting verification`, `Rejected`, `Changes requested`; null otherwise. */
  readonly note: string | null
  /** Whether the case belongs to the SC25 filter. */
  readonly inFilter: boolean
}

/** The row being executed: the first queued case in table order while the job runs. Null once stopped, so cyan cannot outlive execution. */
export function activeIndex(state: State): number | null {
  if (!state.running.job) return null
  const index = INVOICE_CASES.findIndex((row) => state.job.outcomes[row.invoice] === 'queued')
  return index < 0 ? null : index
}

const FILTER_OUTCOME: Readonly<Record<Exclude<JobFilter, 'all'>, StatusId>> = { verified: 'verified', escalated: 'escalated', approval: 'approval', unknown: 'unknown' }

/** Decision text of the approval case, or null before a decision. A decision never changes the outcome or a count. */
export function decisionNote(state: State): string | null {
  const { decision } = state.approval
  if (decision === 'approved') return state.readback.status === 'verified' ? null : state.readback.status === 'mismatch' ? 'Approved · Readback mismatch' : `Approved · ${APPROVAL_PENDING_VERIFICATION}`
  if (decision === 'rejected') return 'Rejected'
  if (decision === 'changesRequested') return 'Changes requested'
  return null
}

export function caseRows(state: State): readonly CaseRowView[] {
  const active = activeIndex(state)
  return INVOICE_CASES.map((row, index) => {
    const outcome = state.job.outcomes[row.invoice] ?? 'queued'
    const kind: RowKind = outcome === 'queued' ? (index === active ? 'running' : 'queued') : outcome
    const label =
      kind === 'queued'
        ? 'Queued'
        : kind === 'running'
          ? STATUS_META.running.label
          : kind === 'escalated'
            ? `${STATUS_META.escalated.label}: ${row.qualifier ?? ''}`
            : kind === 'approval'
              ? `${STATUS_META.approval.label} (${row.qualifier ?? ''})`
              : STATUS_META[kind].label
    const filter = state.ui.job.filter
    const inFilter = filter === 'all' || outcome === FILTER_OUTCOME[filter]
    return {
      invoice: row.invoice,
      supplier: row.supplier,
      amount: formatCents(row.amountCents),
      po: row.po ?? '\u2014',
      kind,
      label,
      note: row.invoice === APPROVAL_INVOICE.invoice && kind === 'approval' ? decisionNote(state) : null,
      inFilter,
    }
  })
}

/** `Not started`, `Queued`, `Running` or `Partially Complete`: never `11 successful`, never `Completed with exceptions`. */
export { jobLabel } from '@/state'

// -- SC25 snapshots -----------------------------------------------------------------------------

export const SNAPSHOT_BEFORE = 'Before approval'
export const SNAPSHOT_AFTER = 'After approval and verification'
export const SNAPSHOT_CURRENT = 'Current snapshot'
export const PARTIAL_LABEL = 'Partially Complete'

export interface SummaryCardView {
  readonly category: 'verified' | 'escalated' | 'approval' | 'unknown'
  readonly count: number
  readonly label: string
}

/**
 * The summary's four cards for the snapshot on screen. The counts come from the case outcomes only: an approval that has not
 * been independently read back leaves the preapproval classification (7 / 2 / 1 / 1) in place; only `VERIFY_READBACK`
 * moves INV-48219 to verified (8 / 2 / 0 / 1). The unknown case never leaves `unknown`. With `ui.job.snapshot === 'before'`
 * after the readback, the time-stamped preapproval snapshot stays on screen: INV-48219 is counted at its initial outcome
 * (approval required) and nothing else differs, so the sum is still 11.
 */
export function summaryCards(state: State): readonly SummaryCardView[] {
  const counts = jobCounts(state)
  const historical = historicalSnapshot(state)
  const verified = counts.verified - (historical ? 1 : 0)
  const approval = counts.approval + (historical ? 1 : 0)
  return [
    { category: 'verified', count: verified, label: STATUS_META.verified.label },
    { category: 'escalated', count: counts.escalated, label: STATUS_META.escalated.label },
    { category: 'approval', count: approval, label: STATUS_META.approval.label },
    { category: 'unknown', count: counts.unknown, label: STATUS_META.unknown.label },
  ]
}

/** The preapproval snapshot is shown in place of a verified one: asked for (`snapshot: 'before'`) and INV-48219 is independently verified. */
export const historicalSnapshot = (state: State): boolean => state.ui.job.snapshot === 'before' && state.readback.status === 'verified'

/** `Before approval` until the independent readback lands (or while the earlier snapshot is shown), then `After approval and verification`. */
export const snapshotLabel = (state: State): string => (state.readback.status === 'verified' && !historicalSnapshot(state) ? SNAPSHOT_AFTER : SNAPSHOT_BEFORE)

export const jobSettled = (state: State): boolean => state.job.status === 'partiallyComplete'

// -- SC23 / SC24 --------------------------------------------------------------------------------

export interface ApprovalView {
  readonly decision: State['approval']['decision']
  readonly readback: State['readback']['status']
  /** Approved and not yet independently read back: the count has not moved. */
  readonly awaiting: boolean
  readonly verified: boolean
  /** Why the viewpoint cannot decide (the reducer's own authority reason), or null. */
  readonly block: string | null
  readonly approver: string
  readonly before: string
  readonly after: string
}

export function approvalView(state: State): ApprovalView {
  const awaiting = state.approval.decision === 'approved' && state.readback.status === 'pending'
  return {
    decision: state.approval.decision,
    readback: state.readback.status,
    awaiting,
    verified: state.readback.status === 'verified',
    block: refusal(state, { type: 'APPROVE', invoice: APPROVAL_INVOICE.invoice }),
    approver: 'Daniel Okafor \u00b7 Tier 3',
    before: APPROVAL_BEFORE,
    after: APPROVAL_AFTER,
  }
}

/** The reducer's reason for refusing a decision now, by kind; null when the action would be accepted. */
export const decisionBlock = (state: State, type: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'): string | null => refusal(state, { type, invoice: APPROVAL_INVOICE.invoice } as Action)

export const UNKNOWN = { invoice: UNKNOWN_INVOICE.invoice, facts: UNKNOWN_FACTS } as const

export const personName = (state: State): string => person(state.actorId).name
