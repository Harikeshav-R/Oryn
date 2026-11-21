import type { Rect } from '@/film'

export const POLICY_ANCHORS = ['policy-diff', 'policy-effective', 'policy-impact', 'impact-playbook', 'impact-agent', 'impact-tests', 'review-boundary-tests', 'boundary-tests'] as const
type Anchor = (typeof POLICY_ANCHORS)[number]
export const POLICY_ANCHOR_RECTS: Readonly<Record<Anchor, Rect>> = Object.freeze({
  'policy-diff': { x: 264, y: 160, width: 992, height: 134 },
  'policy-effective': { x: 288, y: 264, width: 300, height: 24 },
  'policy-impact': { x: 264, y: 310, width: 552, height: 218 },
  'impact-playbook': { x: 280, y: 350, width: 520, height: 50 },
  'impact-agent': { x: 280, y: 404, width: 520, height: 50 },
  'impact-tests': { x: 280, y: 458, width: 520, height: 50 },
  'review-boundary-tests': { x: 968, y: 570, width: 248, height: 40 },
  'boundary-tests': { x: 840, y: 310, width: 392, height: 218 },
})
