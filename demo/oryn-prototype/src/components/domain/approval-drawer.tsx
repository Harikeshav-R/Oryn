import { ExternalLink, FileText, MessageSquareMore, ShieldCheck, ShieldOff, UserCheck, X } from 'lucide-react'
import type { RefObject } from 'react'
import { StatusBadge } from '@/components/domain/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DrawerContent, Dialog } from '@/components/ui/dialog'
import {
  APPROVAL_AFTER,
  APPROVAL_BEFORE,
  APPROVAL_INVOICE,
  APPROVAL_PENDING_VERIFICATION,
  APPROVAL_PO_CENTS,
  APPROVAL_RULE,
  APPROVER_AUTHORITY,
  varianceDisplay,
  type DecisionState,
  type JobCounts,
} from '@/data/approval'
import { formatCents } from '@/data/invoices'
import { TIER3_REASON } from '@/data/people'

/**
 * CMP-09 / SC23 approval and evidence drawer for INV-48219.
 *
 * Three decisions are distinct handlers: Approve, Reject, Request Changes. None is
 * available without valid Tier 3 authority (`authority !== 'valid'` is the blocked
 * variant): the buttons stay in the tab order, name the missing prerequisite, and do
 * nothing. A decision is recorded once. Approval is not verification: after Approve the
 * case reads "Awaiting verification" and the counts below stay where they were until an
 * independent readback arrives, which this drawer cannot cause.
 */
export type ApprovalAuthority = 'valid' | 'absent' | 'wrongScope'

const AUTHORITY_TEXT: Record<Exclude<ApprovalAuthority, 'valid'>, string> = {
  absent: 'No Tier 3 delegation is held by the current viewpoint.',
  wrongScope: 'The delegation held does not cover this object and scope.',
}

const DECISION_TEXT: Record<Exclude<DecisionState, 'pending'>, string> = {
  approved: 'Approved. Independent readback has not run.',
  rejected: 'Rejected. The invoice stays unmatched.',
  changesRequested: 'Changes requested. The invoice stays unmatched.',
}

const COUNT_LABELS: readonly [keyof JobCounts, string][] = [
  ['verified', 'Verified'],
  ['escalated', 'Escalated'],
  ['approval', 'Approval Required'],
  ['unknown', 'Outcome Unknown'],
]

function Fact({ text }: { text: string }) {
  return <li className="border-b py-2 type-data text-foreground last:border-b-0">{text}</li>
}

export function ApprovalDrawer({
  open,
  onOpenChange,
  authority,
  decision,
  onDecide,
  readbackVerified,
  counts,
  onOpenSource,
  returnFocusRef,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  authority: ApprovalAuthority
  decision: DecisionState
  onDecide: (decision: Exclude<DecisionState, 'pending'>) => void
  /** Independent readback has arrived for this case. Only the runtime sets this. */
  readbackVerified: boolean
  counts: JobCounts
  onOpenSource?: (source: string) => void
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  const blocked = authority !== 'valid'
  const decided = decision !== 'pending'
  const reason = blocked ? TIER3_REASON : decided ? 'A decision is already recorded' : undefined
  const locked = blocked || decided
  const verified = decision === 'approved' && readbackVerified

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        anchor="approval-drawer"
        title={APPROVAL_INVOICE.invoice}
        description={APPROVAL_INVOICE.supplier}
        returnFocusRef={returnFocusRef}
        data-authority={authority}
        footer={
          <>
            <Button
              variant="outline"
              icon={<MessageSquareMore />}
              disabled={locked}
              disabledReason={reason}
              onClick={() => onDecide('changesRequested')}
            >
              Request Changes
            </Button>
            <Button variant="danger" icon={<X />} disabled={locked} disabledReason={reason} onClick={() => onDecide('rejected')}>
              Reject
            </Button>
            <Button variant="primary" icon={<UserCheck />} disabled={locked} disabledReason={reason} onClick={() => onDecide('approved')}>
              Approve
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {verified ? (
              <StatusBadge status="verified" />
            ) : decision === 'approved' ? (
              <Badge variant="outline">{APPROVAL_PENDING_VERIFICATION}</Badge>
            ) : (
              <StatusBadge status="approval" />
            )}
            <Badge variant="neutral">Tier 3</Badge>
          </div>

          <ul className="rounded-lg border px-3" aria-label="Invoice and purchase order">
            <Fact text={`Invoice ${formatCents(APPROVAL_INVOICE.amountCents)}`} />
            <Fact text={`${APPROVAL_INVOICE.po} ${formatCents(APPROVAL_PO_CENTS)}`} />
            <Fact text={`Variance ${varianceDisplay()}`} />
          </ul>

          <section aria-labelledby="approval-diff">
            <h3 id="approval-diff" className="mb-2 type-card">
              Change
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-sm border bg-surface-2 p-3 type-data">Before: {APPROVAL_BEFORE}</div>
              <div className="rounded-sm border p-3 type-data">After: {APPROVAL_AFTER}</div>
            </div>
          </section>

          <section aria-labelledby="approval-authority" className="space-y-2">
            <h3 id="approval-authority" className="type-card">
              Authority
            </h3>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              {blocked ? (
                <ShieldOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              ) : (
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              )}
              <div className="type-data">
                <p>{blocked ? TIER3_REASON : APPROVER_AUTHORITY}</p>
                <p className="mt-1 text-muted-foreground">
                  {blocked ? AUTHORITY_TEXT[authority] : 'Delegation covers this object, scope and action.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="link" icon={<FileText />} trailingIcon={<ExternalLink />} onClick={() => onOpenSource?.(APPROVAL_RULE)}>
                {APPROVAL_RULE}
              </Button>
            </div>
          </section>

          <p role="status" data-decision-readout="" className="type-data">
            {decided ? DECISION_TEXT[decision] : 'No decision recorded.'}
          </p>

          <section aria-labelledby="approval-counts">
            <h3 id="approval-counts" className="mb-2 type-card">
              JOB-0117 counts
            </h3>
            <dl data-job-counts="" className="grid grid-cols-2 gap-x-6 type-data">
              {COUNT_LABELS.map(([key, label]) => (
                <div key={key} className="flex justify-between border-b py-1">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd data-count={key}>{counts[key]}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 type-micro text-muted-foreground">
              Verified changes only after independent readback. A decision does not change it.
            </p>
          </section>
        </div>
      </DrawerContent>
    </Dialog>
  )
}
