import type { TrackerColumn, TrackerInvoice } from '@/state/types'
import { UNKNOWN_FACTS, APPROVER_NAME } from './approval'
import { INVOICE_CASES } from './invoices'
import { TEAM } from './people'
import type { StatusId } from './status'
import { STATUS_META } from './status'
import { WORK_RECORDS } from './work-records'

/**
 * APP-06 AP Exceptions Tracker rows. Exactly six, in ascending invoice order. A row is a handoff
 * between tools, never an independent readback: it carries no verified status and invents no
 * issue, owner or outcome. INV-48203 and INV-48210 are context rows: every field the source does
 * not state is `null` and renders as an em dash.
 *
 * Supplier names, qualifiers and outcomes come from the DAT-02 invoice cases; the owner `AP East`
 * is the team, not a person.
 */
export interface TrackerRow {
  readonly invoice: TrackerInvoice
  readonly supplier: string
  /** Issue text, or `null` when the sheet states none. */
  readonly issue: string | null
  /** Owner, or `null` when the sheet states none. `AP East` is a team. */
  readonly owner: string | null
  /** Handoff state, or `null` when the sheet states none. */
  readonly status: StatusId | null
}

export const VARIANCE_ISSUE = 'Variance above 2.00%'

function caseOf(invoice: string) {
  const found = INVOICE_CASES.find((row) => row.invoice === invoice)
  if (!found) throw new Error(`Unknown invoice fixture ${invoice}`)
  return found
}

function exception(invoice: TrackerInvoice, issue: string, owner: string, status: StatusId): TrackerRow {
  return { invoice, supplier: caseOf(invoice).supplier, issue, owner, status }
}

function context(invoice: 'INV-48203' | 'INV-48210'): TrackerRow {
  return { invoice, supplier: WORK_RECORDS[invoice].supplier, issue: null, owner: null, status: null }
}

const MISSING_PO = caseOf('INV-48215').qualifier
if (MISSING_PO !== caseOf('INV-48218').qualifier || MISSING_PO === undefined) throw new Error('The two missing-PO cases share one qualifier')

export const TRACKER_ROWS: readonly TrackerRow[] = Object.freeze([
  context('INV-48203'),
  context('INV-48210'),
  exception('INV-48215', MISSING_PO, TEAM, caseOf('INV-48215').outcome),
  exception('INV-48218', MISSING_PO, TEAM, caseOf('INV-48218').outcome),
  exception('INV-48219', VARIANCE_ISSUE, APPROVER_NAME, caseOf('INV-48219').outcome),
  exception('INV-48220', UNKNOWN_FACTS.cause, TEAM, caseOf('INV-48220').outcome),
])

export const TRACKER_HEADERS: Readonly<Record<TrackerColumn, string>> = Object.freeze({
  invoice: 'Invoice',
  supplier: 'Supplier',
  issue: 'Issue',
  owner: 'Owner',
  state: 'State',
})

export const NOT_STATED = '\u2014'

/** The text of one cell: what the formula bar shows. Unknown values read as an em dash. */
export function trackerCellText(row: TrackerRow, column: TrackerColumn): string {
  switch (column) {
    case 'invoice':
      return row.invoice
    case 'supplier':
      return row.supplier
    case 'issue':
      return row.issue ?? NOT_STATED
    case 'owner':
      return row.owner ?? NOT_STATED
    case 'state':
      return row.status === null ? NOT_STATED : STATUS_META[row.status].label
  }
}
