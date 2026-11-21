import { describe, expect, test } from 'bun:test'
import { APPROVAL_AFTER, APPROVER_AUTHORITY, APPROVAL_BEFORE, APPROVAL_EXCEEDS_THRESHOLD, APPROVAL_VARIANCE_CENTS, UNKNOWN_FACTS, varianceDisplay } from '@/data/approval'
import { formatCents, INVOICE_CASES } from '@/data/invoices'
import { caseRows, summaryCards } from '@/product/job'
import { exceedsThreshold, jobCounts, jobLabel, reconstruct, unknownCase, type Action, type State } from '@/state'
import { act, expectRejected } from '@/state/test-helpers'

const expected = [
  ['INV-48210', 'Brightwater Industrial', 624000, 'PO-1031', null, 'verified'],
  ['INV-48211', 'Copperline Cables', 311840, 'PO-1032', null, 'verified'],
  ['INV-48212', 'Northgate Pallets', 190500, 'PO-1034', null, 'verified'],
  ['INV-48213', 'Orchard Lane Foods', 1248000, 'PO-1036', null, 'verified'],
  ['INV-48214', 'Harlow Tooling', 84725, 'PO-1037', null, 'verified'],
  ['INV-48215', 'Ironbark Fasteners', 226000, null, null, 'escalated'],
  ['INV-48216', 'Vantage Print', 52990, 'PO-1039', null, 'verified'],
  ['INV-48217', 'Meadowbrook Office', 137612, 'PO-1040', null, 'verified'],
  ['INV-48218', 'Sable & Co. Logistics', 441500, null, null, 'escalated'],
  ['INV-48219', 'Brightwater Industrial', 1842000, 'PO-1042', 1798000, 'approval'],
  ['INV-48220', 'Northgate Pallets', 273250, 'PO-1044', null, 'unknown'],
] as const

function snapshot(): State {
  const started = act(reconstruct('ST09'), { type: 'APPROVE_RELEASE' }, { type: 'CONFIRM_SCOPE' }, { type: 'CONFIRM_SELECTION' }, { type: 'OPEN_JOB_SCOPE' }, { type: 'RELEASE_AND_START' })
  const evaluations: Action[] = INVOICE_CASES.map(({ invoice }) => ({ type: 'EVALUATE_CASE', invoice }))
  return act(started, ...evaluations, { type: 'PAUSE_FOR_APPROVAL' }, { type: 'SELECT_ACTOR', personId: 'daniel' })
}

describe('DAT-02 job audit', () => {
  test('the ordered frozen population matches all eleven canonical records', () => {
    expect(INVOICE_CASES.map(({ invoice, supplier, amountCents, po, poAmountCents, outcome }) => [invoice, supplier, amountCents, po, poAmountCents, outcome])).toEqual(expected.map((row) => [...row]))
    const rows = caseRows(snapshot())
    expect(rows.map(({ invoice, supplier, amount, po }) => [invoice, supplier, amount, po])).toEqual(
      expected.map(([invoice, supplier, cents, po]) => [invoice, supplier, formatCents(cents), po ?? '—']),
    )
    expect(new Set(INVOICE_CASES.map(({ invoice }) => invoice)).size).toBe(11)
    expect(INVOICE_CASES.filter(({ outcome }) => outcome === 'escalated').map(({ qualifier }) => qualifier)).toEqual(['Missing Purchase Order', 'Missing Purchase Order'])
  })

  test('variance uses cents and distinguishes the exact threshold from one cent over', () => {
    expect(APPROVAL_VARIANCE_CENTS).toBe(44000)
    expect(formatCents(APPROVAL_VARIANCE_CENTS)).toBe('$440.00')
    expect(varianceDisplay()).toBe('$440.00 / 2.45%')
    expect(APPROVAL_EXCEEDS_THRESHOLD).toBe(true)
    expect(exceedsThreshold(102000, 100000, 200)).toBe(false)
    expect(exceedsThreshold(102001, 100000, 200)).toBe(true)
    expect([APPROVAL_BEFORE, APPROVAL_AFTER, APPROVER_AUTHORITY]).toEqual(['Variance Hold', 'Matched - Variance Approved', 'Daniel Okafor · Tier 3'])
  })

  test('approval and independent readback produce distinct complete snapshots', () => {
    const before = snapshot()
    const approved = act(before, { type: 'APPROVE', invoice: 'INV-48219' })
    const verified = act(approved, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' })
    const initial = { verified: 7, escalated: 2, approval: 1, unknown: 1, queued: 0, total: 11 }
    expect(jobCounts(before)).toEqual(initial)
    expect(jobCounts(approved)).toEqual(initial)
    expect(approved.readback.status).toBe('pending')
    expect(caseRows(approved).find(({ invoice }) => invoice === 'INV-48219')?.note).toBe('Approved · Awaiting verification')
    expect(summaryCards(before).map(({ count }) => count)).toEqual([7, 2, 1, 1])
    expect(summaryCards(approved).map(({ count }) => count)).toEqual([7, 2, 1, 1])
    expect(summaryCards(verified).map(({ count }) => count)).toEqual([8, 2, 0, 1])
    expect(jobCounts(verified)).toEqual({ verified: 8, escalated: 2, approval: 0, unknown: 1, queued: 0, total: 11 })
    for (const state of [before, approved, verified]) {
      expect(jobLabel(state)).toBe('Partially Complete')
      expect(unknownCase(state)).toEqual({ invoice: 'INV-48220', outcome: 'Outcome Unknown', held: true, resubmission: 'Resubmission unavailable' })
      expect(state.job.outcomes['INV-48220']).toBe('unknown')
      expectRejected(state, { type: 'APPROVE', invoice: 'INV-48220' }, 'target')
    }
    expect(UNKNOWN_FACTS).toMatchObject({ cause: 'ERP submit timed out', hold: 'Held', rule: 'Do not resubmit until reconciled' })
  })
})
