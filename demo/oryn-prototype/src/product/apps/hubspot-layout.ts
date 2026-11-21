import type { Rect } from '@/film'

/** APP-09 and SC32, in absolute canvas coordinates. */
export const HUBSPOT_ANCHORS = ['discount-draft', 'discount-field', 'blocked-action', 'blocked-submit', 'request-approval', 'approval-requested', 'deny-request'] as const
export type HubSpotAnchor = (typeof HUBSPOT_ANCHORS)[number]
export const HUBSPOT_ANCHOR_RECTS: Readonly<Record<HubSpotAnchor, Rect>> = Object.freeze({
  'discount-draft': { x: 260, y: 238, width: 420, height: 100 },
  'discount-field': { x: 410, y: 280, width: 240, height: 40 },
  'blocked-action': { x: 840, y: 340, width: 360, height: 252 },
  'blocked-submit': { x: 980, y: 492, width: 96, height: 40 },
  'request-approval': { x: 860, y: 536, width: 160, height: 40 },
  'approval-requested': { x: 860, y: 438, width: 320, height: 40 },
  'deny-request': { x: 1030, y: 536, width: 140, height: 40 },
})
