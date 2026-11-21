import type { Rect } from '@/film'

export const REPAIR_ANCHOR_RECTS = {
  'repair-diff': { x: 264, y: 112, width: 480, height: 520 },
  'regression-results': { x: 768, y: 112, width: 464, height: 520 },
  'repair-scope-panel': { x: 280, y: 210, width: 448, height: 300 },
  'validate-scope': { x: 296, y: 390, width: 160, height: 40 },
  'open-repair-diff': { x: 472, y: 390, width: 180, height: 40 },
  'regression-tiles': { x: 784, y: 190, width: 432, height: 150 },
  'run-regression': { x: 1000, y: 550, width: 160, height: 40 },
  'request-release': { x: 1020, y: 604, width: 160, height: 40 },
  'regression-case-029': { x: 784, y: 190, width: 432, height: 27 },
  'regression-case-030': { x: 784, y: 217, width: 432, height: 27 },
  'regression-case-031': { x: 784, y: 244, width: 432, height: 27 },
  'regression-case-032': { x: 784, y: 271, width: 432, height: 27 },
  'regression-case-033': { x: 784, y: 298, width: 432, height: 27 },
  'regression-case-034': { x: 784, y: 325, width: 432, height: 27 },
} as const satisfies Readonly<Record<string, Rect>>
export type RepairAnchor = keyof typeof REPAIR_ANCHOR_RECTS
export const REPAIR_ANCHORS = Object.keys(REPAIR_ANCHOR_RECTS) as RepairAnchor[]
