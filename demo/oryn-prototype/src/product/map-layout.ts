import type { Rect } from '@/film'

export const MAP_ANCHORS = ['map-graph', 'map-table', 'map-toggle-graph', 'map-toggle-table', 'map-workflow', 'map-rule-009', 'map-rule-017', 'map-agent', 'map-incident', 'map-edge-workflow-rule-009', 'map-edge-workflow-rule-017', 'map-edge-rule-009-agent', 'map-edge-rule-017-agent', 'map-edge-agent-incident', 'map-detail'] as const
export type MapAnchor = (typeof MAP_ANCHORS)[number]
const canvas = { x: 264, y: 112, width: 992, height: 560 }
export const MAP_ANCHOR_RECTS: Readonly<Record<MapAnchor, Rect>> = Object.freeze({
  'map-graph': canvas, 'map-table': canvas,
  'map-toggle-graph': { x: 1080, y: 120, width: 72, height: 32 },
  'map-toggle-table': { x: 1152, y: 120, width: 72, height: 32 },
  'map-workflow': { x: 340, y: 260, width: 188, height: 64 },
  'map-rule-009': { x: 620, y: 170, width: 188, height: 64 },
  'map-rule-017': { x: 620, y: 350, width: 188, height: 64 },
  'map-agent': { x: 880, y: 260, width: 188, height: 64 },
  'map-incident': { x: 1080, y: 400, width: 160, height: 64 },
  'map-edge-workflow-rule-009': canvas, 'map-edge-workflow-rule-017': canvas,
  'map-edge-rule-009-agent': canvas, 'map-edge-rule-017-agent': canvas,
  'map-edge-agent-incident': canvas,
  'map-detail': { x: 920, y: 480, width: 304, height: 172 },
})
