import type { RecordId } from '@/state/types'
import { INVOICE_CASES } from './invoices'
import { WORK_RECORDS } from './work-records'

/**
 * APP-01 inbox rows, in their fixed film order: the four context records first, then four
 * neutral fixture rows. Rows carry no dates, times or amounts. Only a row with a `record` opens
 * a message: the reducer has no record for the neutral rows, so they stay inert.
 */
export interface InboxRow {
  readonly id: string
  readonly supplier: string
  readonly subject: string
  readonly record: RecordId | null
}

const RECORD_ROWS: readonly RecordId[] = ['INV-48219', 'INV-48231', 'INV-48210', 'INV-48203']
const NEUTRAL_ROWS = ['INV-48211', 'INV-48212', 'INV-48213', 'INV-48214'] as const

function neutralRow(id: string): InboxRow {
  const found = INVOICE_CASES.find((row) => row.invoice === id)
  if (!found) throw new Error(`Unknown invoice fixture ${id}`)
  return { id, supplier: found.supplier, subject: `Invoice ${id}`, record: null }
}

export const INBOX_ROWS: readonly InboxRow[] = Object.freeze([
  ...RECORD_ROWS.map((id): InboxRow => ({ id, supplier: WORK_RECORDS[id].supplier, subject: `Invoice ${id}`, record: id })),
  ...NEUTRAL_ROWS.map(neutralRow),
])
