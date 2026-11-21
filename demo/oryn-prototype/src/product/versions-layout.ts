import type { Rect } from '@/film'

export const VERSIONS_ANCHORS = ['version-row', 'version-playbook', 'version-v01', 'version-v02', 'version-v10', 'version-v11', 'version-compare-evaluation', 'version-compare-repair', 'version-comparison', 'restore-previous', 'version-restore-hint', 'version-restore-dialog', 'version-restore-cancel', 'version-restore-confirm'] as const
type Anchor = (typeof VERSIONS_ANCHORS)[number]
export const VERSIONS_ANCHOR_RECTS: Readonly<Record<Anchor, Rect>> = Object.freeze({
  'version-row': { x: 264, y: 160, width: 992, height: 178 },
  'version-playbook': { x: 280, y: 170, width: 176, height: 168 },
  'version-v01': { x: 472, y: 170, width: 176, height: 168 },
  'version-v02': { x: 664, y: 170, width: 176, height: 168 },
  'version-v10': { x: 856, y: 170, width: 176, height: 168 },
  'version-v11': { x: 1048, y: 170, width: 192, height: 168 },
  'version-compare-evaluation': { x: 660, y: 344, width: 180, height: 36 },
  'version-compare-repair': { x: 852, y: 344, width: 180, height: 36 },
  'version-comparison': { x: 280, y: 392, width: 724, height: 170 },
  'restore-previous': { x: 1016, y: 480, width: 224, height: 48 },
  'version-restore-hint': { x: 904, y: 396, width: 336, height: 72 },
  'version-restore-dialog': { x: 384, y: 240, width: 512, height: 240 },
  'version-restore-cancel': { x: 668, y: 408, width: 96, height: 40 },
  'version-restore-confirm': { x: 776, y: 408, width: 96, height: 40 },
})
