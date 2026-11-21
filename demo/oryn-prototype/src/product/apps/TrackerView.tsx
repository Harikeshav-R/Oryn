import { Search, Table2 } from 'lucide-react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { StatusBadge } from '@/components/domain/status-badge'
import { INVOICE_CASES } from '@/data/invoices'
import { NOT_STATED, TRACKER_HEADERS, trackerCellText, type TrackerRow } from '@/data/tracker-rows'
import { cn } from '@/lib/utils'
import { TRACKER_COLUMNS, TRACKER_INVOICES, trackerRows, type TrackerColumn } from '@/state'
import { act, filmAnchor, motionProgress, type ProductProps } from '../contract'
import { appTabMeta } from '../desktop-data'
import { at, within } from '../geometry'
import { appAt } from './frame'
import {
  COLUMN_WIDTH,
  COLUMN_X,
  EMPTY_ROW_COUNT,
  FIRST_ROW_TOP,
  FORMULA_BAR,
  GRID_RECT,
  GUTTER_WIDTH,
  HEADER_ROW,
  MARK_RECT,
  MENU_STRIP,
  ROW_HEIGHT,
  TITLE_RECT,
  cellAfterKey,
  rowRect,
  trackerCellAnchor,
  trackerRowAnchor,
  type TrackerCell,
} from './tracker-layout'

/**
 * APP-06 SC07: an original, simplified spreadsheet of invoice exceptions. A row is a handoff between
 * tools, never an independent readback: no row shows a verified status, and the context rows state
 * no issue, owner or outcome. Pure function of `{ state, film }`; the focused cell lives in
 * `state.ui.app.trackerFocus`. Passive observation is neutral ink: no execution cyan appears here.
 *
 * Every rectangle comes from `tracker-layout.ts`. Focus is an inset outline (a box shadow), so a
 * cell's box never changes with selection. In a film the outline fades in over 150 ms from the last
 * `FOCUS_TRACKER_CELL`; in the app it uses a CSS transition that reduced motion switches off.
 */

type Cell = TrackerCell

const FIRST_CELL: Cell = { invoice: TRACKER_INVOICES[0], column: 'invoice' }
const CASE_IDS: readonly string[] = INVOICE_CASES.map((row) => row.invoice)
const COLUMN_LETTERS: Readonly<Record<TrackerColumn, string>> = { invoice: 'A', supplier: 'B', issue: 'C', owner: 'D', state: 'E' }

const cellDomId = (cell: Cell): string => `tracker-${cell.invoice.toLowerCase()}-${cell.column}`
const sameCell = (a: Cell | null, b: Cell): boolean => a !== null && a.invoice === b.invoice && a.column === b.column

function rowNumberStyle(emphasised: boolean): CSSProperties {
  return { position: 'absolute', left: 0, top: 0, width: GUTTER_WIDTH, height: ROW_HEIGHT, fontWeight: emphasised ? 700 : undefined }
}

function EmptyRows({ filled }: { filled: number }) {
  const count = EMPTY_ROW_COUNT + (TRACKER_INVOICES.length - filled)
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const top = FIRST_ROW_TOP + (filled + index) * ROW_HEIGHT
        return (
          <div
            key={index}
            role="row"
            aria-rowindex={filled + index + 2}
            className="box-border border-b bg-surface"
            style={at(within(GRID_RECT, { x: 0, y: top, width: GRID_RECT.width, height: ROW_HEIGHT }))}
          >
            <div role="rowheader" aria-label={`Row ${filled + index + 1}, empty`} className="box-border flex items-center justify-center border-r bg-surface-2 font-mono text-[11px] leading-4 text-muted-foreground" style={rowNumberStyle(false)}>
              {filled + index + 1}
            </div>
            {TRACKER_COLUMNS.map((column) => (
              <div key={column} role="gridcell" className="box-border border-r" style={{ position: 'absolute', left: COLUMN_X[column], top: 0, width: COLUMN_WIDTH[column], height: ROW_HEIGHT }} />
            ))}
          </div>
        )
      })}
    </>
  )
}

function CellContent({ row, column }: { row: TrackerRow; column: TrackerColumn }) {
  if (column === 'state' && row.status !== null) return <StatusBadge status={row.status} />
  const text = trackerCellText(row, column)
  return <span className={cn('block min-w-0 truncate', text === NOT_STATED && 'text-muted-foreground')}>{text}</span>
}

export function TrackerView(props: ProductProps) {
  const { state, film } = props
  const rows = trackerRows(state)
  const focus = state.ui.app.trackerFocus
  const tabbable = focus ?? FIRST_CELL
  const progress = motionProgress(film, 'FOCUS_TRACKER_CELL')
  const outline = progress >= 1 ? 'var(--foreground)' : `color-mix(in srgb, var(--foreground) ${Math.round(progress * 100)}%, transparent)`
  const focusedRow = focus === null ? undefined : rows.find((row) => row.invoice === focus.invoice)
  const meta = appTabMeta('tracker')

  const onCellKeyDown = (cell: Cell) => (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (cell.column === 'invoice' && CASE_IDS.includes(cell.invoice)) act(props, { type: 'SELECT_CASE', caseId: cell.invoice })
      return
    }
    const next = cellAfterKey(cell, event.key, event.shiftKey)
    if (next === null) return
    event.preventDefault()
    act(props, { type: 'FOCUS_TRACKER_CELL', invoice: next.invoice, column: next.column })
    event.currentTarget.ownerDocument.getElementById(cellDomId(next))?.focus()
  }

  return (
    <section aria-label="AP Exceptions Tracker" data-app="tracker" className="text-foreground">
      <header className="box-border border-b bg-surface" style={appAt(MENU_STRIP)}>
        <img src={meta.mark} alt="" width={MARK_RECT.width} height={MARK_RECT.height} className="absolute" style={at(within(MENU_STRIP, MARK_RECT))} />
        <h1 {...filmAnchor('tracker-title')} className="m-0 whitespace-nowrap font-sans text-[14px] font-medium leading-5" style={at(within(MENU_STRIP, TITLE_RECT))}>
          {meta.title}
        </h1>
        {['File', 'Edit', 'View'].map((label, index) => (
          <span key={label} aria-hidden className="absolute font-sans text-[12px] leading-[18px] text-muted-foreground" style={{ left: 264 + index * 48, top: 11 }}>
            {label}
          </span>
        ))}
        <Table2 size={16} aria-hidden className="absolute text-muted-foreground" style={{ left: 1200, top: 12 }} />
        <Search size={16} aria-hidden className="absolute text-muted-foreground" style={{ left: 1240, top: 12 }} />
      </header>

      <div role="group" aria-label="Formula bar" {...filmAnchor('tracker-formula')} className="box-border border-b bg-surface font-mono text-[12px] leading-[18px]" style={appAt(FORMULA_BAR)}>
        <span data-formula-ref className="absolute box-border border-r px-3 text-muted-foreground" style={{ left: 0, top: 0, width: 72, height: 31, lineHeight: '31px' }}>
          {focus === null ? '' : `${COLUMN_LETTERS[focus.column]}${TRACKER_INVOICES.indexOf(focus.invoice) + 1}`}
        </span>
        <span aria-hidden className="absolute text-muted-foreground" style={{ left: 84, top: 6 }}>
          fx
        </span>
        <span data-formula-value className="absolute truncate" style={{ left: 116, top: 6, width: 1100, height: 18 }}>
          {focus === null || focusedRow === undefined ? '' : trackerCellText(focusedRow, focus.column)}
        </span>
      </div>

      <div role="grid" aria-label="Invoice exceptions" aria-rowcount={TRACKER_INVOICES.length + EMPTY_ROW_COUNT + 1} aria-colcount={TRACKER_COLUMNS.length + 1} {...filmAnchor('tracker-grid')} style={appAt(GRID_RECT)}>
        <div role="row" aria-rowindex={1} className="box-border border-b bg-surface-2 font-sans text-[12px] font-bold leading-[18px]" style={at(within(GRID_RECT, HEADER_ROW))}>
          <div role="columnheader" aria-label="Row number" className="box-border border-r" style={{ position: 'absolute', left: 0, top: 0, width: GUTTER_WIDTH, height: HEADER_ROW.height }} />
          {TRACKER_COLUMNS.map((column) => (
            <div
              key={column}
              role="columnheader"
              className="box-border flex items-center border-r px-2"
              style={{ position: 'absolute', left: COLUMN_X[column], top: 0, width: COLUMN_WIDTH[column], height: HEADER_ROW.height }}
            >
              {TRACKER_HEADERS[column]}
            </div>
          ))}
        </div>

        {rows.map((row, index) => {
          const rowFocused = focus !== null && focus.invoice === row.invoice
          return (
            <div
              key={row.invoice}
              role="row"
              aria-rowindex={index + 2}
              data-focused-row={rowFocused ? 'true' : undefined}
              {...filmAnchor(trackerRowAnchor(row.invoice))}
              className={cn('box-border border-b font-mono text-[12px] leading-[18px]', rowFocused ? 'bg-surface-2' : 'bg-surface')}
              style={at(within(GRID_RECT, rowRect(index)))}
            >
              <div role="rowheader" aria-label={`Row ${index + 1}`} className="box-border flex items-center justify-center border-r font-mono text-[11px] leading-4" style={{ ...rowNumberStyle(rowFocused), backgroundColor: rowFocused ? 'var(--border)' : 'var(--surface-2)', color: rowFocused ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                {index + 1}
              </div>
              {TRACKER_COLUMNS.map((column) => {
                const cell: Cell = { invoice: row.invoice, column }
                const selected = sameCell(focus, cell)
                const anchor = column === 'invoice' ? filmAnchor(trackerCellAnchor(row.invoice)) : undefined
                return (
                  <div
                    key={column}
                    id={cellDomId(cell)}
                    role="gridcell"
                    aria-selected={selected}
                    tabIndex={sameCell(tabbable, cell) ? 0 : -1}
                    data-invoice={row.invoice}
                    data-column={column}
                    {...anchor}
                    onClick={() => act(props, { type: 'FOCUS_TRACKER_CELL', invoice: row.invoice, column })}
                    onKeyDown={onCellKeyDown(cell)}
                    className={cn('box-border flex items-center border-r px-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', !film && 'transition-shadow motion-reduce:transition-none')}
                    style={{
                      position: 'absolute',
                      left: COLUMN_X[column],
                      top: 0,
                      width: COLUMN_WIDTH[column],
                      height: ROW_HEIGHT,
                      boxShadow: selected ? `inset 0 0 0 2px ${outline}` : undefined,
                    }}
                  >
                    <CellContent row={row} column={column} />
                  </div>
                )
              })}
            </div>
          )
        })}
        <EmptyRows filled={rows.length} />
      </div>
    </section>
  )
}
