import type { StatusId } from './status'
import { TEAM, supplierName, type SupplierId } from './people'

/**
 * DAT-02: the eleven JOB-0117 invoice cases (Supplier Invoice Reconciler v1.0, AP East).
 * Amounts are integer cents. A missing PO is `null` and renders as an em dash; absent PO
 * amounts are never inferred. `outcome` is the initial outcome only: selecting a row
 * never changes it.
 */
export interface InvoiceCase {
  invoice: string
  supplier: string
  amountCents: number
  po: string | null
  supplierId?: SupplierId
  /** Null when the source does not provide the purchase order amount. */
  poAmountCents?: number | null
  outcome: StatusId
  /** Exact qualifier text from the fixture, shown beside the badge. */
  qualifier?: string
}

export const JOB_ID = 'JOB-0117'
export const JOB_NAME = 'Supplier Invoice Reconciler v1.0'
export const JOB_TEAM = TEAM

export const INVOICE_CASES: readonly InvoiceCase[] = [
  { invoice: 'INV-48210', supplierId: 'brightwater', supplier: supplierName('brightwater'), amountCents: 624000, po: 'PO-1031', poAmountCents: null, outcome: 'verified' },
  { invoice: 'INV-48211', supplierId: 'copperline', supplier: supplierName('copperline'), amountCents: 311840, po: 'PO-1032', poAmountCents: null, outcome: 'verified' },
  { invoice: 'INV-48212', supplierId: 'northgate', supplier: supplierName('northgate'), amountCents: 190500, po: 'PO-1034', poAmountCents: null, outcome: 'verified' },
  { invoice: 'INV-48213', supplierId: 'orchard-lane', supplier: supplierName('orchard-lane'), amountCents: 1248000, po: 'PO-1036', poAmountCents: null, outcome: 'verified' },
  { invoice: 'INV-48214', supplierId: 'harlow', supplier: supplierName('harlow'), amountCents: 84725, po: 'PO-1037', poAmountCents: null, outcome: 'verified' },
  {
    invoice: 'INV-48215',
    supplierId: 'ironbark',
    supplier: supplierName('ironbark'),
    amountCents: 226000,
    po: null,
    poAmountCents: null,
    outcome: 'escalated',
    qualifier: 'Missing Purchase Order',
  },
  { invoice: 'INV-48216', supplierId: 'vantage', supplier: supplierName('vantage'), amountCents: 52990, po: 'PO-1039', poAmountCents: null, outcome: 'verified' },
  { invoice: 'INV-48217', supplierId: 'meadowbrook', supplier: supplierName('meadowbrook'), amountCents: 137612, po: 'PO-1040', poAmountCents: null, outcome: 'verified' },
  {
    invoice: 'INV-48218',
    supplierId: 'sable',
    supplier: supplierName('sable'),
    amountCents: 441500,
    po: null,
    poAmountCents: null,
    outcome: 'escalated',
    qualifier: 'Missing Purchase Order',
  },
  {
    invoice: 'INV-48219',
    supplierId: 'brightwater',
    supplier: supplierName('brightwater'),
    amountCents: 1842000,
    po: 'PO-1042',
    poAmountCents: 1798000,
    outcome: 'approval',
    qualifier: 'Tier 3',
  },
  { invoice: 'INV-48220', supplierId: 'northgate', supplier: supplierName('northgate'), amountCents: 273250, po: 'PO-1044', poAmountCents: null, outcome: 'unknown' },
]

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** Integer cents to a display amount. Locale is fixed to en-US. */
export function formatCents(cents: number): string {
  return usd.format(cents / 100)
}
