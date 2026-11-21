import type { Rect } from '@/film'
import { offset } from './geometry'

/**
 * SC11 meeting review. Absolute 1280x720 canvas coordinates, inside the shell's content area
 * (the shell never resizes). Two flat cards: the transcript on the left, the commitment on the
 * right, 24 px padding. Rectangles are constants: no status, deadline text or viewpoint moves one.
 */

export const TRANSCRIPT_CARD: Rect = { x: 264, y: 112, width: 560, height: 520 }
export const COMMITMENT_CARD: Rect = { x: 848, y: 112, width: 384, height: 520 }

/** Transcript card contents, card-local (origin = the card's top-left corner). */
export const T = Object.freeze({
  title: { x: 24, y: 24, width: 512, height: 28 } satisfies Rect,
  source: { x: 24, y: 60, width: 512, height: 24 } satisfies Rect,
  lines: { x: 24, y: 96, width: 512, height: 380 } satisfies Rect,
})

/** Commitment card contents, card-local. */
export const C = Object.freeze({
  status: { x: 24, y: 24, width: 184, height: 24 } satisfies Rect,
  title: { x: 24, y: 56, width: 336, height: 44 } satisfies Rect,
  ownerLabel: { x: 24, y: 112, width: 336, height: 18 } satisfies Rect,
  ownerValue: { x: 24, y: 130, width: 336, height: 22 } satisfies Rect,
  proposedLabel: { x: 24, y: 160, width: 336, height: 18 } satisfies Rect,
  proposedValue: { x: 24, y: 178, width: 336, height: 22 } satisfies Rect,
  dueLabel: { x: 24, y: 208, width: 336, height: 18 } satisfies Rect,
  deadline: { x: 24, y: 228, width: 336, height: 40 } satisfies Rect,
  sourceLabel: { x: 24, y: 276, width: 336, height: 18 } satisfies Rect,
  source: { x: 24, y: 296, width: 152, height: 24 } satisfies Rect,
  noteLabel: { x: 24, y: 328, width: 336, height: 18 } satisfies Rect,
  caveat: { x: 24, y: 346, width: 336, height: 22 } satisfies Rect,
  sentence: { x: 24, y: 380, width: 336, height: 40 } satisfies Rect,
  confirm: { x: 200, y: 432, width: 160, height: 40 } satisfies Rect,
  reason: { x: 24, y: 478, width: 336, height: 32 } satisfies Rect,
  /** `Meeting capture requires per-meeting opt-in.` replaces the commitment. */
  optIn: { x: 24, y: 24, width: 336, height: 44 } satisfies Rect,
})

export const MEETING_REVIEW_ANCHORS = ['transcript', 'commitment-card', 'deadline', 'confirm-commitment', 'meeting-source', 'commitment-status', 'commitment-caveat'] as const
export type MeetingReviewAnchor = (typeof MEETING_REVIEW_ANCHORS)[number]

/**
 * Canvas rectangle of every anchor when it is shown. All seven are shown in the commitment view
 * (`confirm-commitment` stays visible after confirmation, as a disabled `Confirmed` control);
 * only the per-meeting opt-in view hides every anchor except `transcript` and `commitment-card`.
 */
export const MEETING_REVIEW_ANCHOR_RECTS: Readonly<Record<MeetingReviewAnchor, Rect>> = Object.freeze({
  transcript: TRANSCRIPT_CARD,
  'commitment-card': COMMITMENT_CARD,
  deadline: offset(COMMITMENT_CARD, C.deadline),
  'confirm-commitment': offset(COMMITMENT_CARD, C.confirm),
  'meeting-source': offset(COMMITMENT_CARD, C.source),
  'commitment-status': offset(COMMITMENT_CARD, C.status),
  'commitment-caveat': offset(COMMITMENT_CARD, C.caveat),
})
