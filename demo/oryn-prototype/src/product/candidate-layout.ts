import type { Rect } from '@/film'
import { offset } from './geometry'

/**
 * SC14 candidate review and the evidence drawer. Absolute 1280x720 canvas coordinates inside the
 * shell's content area: the candidate heading and status row, three 292x120 demonstration cards
 * down the left edge, the proposed steps beside them, the evidence rail `[880,112,352,480]` and
 * the two review actions beneath it. The drawer overlay is `[800,0,480,720]` with a 64 px sticky
 * footer. Status, approval, selection and viewpoint never move or resize an anchor.
 */

export const CANDIDATE_TITLE: Rect = { x: 264, y: 112, width: 592, height: 44 }
export const SUGGESTED_BADGE: Rect = { x: 264, y: 164, width: 92, height: 24 }
export const CONFIDENCE_BADGE: Rect = { x: 364, y: 164, width: 160, height: 24 }
export const DEMONSTRATION_COUNT: Rect = { x: 532, y: 164, width: 160, height: 24 }
export const UNCERTAINTY: Rect = { x: 264, y: 196, width: 592, height: 24 }

export const CARDS_LABEL: Rect = { x: 264, y: 236, width: 292, height: 22 }
export const CARDS_COLUMN: Rect = { x: 264, y: 262, width: 292, height: 392 }
export const demoCard = (index: number): Rect => ({ x: 264, y: 262 + index * 136, width: 292, height: 120 })

/** Card contents, card-local (origin = the card's top-left corner). */
export const CARD = Object.freeze({
  id: { x: 12, y: 10, width: 268, height: 18 } satisfies Rect,
  time: { x: 12, y: 28, width: 268, height: 18 } satisfies Rect,
  invoice: { x: 12, y: 46, width: 268, height: 18 } satisfies Rect,
  supplier: { x: 12, y: 66, width: 268, height: 20 } satisfies Rect,
  status: { x: 12, y: 94, width: 268, height: 18 } satisfies Rect,
})

export const STEPS_PANEL: Rect = { x: 572, y: 236, width: 284, height: 440 }
/** Proposed steps, panel-local: a label row, then six 64 px rows. */
export const STEPS = Object.freeze({
  heading: { x: 16, y: 12, width: 252, height: 24 } satisfies Rect,
  firstRow: { x: 16, y: 48, width: 252, height: 64 } satisfies Rect,
  rowStep: 64,
})

export const EVIDENCE_RAIL: Rect = { x: 880, y: 112, width: 352, height: 480 }
/** Evidence rail contents, rail-local. */
export const RAIL = Object.freeze({
  heading: { x: 16, y: 16, width: 320, height: 28 } satisfies Rect,
  note: { x: 16, y: 52, width: 320, height: 60 } satisfies Rect,
  sourcesLabel: { x: 16, y: 124, width: 320, height: 18 } satisfies Rect,
  source: (index: number): Rect => ({ x: 16, y: 148 + index * 36, width: 320, height: 32 }),
  divider: { x: 16, y: 268, width: 320, height: 1 } satisfies Rect,
  ruleLabel: { x: 16, y: 284, width: 320, height: 18 } satisfies Rect,
  rule: { x: 16, y: 308, width: 320, height: 76 } satisfies Rect,
  footnote: { x: 16, y: 396, width: 320, height: 72 } satisfies Rect,
})

export const APPROVE_CONTRIBUTION: Rect = { x: 880, y: 600, width: 172, height: 40 }
export const REQUEST_REVIEW: Rect = { x: 1060, y: 600, width: 172, height: 40 }
export const OWNER_REVIEW_STATUS: Rect = { x: 880, y: 648, width: 352, height: 50 }

/** The drawer overlay. The scrim covers the rest of the canvas. */
export const DRAWER: Rect = { x: 800, y: 0, width: 480, height: 720 }
export const DRAWER_PARTS = Object.freeze({
  title: { x: 24, y: 24, width: 432, height: 28 } satisfies Rect,
  subtitle: { x: 24, y: 56, width: 432, height: 20 } satisfies Rect,
  body: { x: 24, y: 96, width: 432, height: 536 } satisfies Rect,
  footer: { x: 0, y: 656, width: 480, height: 64 } satisfies Rect,
  /** Footer-local. */
  close: { x: 360, y: 12, width: 96, height: 40 } satisfies Rect,
})

export const DRAWER_ANCHORS = ['rule-drawer', 'drawer-close'] as const

export const CANDIDATE_ANCHORS = [
  'candidate-evidence',
  'request-review',
  'approve-contribution',
  'candidate-title',
  'candidate-confidence',
  'candidate-uncertainty',
  'demonstration-cards',
  'demo-card-d1',
  'demo-card-d2',
  'demo-card-d3',
  'proposed-steps',
  'evidence-link-d1',
  'evidence-link-d2',
  'evidence-link-d3',
  'rule-link',
  'owner-review-status',
  ...DRAWER_ANCHORS,
] as const
export type CandidateAnchor = (typeof CANDIDATE_ANCHORS)[number]

/** Canvas rectangle of every anchor when it is shown. The two drawer anchors are shown only while the drawer is open. */
export const CANDIDATE_ANCHOR_RECTS: Readonly<Record<CandidateAnchor, Rect>> = Object.freeze({
  'candidate-evidence': EVIDENCE_RAIL,
  'request-review': REQUEST_REVIEW,
  'approve-contribution': APPROVE_CONTRIBUTION,
  'candidate-title': CANDIDATE_TITLE,
  'candidate-confidence': CONFIDENCE_BADGE,
  'candidate-uncertainty': UNCERTAINTY,
  'demonstration-cards': CARDS_COLUMN,
  'demo-card-d1': demoCard(0),
  'demo-card-d2': demoCard(1),
  'demo-card-d3': demoCard(2),
  'proposed-steps': STEPS_PANEL,
  'evidence-link-d1': offset(EVIDENCE_RAIL, RAIL.source(0)),
  'evidence-link-d2': offset(EVIDENCE_RAIL, RAIL.source(1)),
  'evidence-link-d3': offset(EVIDENCE_RAIL, RAIL.source(2)),
  'rule-link': offset(EVIDENCE_RAIL, RAIL.rule),
  'owner-review-status': OWNER_REVIEW_STATUS,
  'rule-drawer': DRAWER,
  'drawer-close': offset(DRAWER, offset(DRAWER_PARTS.footer, DRAWER_PARTS.close)),
})
