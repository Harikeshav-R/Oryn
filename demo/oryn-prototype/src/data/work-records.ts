import type { RecordId } from '@/state/types'
import { DEMONSTRATIONS } from './demonstrations'
import { INCIDENT } from './incident'
import { INVOICE_CASES, formatCents } from './invoices'
import { supplierName, type SupplierId } from './people'

/**
 * APP-01 to APP-08 records: the four invoice contexts the original work applications show.
 * One record carries every label its message, document, ERP bill and tracker row repeat, so a
 * screen can never show one identity beside another record's evidence.
 *
 * Amounts are integer cents; an amount the source does not state is `null` and is never inferred
 * (INV-48203 has no total and no PO, INV-48210 has no PO amount). Cases keep their canonical
 * numbers: INV-48219 and INV-48210 come from DAT-02, INV-48231 from DAT-07.
 */
export type RecordKind = 'hero' | 'problem' | 'demonstration' | 'incident'

export interface WorkRecord {
  readonly id: RecordId
  readonly kind: RecordKind
  readonly supplierId: SupplierId
  readonly supplier: string
  /** Purchase order number, or `null` when the source states none. */
  readonly po: string | null
  readonly totalCents: number | null
  readonly poTotalCents: number | null
  /** `Mon 09:14` for Demonstration D1; every other message carries no time. */
  readonly receivedLabel: string | null
}

function invoice(id: string) {
  const found = INVOICE_CASES.find((row) => row.invoice === id)
  if (!found) throw new Error(`Unknown invoice fixture ${id}`)
  return found
}

const hero = invoice('INV-48219')
const problem = invoice('INV-48210')
const d1 = DEMONSTRATIONS.find((demo) => demo.invoice === 'INV-48203')
if (!d1) throw new Error('Demonstration D1 requires INV-48203')
const kestrelCase = INCIDENT.affectedCases.find((row) => row.id === 'INV-48231')
if (!kestrelCase || kestrelCase.invoiceAmountCents == null) throw new Error('INC-0042 requires the INV-48231 amount')

/** APP-02 Kestrel layout v2: the handling fee is a separate line after the subtotal. */
export const KESTREL_DOCUMENT = Object.freeze({
  supplier: supplierName('kestrel'),
  invoice: 'INV-48231',
  po: 'PO-1051',
  subtotalCents: 417_500,
  handlingFeeCents: 3_850,
  totalCents: kestrelCase.invoiceAmountCents,
  /** The PO comparison value (`E-0042-02`); never a supplier claim. */
  poTotalCents: 417_500,
})
if (KESTREL_DOCUMENT.subtotalCents + KESTREL_DOCUMENT.handlingFeeCents !== KESTREL_DOCUMENT.totalCents) {
  throw new Error('Kestrel subtotal plus handling fee must equal the invoice total')
}

export const WORK_RECORDS: Readonly<Record<RecordId, WorkRecord>> = Object.freeze({
  'INV-48219': { id: 'INV-48219', kind: 'hero', supplierId: 'brightwater', supplier: hero.supplier, po: hero.po, totalCents: hero.amountCents, poTotalCents: hero.poAmountCents ?? null, receivedLabel: null },
  'INV-48210': { id: 'INV-48210', kind: 'problem', supplierId: 'brightwater', supplier: problem.supplier, po: problem.po, totalCents: problem.amountCents, poTotalCents: problem.poAmountCents ?? null, receivedLabel: null },
  'INV-48203': { id: 'INV-48203', kind: 'demonstration', supplierId: d1.supplierId, supplier: supplierName(d1.supplierId), po: null, totalCents: null, poTotalCents: null, receivedLabel: d1.time },
  'INV-48231': { id: 'INV-48231', kind: 'incident', supplierId: 'kestrel', supplier: KESTREL_DOCUMENT.supplier, po: KESTREL_DOCUMENT.po, totalCents: KESTREL_DOCUMENT.totalCents, poTotalCents: KESTREL_DOCUMENT.poTotalCents, receivedLabel: null },
})

export const workRecord = (id: RecordId): WorkRecord => WORK_RECORDS[id]

/** Money for display, or an em dash when the source states no amount. */
export const centsOrDash = (cents: number | null): string => (cents === null ? '\u2014' : formatCents(cents))

/** Records of one supplier, in `RECORD_IDS` order. */
export const recordsOfSupplier = (supplierId: SupplierId): readonly WorkRecord[] => Object.values(WORK_RECORDS).filter((record) => record.supplierId === supplierId)

/** The commitment reminder and the vendor record: only this supplier carries them. */
export const COMMITMENT_SUPPLIER: SupplierId = 'kestrel'
