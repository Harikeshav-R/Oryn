import { SUPPLIERS, type SupplierId } from '@/data/people'
import { recordsOfSupplier } from '@/data/work-records'
import type { Rect } from '@/film'
import type { HudPlacement } from '@/state'

/**
 * APP-03 / APP-04 / SC04 geometry. Every rectangle is ABSOLUTE 1280x720 canvas space (the space a
 * timeline anchor is declared in). Nothing here depends on interaction state, record or content
 * length: a view shows or hides an element, it never moves one.
 */

const r = (x: number, y: number, width: number, height: number): Rect => ({ x, y, width, height })

export const ERP_ANCHORS = [
  'erp-bill',
  'erp-po',
  'erp-invoice-total',
  'po-total',
  'erp-variance',
  'erp-status',
  'erp-match-action',
  'erp-stage',
  'vendor-list',
  'vendor-row-kestrel',
  'vendor-row-brightwater',
  'vendor-record',
  'vendor-name',
  'manual-completion',
  'manual-form',
  'complete-manually',
  'teach-correction',
  'tax-validation',
  'tax-id-field',
  'timeout-banner',
  'timeout-close',
  'timeout-review',
  'hud-reminder',
  'hud-peer-fix',
  'guide-me',
  'guide-next',
  'guide-back',
  'guide-done',
  'hud-dismiss',
] as const
export type ERPAnchor = (typeof ERP_ANCHORS)[number]

/** NetSuite shell: 48px application header and the section rail (canvas y 124 to 646). */
export const ERP_SHELL = Object.freeze({
  header: r(0, 76, 1280, 48),
  rail: r(0, 124, 200, 522),
  railVendorBill: r(8, 140, 184, 36),
  railVendors: r(8, 180, 184, 36),
})

/** APP-03 panels and the grid rows inside them (16px grid, 40px fields). Identical for every record. */
export const BILL_PANEL = r(240, 152, 464, 420)
export const PO_PANEL = r(728, 152, 456, 420)

export const BILL_FIELDS = Object.freeze({
  heading: r(256, 168, 432, 28),
  rule: r(256, 204, 432, 1),
  invoice: r(256, 220, 432, 40),
  total: r(256, 276, 432, 40),
  supplier: r(256, 332, 432, 40),
  po: r(256, 388, 432, 40),
  variance: r(256, 440, 432, 56),
  status: r(256, 504, 432, 52),
})

/**
 * The PO number and total are 136px wide (x 744 to 880) so the SC04 card at the upper placement
 * (x 900 to 1220, y 148 to 292) never covers a field. Rows below y 292 may be wide.
 */
export const PO_FIELDS = Object.freeze({
  heading: r(744, 168, 424, 28),
  rule: r(744, 204, 424, 1),
  po: r(744, 220, 136, 40),
  total: r(744, 276, 136, 40),
  supplier: r(744, 332, 424, 40),
  note: r(744, 388, 424, 40),
})

export const ERP_ACTIONS = Object.freeze({
  row: r(900, 576, 284, 48),
  match: r(900, 580, 160, 40),
  stage: r(1068, 580, 116, 40),
})

/**
 * APP-04. The vendor card, its identity heading, and the lists inside it stay in x <= 880 for
 * y 148 to 292 and for y 430 to 574, so the SC04 card never covers a vendor field or control.
 */
export const VENDOR_CARD = r(240, 152, 920, 420)
export const VENDOR_HEADING = r(272, 180, 600, 40)

const VENDOR_ROW_HEIGHT = 32
const VENDOR_ROWS_TOP = 240

/** Vendors that have a bill in these records come first, then the rest in fixture order. */
export const VENDOR_ORDER: readonly SupplierId[] = Object.freeze([
  ...SUPPLIERS.filter((supplier) => recordsOfSupplier(supplier.id).length > 0).map((supplier) => supplier.id),
  ...SUPPLIERS.filter((supplier) => recordsOfSupplier(supplier.id).length === 0).map((supplier) => supplier.id),
])

export const vendorRowRect = (index: number): Rect => r(256, VENDOR_ROWS_TOP + index * VENDOR_ROW_HEIGHT, 600, VENDOR_ROW_HEIGHT)
export const vendorRowRectOf = (id: SupplierId): Rect => vendorRowRect(VENDOR_ORDER.indexOf(id))

export const VENDOR_RECORD = Object.freeze({
  billsLabel: r(272, 244, 560, 20),
  /** Bills of one vendor: at most two records in these fixtures. */
  bills: [r(272, 272, 560, 36), r(272, 312, 560, 36)] as readonly Rect[],
  note: r(272, 372, 560, 20),
})

/** APP-05: distinct case, validation, and uncertain submission surfaces. */
export const APP05_RECTS = Object.freeze({
  manual: r(240, 152, 920, 420),
  form: r(260, 180, 850, 370),
  complete: r(850, 580, 180, 40),
  teach: r(1038, 580, 182, 40),
  validation: r(260, 170, 850, 64),
  taxField: r(260, 260, 560, 56),
  timeout: r(872, 90, 360, 88),
  timeoutClose: r(1190, 98, 32, 32),
  timeoutReview: r(1144, 142, 72, 28),
})

/** SC04 card. Fixed 320x144 at one of two placements; children sit at fixed offsets inside it. */
export const HUD_RECTS: Readonly<Record<HudPlacement, Rect>> = Object.freeze({
  upper: r(900, 148, 320, 144),
  lower: r(900, 430, 320, 144),
})

/** Offsets inside the card (card-local, 12px padding). */
export const HUD_LOCAL = Object.freeze({
  icon: r(12, 14, 16, 16),
  title: r(36, 12, 240, 44),
  evidence: r(36, 60, 240, 36),
  caption: r(36, 12, 240, 18),
  step: r(36, 34, 240, 20),
  reason: r(36, 62, 240, 16),
  dismiss: r(284, 12, 24, 24),
  guideMe: r(132, 93, 126, 32),
  guideNext: r(132, 93, 126, 32),
  guideDone: r(132, 93, 126, 32),
  guideBack: r(36, 93, 88, 32),
})

export type HudAnchor = 'hud-reminder' | 'hud-peer-fix' | 'guide-me' | 'guide-next' | 'guide-back' | 'guide-done' | 'hud-dismiss'

const shifted = (origin: Rect, local: Rect): Rect => r(origin.x + local.x, origin.y + local.y, local.width, local.height)

/** Absolute rectangles of the card and its controls at `placement`. */
export function hudAnchorRects(placement: HudPlacement): Readonly<Record<HudAnchor, Rect>> {
  const card = HUD_RECTS[placement]
  return {
    'hud-reminder': card,
    'hud-peer-fix': card,
    'guide-me': shifted(card, HUD_LOCAL.guideMe),
    'guide-next': shifted(card, HUD_LOCAL.guideNext),
    'guide-back': shifted(card, HUD_LOCAL.guideBack),
    'guide-done': shifted(card, HUD_LOCAL.guideDone),
    'hud-dismiss': shifted(card, HUD_LOCAL.dismiss),
  }
}

/** Anchor rectangles WHEN SHOWN. The HUD ones are the `upper` placement; use `hudAnchorRects` for `lower`. */
export const ERP_ANCHOR_RECTS: Readonly<Record<ERPAnchor, Rect>> = Object.freeze({
  'erp-bill': BILL_PANEL,
  'erp-po': PO_PANEL,
  'erp-invoice-total': BILL_FIELDS.total,
  'po-total': PO_FIELDS.total,
  'erp-variance': BILL_FIELDS.variance,
  'erp-status': BILL_FIELDS.status,
  'erp-match-action': ERP_ACTIONS.match,
  'erp-stage': ERP_ACTIONS.stage,
  'vendor-list': VENDOR_CARD,
  'vendor-row-kestrel': vendorRowRectOf('kestrel'),
  'vendor-row-brightwater': vendorRowRectOf('brightwater'),
  'vendor-record': VENDOR_CARD,
  'vendor-name': VENDOR_HEADING,
  'manual-completion': APP05_RECTS.manual,
  'manual-form': APP05_RECTS.form,
  'complete-manually': APP05_RECTS.complete,
  'teach-correction': APP05_RECTS.teach,
  'tax-validation': APP05_RECTS.validation,
  'tax-id-field': APP05_RECTS.taxField,
  'timeout-banner': APP05_RECTS.timeout,
  'timeout-close': APP05_RECTS.timeoutClose,
  'timeout-review': APP05_RECTS.timeoutReview,
  ...hudAnchorRects('upper'),
})
