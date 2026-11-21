import { INVOICE_CASES, formatCents, type InvoiceCase } from './invoices'
import type { StatusId } from './status'

/**
 * DAT-02 evidence for the two drawers (CMP-09, SC23, SC24). Amounts are integer cents.
 * Counts are derived from the eleven cases; no counter is stored, so a drawer can never
 * disagree with the table.
 */

function findCase(invoice: string): InvoiceCase {
  const found = INVOICE_CASES.find((row) => row.invoice === invoice)
  if (!found) throw new Error(`Unknown invoice fixture ${invoice}`)
  return found
}

export const APPROVAL_INVOICE = findCase('INV-48219')
export const UNKNOWN_INVOICE = findCase('INV-48220')

/** PO-1042 amount comes from the canonical invoice fixture. */
if (APPROVAL_INVOICE.poAmountCents == null) throw new Error('Approval fixture requires a known PO amount')
export const APPROVAL_PO_CENTS = APPROVAL_INVOICE.poAmountCents
export const APPROVAL_RULE = 'AP-RULE-009'
export const APPROVER_NAME = 'Daniel Okafor'
export const APPROVER_AUTHORITY = 'Daniel Okafor \u00b7 Tier 3'
export const APPROVAL_BEFORE = 'Variance Hold'
export const APPROVAL_AFTER = 'Matched - Variance Approved'
export const APPROVAL_PENDING_VERIFICATION = 'Awaiting verification'

const THRESHOLD_PERCENT = 2

export const APPROVAL_VARIANCE_CENTS = APPROVAL_INVOICE.amountCents - APPROVAL_PO_CENTS

/** 2% boundary by integer cross multiplication: variance * 100 > 2 * PO. Equality is accepted. */
export const APPROVAL_EXCEEDS_THRESHOLD = APPROVAL_VARIANCE_CENTS * 100 > THRESHOLD_PERCENT * APPROVAL_PO_CENTS

/** Rounded display only: `$440.00 / 2.45%`. */
export function varianceDisplay(): string {
  const hundredths = Math.round((APPROVAL_VARIANCE_CENTS * 10_000) / APPROVAL_PO_CENTS)
  return `${formatCents(APPROVAL_VARIANCE_CENTS)} / ${(hundredths / 100).toFixed(2)}%`
}

export type DecisionState = 'pending' | 'approved' | 'rejected' | 'changesRequested'

export interface JobCounts {
  verified: number
  escalated: number
  approval: number
  unknown: number
}

function countOutcome(outcome: StatusId): number {
  return INVOICE_CASES.filter((row) => row.outcome === outcome).length
}

export const COUNTS_INITIAL: JobCounts = {
  verified: countOutcome('verified'),
  escalated: countOutcome('escalated'),
  approval: countOutcome('approval'),
  unknown: countOutcome('unknown'),
}

/**
 * Approval and independent readback are separate events. Only a readback that follows an
 * approval moves a case from approval required to verified. A decision alone, including
 * approval, leaves every count at its initial value.
 */
export function jobCounts(decision: DecisionState, readbackVerified: boolean): JobCounts {
  if (decision === 'approved' && readbackVerified) {
    return { ...COUNTS_INITIAL, verified: COUNTS_INITIAL.verified + 1, approval: COUNTS_INITIAL.approval - 1 }
  }
  return COUNTS_INITIAL
}

/** SC24 facts. A timeout proves neither failure nor submission, so custody stays unknown. */
export const UNKNOWN_FACTS = {
  outcome: 'Outcome Unknown',
  cause: 'ERP submit timed out',
  hold: 'Held',
  reconciliation: 'Reconciliation required',
  custody: 'Not resubmitted',
  rule: 'Do not resubmit until reconciled',
  guidance: 'Held \u2014 check outcome before further action',
  unavailable: 'Resubmit unavailable',
  postcondition: 'Business postcondition',
  missingReadback: 'Independent readback: not available',
} as const
