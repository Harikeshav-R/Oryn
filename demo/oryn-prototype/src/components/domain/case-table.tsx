import { useState } from 'react'
import { StatusBadge } from '@/components/domain/status-badge'
import { Button } from '@/components/ui/button'
import { rowClass, type TableDensity } from '@/components/ui/table-row'
import { Table, TableStateRow, Td, Th, type SortDirection, type TableState, type TableStateCopy } from '@/components/ui/table'
import { INVOICE_CASES, JOB_ID, formatCents, type InvoiceCase } from '@/data/invoices'
import { STATUS_META } from '@/data/status'

/**
 * CMP-07 case table (DAT-02). Columns 120/184/100/100/240/80; amounts right-aligned and
 * tabular. Selection is presentation only: it moves a rail and `aria-current`, and never
 * reads or writes an outcome. Visible record details imply no approval.
 * Anchor `case-table`; a film selects a row by passing `selectedId`.
 */
type SortKey = 'invoice' | 'supplier' | 'amount' | 'po'

const COLUMNS = [
  ['Invoice', 120, false, 'invoice'],
  ['Supplier', 184, false, 'supplier'],
  ['Amount', 100, true, 'amount'],
  ['PO', 100, false, 'po'],
  ['Status', 240, false, undefined],
  ['Action', 80, false, undefined],
] as const

/** Sort keys read fixture fields only. Sorting reorders rows; it never touches an outcome. A missing PO sorts last. */
function compare(key: SortKey, a: InvoiceCase, b: InvoiceCase): number {
  switch (key) {
    case 'invoice':
      return a.invoice.localeCompare(b.invoice, 'en-US')
    case 'supplier':
      return a.supplier.localeCompare(b.supplier, 'en-US')
    case 'amount':
      return a.amountCents - b.amountCents
    case 'po':
      return (a.po ?? '\uffff').localeCompare(b.po ?? '\uffff', 'en-US')
  }
}

const STATE_COPY: Record<Exclude<TableState, 'ready'>, TableStateCopy> = {
  loading: { reason: 'Loading case records. No outcome is shown until records arrive.' },
  empty: { reason: 'No cases match the current filter.', action: { label: 'Clear filter' } },
  error: { reason: 'Case records could not be loaded. No outcome is implied.', action: { label: 'Reload records' } },
  unauthorized: { reason: 'Your current role cannot view these case records.', action: { label: 'Switch viewpoint' } },
}

export function CaseTable({
  rows = INVOICE_CASES,
  selectedId,
  onSelect,
  density = 'dense',
  state = 'ready',
  onRecover,
  frame = 0,
  workProgress,
}: {
  rows?: readonly InvoiceCase[]
  selectedId?: string | null
  onSelect?: (invoice: string) => void
  density?: TableDensity
  state?: TableState
  onRecover?: () => void
  frame?: number
  workProgress?: { processed: number; running: boolean }
}) {
  const copy = state === 'ready' ? null : STATE_COPY[state]
  // Default is fixture order, so filmed rows stay pinned. Click cycles none, ascending, descending.
  const [sort, setSort] = useState<{ key: SortKey; direction: Exclude<SortDirection, 'none'> } | null>(null)
  const nextSort = (key: SortKey) =>
    setSort((current) =>
      current?.key !== key ? { key, direction: 'asc' } : current.direction === 'asc' ? { key, direction: 'desc' } : null,
    )
  const ordered = sort
    ? [...rows].sort((a, b) => (sort.direction === 'asc' ? 1 : -1) * compare(sort.key, a, b))
    : rows
  return (
    <Table data-anchor="case-table" aria-label={`${JOB_ID} invoice cases`} aria-rowcount={rows.length + 1}>
      <colgroup>
        {COLUMNS.map(([name, width]) => (
          <col key={name} style={{ width }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {COLUMNS.map(([name, , numeric, key]) => (
            <Th
              key={name}
              numeric={numeric}
              sortDirection={key ? (sort?.key === key ? sort.direction : 'none') : undefined}
              onSort={key ? () => nextSort(key) : undefined}
            >
              {name}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {state !== 'ready' && copy ? (
          <TableStateRow
            state={state}
            colSpan={COLUMNS.length}
            copy={copy.action ? { ...copy, action: { ...copy.action, onAction: onRecover } } : copy}
            frame={frame}
          />
        ) : (
          ordered.map((row) => {
            const selected = row.invoice === selectedId
            const fixtureIndex = rows.indexOf(row)
            const pending = workProgress && fixtureIndex >= workProgress.processed
            const active = pending && fixtureIndex === workProgress?.processed
            const displayLabel = pending ? (active && workProgress?.running ? 'Running' : 'Queued') : STATUS_META[row.outcome].label
            return (
              <tr
                key={row.invoice}
                data-case={row.invoice}
                data-selected={selected ? 'true' : undefined}
                aria-current={selected ? 'true' : undefined}
                className={rowClass(density, selected)}
                tabIndex={onSelect ? 0 : undefined}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && event.key === 'Enter') onSelect?.(row.invoice)
                }}
                onClick={() => onSelect?.(row.invoice)}
              >
                <Td>{row.invoice}</Td>
                <Td className="whitespace-nowrap">{row.supplier}</Td>
                <Td numeric>{formatCents(row.amountCents)}</Td>
                <Td>
                  {row.po ?? (
                    <>
                      <span aria-hidden="true">{'\u2014'}</span>
                      <span className="sr-only">No purchase order</span>
                    </>
                  )}
                </Td>
                <Td>
                  <span className="flex items-center gap-2">
                    {pending ? (
                      active && workProgress?.running ? <StatusBadge status="running" frame={frame} /> : <span>Queued</span>
                    ) : (
                      <>
                        <StatusBadge status={row.outcome} />
                        {row.qualifier && <span className="whitespace-nowrap">{row.qualifier}</span>}
                      </>
                    )}
                  </span>
                </Td>
                <Td>
                  <Button
                    variant="link"
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect?.(row.invoice)
                    }}
                    aria-label={`Open ${row.invoice}, ${displayLabel}`}
                  >
                    Open
                  </Button>
                </Td>
              </tr>
            )
          })
        )}
      </tbody>
    </Table>
  )
}
