import type { Rect } from '@/film'

/** Fixed SC29 canvas geometry. */
export const RELEASE_ANCHORS = ['limited-release', 'verified-three', 'expand-release', 'approve-limited-release', 'cohort-outcome-1', 'cohort-outcome-2', 'cohort-outcome-3', 'close-incident', 'release-scope', 'affected-case-history', 'release-owner', 'cohort-evidence'] as const
export type ReleaseAnchor = (typeof RELEASE_ANCHORS)[number]

export const RELEASE_ANCHOR_RECTS: Readonly<Record<ReleaseAnchor, Rect>> = Object.freeze({
  'limited-release': { x: 264, y: 112, width: 480, height: 520 },
  'verified-three': { x: 768, y: 112, width: 464, height: 520 },
  'expand-release': { x: 1000, y: 490, width: 208, height: 40 },
  'approve-limited-release': { x: 492, y: 558, width: 228, height: 40 },
  'cohort-outcome-1': { x: 792, y: 248, width: 416, height: 56 },
  'cohort-outcome-2': { x: 792, y: 312, width: 416, height: 56 },
  'cohort-outcome-3': { x: 792, y: 376, width: 416, height: 56 },
  'close-incident': { x: 1000, y: 580, width: 208, height: 40 },
  'release-scope': { x: 288, y: 206, width: 432, height: 112 },
  'affected-case-history': { x: 288, y: 390, width: 432, height: 136 },
  'release-owner': { x: 288, y: 550, width: 196, height: 56 },
  'cohort-evidence': { x: 792, y: 436, width: 416, height: 48 },
})
