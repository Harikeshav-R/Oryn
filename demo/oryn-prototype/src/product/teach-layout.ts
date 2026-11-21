import type { Rect } from '@/film'

export const TEACH_ANCHOR_RECTS = {
  'teach-question': { x: 280, y: 230, width: 720, height: 48 },
  'correction-source': { x: 280, y: 368, width: 480, height: 40 },
  'teach-yes': { x: 280, y: 294, width: 100, height: 40 },
  'link-rule': { x: 768, y: 368, width: 140, height: 40 },
  'save-correction': { x: 760, y: 420, width: 160, height: 40 },
  'teach-scope': { x: 280, y: 480, width: 700, height: 32 },
  'teach-notice': { x: 280, y: 520, width: 700, height: 52 },
  'review-repair': { x: 760, y: 580, width: 160, height: 40 },
  'teach-back': { x: 280, y: 580, width: 120, height: 40 },
} as const satisfies Readonly<Record<string, Rect>>
export type TeachAnchor = keyof typeof TEACH_ANCHOR_RECTS
export const TEACH_ANCHORS = Object.keys(TEACH_ANCHOR_RECTS) as TeachAnchor[]
