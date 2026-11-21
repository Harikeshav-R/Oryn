import type { Rect } from '@/film'
import { TRACKER_COLUMNS, TRACKER_INVOICES } from '@/state/types'
import type { TrackerColumn, TrackerInvoice } from '@/state/types'

/**
 * APP-06 AP Exceptions Tracker geometry. Every rectangle is an absolute 1280x720 canvas
 * coordinate (the space a timeline anchor is declared in) and never depends on interaction
 * state or content length. The view is built from these same constants.
 */

export const MENU_STRIP: Rect = { x: 0, y: 76, width: 1280, height: 40 }
export const FORMULA_BAR: Rect = { x: 0, y: 116, width: 1280, height: 32 }
export const HEADER_ROW: Rect = { x: 0, y: 148, width: 1040, height: 36 }
export const GUTTER_WIDTH = 40
export const ROW_HEIGHT = 28
export const GRID_TOP = 148
export const FIRST_ROW_TOP = 184

/** Column widths after the 40px frozen row-number gutter. */
export const COLUMN_WIDTH: Readonly<Record<TrackerColumn, number>> = Object.freeze({ invoice: 170, supplier: 220, issue: 250, owner: 160, state: 200 })
export const GRID_WIDTH = GUTTER_WIDTH + TRACKER_COLUMNS.reduce((sum, column) => sum + COLUMN_WIDTH[column], 0)
/** Canvas x of each column's left edge. */
export const COLUMN_X: Readonly<Record<TrackerColumn, number>> = Object.freeze({
  invoice: GUTTER_WIDTH,
  supplier: GUTTER_WIDTH + COLUMN_WIDTH.invoice,
  issue: GUTTER_WIDTH + COLUMN_WIDTH.invoice + COLUMN_WIDTH.supplier,
  owner: GUTTER_WIDTH + COLUMN_WIDTH.invoice + COLUMN_WIDTH.supplier + COLUMN_WIDTH.issue,
  state: GUTTER_WIDTH + COLUMN_WIDTH.invoice + COLUMN_WIDTH.supplier + COLUMN_WIDTH.issue + COLUMN_WIDTH.owner,
})

/** Empty grid rows below the six, up to the Dock line (canvas y 646). */
export const EMPTY_ROW_COUNT = 10
export const EMPTY_ROWS_TOP = FIRST_ROW_TOP + TRACKER_INVOICES.length * ROW_HEIGHT

export const rowTop = (index: number): number => FIRST_ROW_TOP + index * ROW_HEIGHT

/** Header plus the six data rows. */
export const GRID_RECT: Rect = { x: 0, y: GRID_TOP, width: GRID_WIDTH, height: HEADER_ROW.height + TRACKER_INVOICES.length * ROW_HEIGHT }

/** Title text box inside the menu strip: mark at x16, title text from x40. */
export const TITLE_RECT: Rect = { x: 40, y: 86, width: 200, height: 20 }
export const MARK_RECT: Rect = { x: 16, y: 88, width: 16, height: 16 }

export const rowRect = (index: number): Rect => ({ x: 0, y: rowTop(index), width: GRID_WIDTH, height: ROW_HEIGHT })
export const cellRect = (index: number, column: TrackerColumn): Rect => ({ x: COLUMN_X[column], y: rowTop(index), width: COLUMN_WIDTH[column], height: ROW_HEIGHT })

const slug = (invoice: TrackerInvoice): string => invoice.toLowerCase()

export const trackerRowAnchor = (invoice: TrackerInvoice) => `tracker-row-${slug(invoice)}` as const
export const trackerCellAnchor = (invoice: TrackerInvoice) => `tracker-cell-${slug(invoice)}` as const

export const TRACKER_ANCHORS = [
  'tracker-title',
  'tracker-formula',
  'tracker-grid',
  'tracker-row-inv-48203',
  'tracker-row-inv-48210',
  'tracker-row-inv-48215',
  'tracker-row-inv-48218',
  'tracker-row-inv-48219',
  'tracker-row-inv-48220',
  'tracker-cell-inv-48203',
  'tracker-cell-inv-48210',
  'tracker-cell-inv-48215',
  'tracker-cell-inv-48218',
  'tracker-cell-inv-48219',
  'tracker-cell-inv-48220',
] as const
export type TRACKERAnchor = (typeof TRACKER_ANCHORS)[number]

/** Canvas rectangle of every anchor. All of them are shown on every render. */
export const TRACKER_ANCHOR_RECTS: Readonly<Record<TRACKERAnchor, Rect>> = Object.freeze({
  'tracker-title': TITLE_RECT,
  'tracker-formula': FORMULA_BAR,
  'tracker-grid': GRID_RECT,
  'tracker-row-inv-48203': rowRect(0),
  'tracker-row-inv-48210': rowRect(1),
  'tracker-row-inv-48215': rowRect(2),
  'tracker-row-inv-48218': rowRect(3),
  'tracker-row-inv-48219': rowRect(4),
  'tracker-row-inv-48220': rowRect(5),
  'tracker-cell-inv-48203': cellRect(0, 'invoice'),
  'tracker-cell-inv-48210': cellRect(1, 'invoice'),
  'tracker-cell-inv-48215': cellRect(2, 'invoice'),
  'tracker-cell-inv-48218': cellRect(3, 'invoice'),
  'tracker-cell-inv-48219': cellRect(4, 'invoice'),
  'tracker-cell-inv-48220': cellRect(5, 'invoice'),
})

export interface TrackerCell {
  readonly invoice: TrackerInvoice
  readonly column: TrackerColumn
}

/** The cell an arrow key or Tab moves to; null at an edge, where the key does nothing (Tab then leaves the grid). */
export function cellAfterKey(from: TrackerCell, key: string, shift = false): TrackerCell | null {
  const row = TRACKER_INVOICES.indexOf(from.invoice)
  const col = TRACKER_COLUMNS.indexOf(from.column)
  const cellAt = (r: number, c: number): TrackerCell | null => {
    const invoice = TRACKER_INVOICES[r]
    const column = TRACKER_COLUMNS[c]
    return invoice === undefined || column === undefined ? null : { invoice, column }
  }
  switch (key) {
    case 'ArrowUp':
      return cellAt(row - 1, col)
    case 'ArrowDown':
      return cellAt(row + 1, col)
    case 'ArrowLeft':
      return cellAt(row, col - 1)
    case 'ArrowRight':
      return cellAt(row, col + 1)
    case 'Tab':
      if (shift) return col > 0 ? cellAt(row, col - 1) : cellAt(row - 1, TRACKER_COLUMNS.length - 1)
      return col < TRACKER_COLUMNS.length - 1 ? cellAt(row, col + 1) : cellAt(row + 1, 0)
    default:
      return null
  }
}
