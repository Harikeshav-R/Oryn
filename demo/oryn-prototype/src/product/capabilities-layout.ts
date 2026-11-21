import type { Rect } from '@/film'

export const CAPABILITY_ANCHORS = ['capability-matrix', 'adapter-tiles', 'cap-headers', 'cap-row-gmail', 'cap-row-netsuite', 'cap-row-google-sheets', 'cap-row-slack', 'cap-row-zoom', 'cap-row-hubspot', 'cap-row-chrome', 'cap-cell-gmail-observe', 'cap-extras', 'cap-detail'] as const
export type CapabilityAnchor = (typeof CAPABILITY_ANCHORS)[number]
export const CAPABILITY_ANCHOR_RECTS: Readonly<Record<CapabilityAnchor, Rect>> = Object.freeze({
  'capability-matrix': { x: 264, y: 112, width: 992, height: 560 },
  'adapter-tiles': { x: 264, y: 174, width: 992, height: 168 },
  'cap-headers': { x: 400, y: 164, width: 800, height: 34 },
  'cap-row-gmail': { x: 280, y: 198, width: 120, height: 54 },
  'cap-row-netsuite': { x: 280, y: 252, width: 120, height: 54 },
  'cap-row-google-sheets': { x: 280, y: 306, width: 120, height: 54 },
  'cap-row-slack': { x: 280, y: 360, width: 120, height: 54 },
  'cap-row-zoom': { x: 280, y: 414, width: 120, height: 54 },
  'cap-row-hubspot': { x: 280, y: 468, width: 120, height: 54 },
  'cap-row-chrome': { x: 280, y: 522, width: 120, height: 54 },
  'cap-cell-gmail-observe': { x: 400, y: 198, width: 160, height: 54 },
  'cap-extras': { x: 280, y: 596, width: 920, height: 56 },
  'cap-detail': { x: 568, y: 212, width: 320, height: 150 },
})
