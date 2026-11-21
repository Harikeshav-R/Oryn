import type { CSSProperties } from 'react'
import type { Rect } from '@/film'
import { INBOX_ROWS } from '@/data/inbox'
import type { RecordId } from '@/state/types'
import { filmAnchor } from '../contract'

/**
 * APP-01 / APP-02 geometry. Every rectangle is ABSOLUTE 1280x720 canvas space and never depends on
 * interaction state, content length or neighbouring layout. The view is built from these same
 * constants, so a declared rect and its element cannot drift.
 */
const r = (x: number, y: number, width: number, height: number): Rect => ({ x, y, width, height })

/** Absolute rectangle of a child inside a positioned parent (parent origin = its border box). */
export const placeIn = (parent: Rect, child: Rect): CSSProperties => ({
  position: 'absolute',
  left: child.x - parent.x,
  top: child.y - parent.y,
  width: child.width,
  height: child.height,
})

/** Anchor attribute plus placement inside a positioned parent; a hidden anchor renders `display: none`. */
export function anchorIn(name: string, parent: Rect, child: Rect, visible: boolean): { readonly 'data-film-anchor': string; readonly style: CSSProperties } {
  const style = placeIn(parent, child)
  return { ...filmAnchor(name), style: visible ? style : { ...style, display: 'none' } }
}

export const TOP_BAR = r(0, 76, 1280, 56)
export const RAIL = r(0, 132, 184, 514)
export const LIST = r(184, 132, 480, 514)
export const PANE = r(184, 132, 536, 514)
export const VIEWER = r(720, 132, 560, 514)

export const SEARCH_FIELD = r(200, 84, 480, 40)
export const RAIL_ITEM_HEIGHT = 40
export const RAIL_TOP = 144

// -- inbox rows: 460x48 at x200, y160 + 48 * index ------------------------------------------
export const ROW_X = 200
export const ROW_Y0 = 160
export const ROW_WIDTH = 460
export const ROW_HEIGHT = 48
export const rowRect = (index: number): Rect => r(ROW_X, ROW_Y0 + ROW_HEIGHT * index, ROW_WIDTH, ROW_HEIGHT)

/** The four context records, in the fixed row order (the first four rows of the inbox). */
export const ROW_ANCHORS = {
  'INV-48219': 'inbox-row-inv-48219',
  'INV-48231': 'inbox-row-inv-48231',
  'INV-48210': 'inbox-row-inv-48210',
  'INV-48203': 'inbox-row-inv-48203',
} as const satisfies Readonly<Record<RecordId, string>>

// -- open message ---------------------------------------------------------------------------
export const BACK = r(200, 140, 88, 44)
export const SUBJECT = r(200, 196, 504, 24)
export const SENDER = r(200, 232, 504, 20)
export const RECIPIENT = r(200, 252, 504, 20)
export const RECEIVED = r(200, 272, 504, 20)
export const MESSAGE_RULE = r(200, 304, 504, 1)
export const BODY_LINE = r(200, 316, 504, 24)
export const ATTACHMENT = r(200, 348, 160, 72)

// -- APP-02 viewer --------------------------------------------------------------------------
export const TOOLBAR = r(720, 132, 560, 40)
export const COMPARE_TOGGLE = r(980, 132, 140, 40)
export const DOWNLOAD = r(1128, 132, 100, 40)
export const CLOSE_DOCUMENT = r(1236, 132, 44, 40)

/** The white page; in compare mode the current layout v2 takes this same rectangle. 32px inset. */
export const PAGE = r(780, 188, 440, 420)
export const DOC = {
  header: r(812, 220, 376, 24),
  headerRule: r(812, 256, 376, 1),
  invoiceId: r(812, 272, 376, 28),
  poNumber: r(812, 304, 376, 28),
  subtotal: r(812, 420, 376, 28),
  handlingFee: r(812, 452, 376, 28),
  totalRule: r(812, 528, 376, 1),
  total: r(812, 536, 376, 40),
} as const

/** The earlier layout v1 sheet, behind the page and offset left. Only a left strip stays visible. */
export const PAGE_V1 = r(724, 180, 340, 420)
export const V1 = {
  header: r(732, 220, 40, 12),
  subtotalLabel: r(732, 420, 48, 14),
  subtotalBar: r(732, 438, 40, 6),
  totalLabel: r(732, 536, 48, 14),
  totalBar: r(732, 554, 40, 6),
} as const
export const CAPTION_EARLIER = r(724, 612, 150, 20)
export const CAPTION_CURRENT = r(1070, 612, 150, 20)

export const GMAIL_ANCHORS = [
  'inbox-list',
  'inbox-row-inv-48219',
  'inbox-row-inv-48231',
  'inbox-row-inv-48210',
  'inbox-row-inv-48203',
  'message-pane',
  'attachment',
  'document-viewer',
  'document-page',
  'invoice-id',
  'po-number',
  'invoice-total',
  'handling-fee',
  'invoice-v1',
  'gmail-back',
  'gmail-compare-toggle',
  'gmail-close-document',
] as const
export type GMAILAnchor = (typeof GMAIL_ANCHORS)[number]

export const GMAIL_ANCHOR_RECTS: Readonly<Record<GMAILAnchor, Rect>> = Object.freeze({
  'inbox-list': LIST,
  'inbox-row-inv-48219': rowRect(INBOX_ROWS.findIndex((row) => row.record === 'INV-48219')),
  'inbox-row-inv-48231': rowRect(INBOX_ROWS.findIndex((row) => row.record === 'INV-48231')),
  'inbox-row-inv-48210': rowRect(INBOX_ROWS.findIndex((row) => row.record === 'INV-48210')),
  'inbox-row-inv-48203': rowRect(INBOX_ROWS.findIndex((row) => row.record === 'INV-48203')),
  'message-pane': PANE,
  attachment: ATTACHMENT,
  'document-viewer': VIEWER,
  'document-page': PAGE,
  'invoice-id': DOC.invoiceId,
  'po-number': DOC.poNumber,
  'invoice-total': DOC.total,
  'handling-fee': DOC.handlingFee,
  'invoice-v1': PAGE_V1,
  'gmail-back': BACK,
  'gmail-compare-toggle': COMPARE_TOGGLE,
  'gmail-close-document': CLOSE_DOCUMENT,
})
