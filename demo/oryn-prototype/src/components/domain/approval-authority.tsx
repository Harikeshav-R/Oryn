import { ShieldCheck, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  APPROVAL_AFTER,
  APPROVAL_BEFORE,
  APPROVAL_INVOICE,
  APPROVAL_PENDING_VERIFICATION,
  APPROVAL_RULE,
  APPROVER_AUTHORITY,
  jobCounts,
  type DecisionState,
} from '@/data/approval'
import { PEOPLE, TIER3_REASON } from '@/data/people'

export type DelegationStatus = 'valid' | 'absent' | 'expired' | 'wrongScope'
export type ApprovalDecision = Exclude<DecisionState, 'pending'>

export interface ApprovalAuthorityProps {
  /** Current actor identity; a role label alone is never a delegation. */
  personId: string
  /** Independently supplied result of the Tier 3 delegation check for this case. */
  delegation: DelegationStatus
  decision: DecisionState
  /** Set only by the independent source-readback event. */
  readbackVerified: boolean
  onDecide: (decision: ApprovalDecision) => void
  onOpenSource?: (source: string) => void
}

const DELEGATION_REASON: Record<Exclude<DelegationStatus, 'valid'>, string> = {
  absent: 'No Tier 3 delegation is held by the current person.',
  expired: 'The Tier 3 delegation has expired.',
  wrongScope: 'The delegation does not cover this invoice, scope and action.',
}

const DECISION_LABEL: Record<DecisionState, string> = {
  pending: 'No decision recorded.',
  approved: 'Approved',
  rejected: 'Rejected',
  changesRequested: 'Changes requested',
}

/** CMP-31: a decision and the independent source readback are separate events. */
export function ApprovalAuthority({ personId, delegation, decision, readbackVerified, onDecide, onOpenSource }: ApprovalAuthorityProps) {
  const person = PEOPLE.find((candidate) => candidate.id === personId)
  const reason = personId !== 'daniel'
    ? `${TIER3_REASON}. Current person is not Daniel Okafor.`
    : delegation !== 'valid'
      ? `${TIER3_REASON}. ${DELEGATION_REASON[delegation]}`
      : undefined
  const lockedReason = reason ?? (decision !== 'pending' ? 'A decision is already recorded.' : undefined)
  const verified = decision === 'approved' && readbackVerified
  const counts = jobCounts(decision, readbackVerified)

  return (
    <section aria-label="Approval authority" data-anchor="approval-authority" data-authority={reason ? 'unauthorized' : 'valid'} className="rounded-lg border p-3">
      <div className="flex items-start gap-3">
        {reason ? <ShieldOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
        <div className="min-w-0 space-y-1 type-data">
          <p>{APPROVER_AUTHORITY}</p>
          <p className="text-muted-foreground">Current person: {person?.name ?? 'Unavailable'}</p>
          <p>{reason ?? `Delegation covers ${APPROVAL_INVOICE.invoice}, Tier 3 variance approval.`}</p>
          {onOpenSource ? (
            <Button variant="link" size="sm" onClick={() => onOpenSource(APPROVAL_RULE)}>{APPROVAL_RULE}</Button>
          ) : <p>{APPROVAL_RULE}</p>}
        </div>
      </div>
      <div className="mt-3 border-t pt-3 type-data">
        <p>Proposed change: {APPROVAL_BEFORE} → {APPROVAL_AFTER}</p>
        <p className="mt-2" role="status">Decision: {DECISION_LABEL[decision]}</p>
        <p className="mt-1" role="status">Independent readback: {verified ? 'Verified' : decision === 'approved' ? APPROVAL_PENDING_VERIFICATION : 'Not verified'}</p>
        <p className="mt-1 text-muted-foreground">Verified: {counts.verified} · Approval Required: {counts.approval}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" disabled={Boolean(lockedReason)} disabledReason={lockedReason} onClick={() => onDecide('approved')}>Approve</Button>
        <Button size="sm" variant="danger" disabled={Boolean(lockedReason)} disabledReason={lockedReason} onClick={() => onDecide('rejected')}>Reject</Button>
        <Button size="sm" variant="outline" disabled={Boolean(lockedReason)} disabledReason={lockedReason} onClick={() => onDecide('changesRequested')}>Request Changes</Button>
      </div>
    </section>
  )
}
