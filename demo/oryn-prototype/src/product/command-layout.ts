import type { Rect } from '@/film'

export const COMMAND_ANCHORS = ['command-center', 'cc-verified', 'cc-exceptions', 'cc-incidents', 'cc-release', 'cc-tab-command', 'cc-tab-xray', 'cc-xray', 'cc-job-detail'] as const
type Anchor = (typeof COMMAND_ANCHORS)[number]
export const COMMAND_ANCHOR_RECTS: Readonly<Record<Anchor, Rect>> = Object.freeze({
  'command-center': { x: 264, y: 112, width: 992, height: 560 },
  'cc-tab-command': { x: 288, y: 130, width: 170, height: 36 },
  'cc-tab-xray': { x: 466, y: 130, width: 160, height: 36 },
  'cc-verified': { x: 280, y: 184, width: 472, height: 208 },
  'cc-exceptions': { x: 768, y: 184, width: 472, height: 208 },
  'cc-incidents': { x: 280, y: 408, width: 472, height: 208 },
  'cc-release': { x: 768, y: 408, width: 472, height: 208 },
  'cc-xray': { x: 280, y: 184, width: 960, height: 432 },
  'cc-job-detail': { x: 296, y: 620, width: 928, height: 36 },
})
