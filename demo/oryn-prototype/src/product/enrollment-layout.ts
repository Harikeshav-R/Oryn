import type { Rect } from '@/film'
import type { WizardStep } from '@/state'
import type { ENROLLMENT_ANCHORS } from './anchors'
import { ENROLLMENT } from './contract'
import { offset } from './geometry'

export type EnrollmentAnchor = (typeof ENROLLMENT_ANCHORS)[number]

export const CARD = ENROLLMENT.card

/** Authored rectangles in card-local coordinates (origin = the card's border box). */
export const C = {
  title: { x: 24, y: 24, width: 592, height: 34 },
  subtitle: { x: 24, y: 62, width: 592, height: 20 },
  headerRule: { x: 1, y: 95, width: 638, height: 1 },
  footerRule: { x: 1, y: 424, width: 638, height: 1 },
  notice: { x: 24, y: 120, width: 592, height: 216 },
  reviewNotice: { x: 40, y: 166, width: 160, height: 32 },
  understand: { x: 24, y: 348, width: 592, height: 32 },
  captureConsent: { x: 24, y: 120, width: 592, height: 148 },
  workApplications: { x: 40, y: 160, width: 560, height: 32 },
  excludedWindows: { x: 40, y: 192, width: 560, height: 32 },
  visualObservation: { x: 40, y: 224, width: 560, height: 32 },
  sharingConsent: { x: 24, y: 284, width: 592, height: 128 },
  contribution: { x: 40, y: 324, width: 560, height: 32 },
  back: { x: 24, y: 452, width: 92, height: 40 },
  reason: { x: 124, y: 442, width: 204, height: 60 },
  decline: { x: 336, y: 452, width: 96, height: 40 },
  continue: { x: 440, y: 452, width: 176, height: 40 },
} as const satisfies Record<string, Rect>

/** Canvas rectangles of every anchor (what a timeline names). Only the anchors of the current step are visible. */
export const ENROLLMENT_ANCHOR_RECTS: Readonly<Record<EnrollmentAnchor, Rect>> = Object.freeze({
  notice: offset(CARD, C.notice),
  'review-notice': offset(CARD, C.reviewNotice),
  understand: offset(CARD, C.understand),
  'capture-consent': offset(CARD, C.captureConsent),
  'work-applications': offset(CARD, C.workApplications),
  'visual-observation': offset(CARD, C.visualObservation),
  'sharing-consent': offset(CARD, C.sharingConsent),
  contribution: offset(CARD, C.contribution),
  continue: offset(CARD, C.continue),
  back: offset(CARD, C.back),
  decline: offset(CARD, C.decline),
})

/** Anchors that exist only on one step; the footer's `continue`, `back` and `decline` are on every step. */
export const STEP_ANCHORS: Readonly<Record<WizardStep, readonly EnrollmentAnchor[]>> = {
  notice: ['notice', 'review-notice', 'understand'],
  capture: ['capture-consent', 'work-applications', 'visual-observation', 'sharing-consent', 'contribution'],
  scope: [],
}

export const FOOTER_ANCHORS: readonly EnrollmentAnchor[] = ['continue', 'back', 'decline']
