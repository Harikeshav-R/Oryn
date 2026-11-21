import type { Rect } from '@/film'

export const AUDIT_ANCHORS = ['audit-export', 'audit-table', 'audit-drawer', 'audit-confirm', 'audit-confirm-export', 'audit-confirm-cancel', 'audit-complete', 'audit-evaluation-row'] as const
type Anchor = (typeof AUDIT_ANCHORS)[number]
export const AUDIT_ANCHOR_RECTS: Readonly<Record<Anchor, Rect>> = Object.freeze({
  'audit-export': { x: 1040, y: 112, width: 216, height: 48 },
  'audit-table': { x: 264, y: 176, width: 992, height: 440 },
  'audit-drawer': { x: 800, y: 0, width: 480, height: 720 },
  'audit-confirm': { x: 384, y: 240, width: 512, height: 240 },
  'audit-confirm-export': { x: 744, y: 412, width: 120, height: 40 },
  'audit-confirm-cancel': { x: 608, y: 412, width: 120, height: 40 },
  'audit-complete': { x: 264, y: 672, width: 600, height: 24 },
  'audit-evaluation-row': { x: 264, y: 632, width: 992, height: 32 },
})
