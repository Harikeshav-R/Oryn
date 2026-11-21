import type { Rect } from '@/film'

/** SC26 authored canvas geometry. */
export const INCIDENT_ANCHORS = ['incident', 'affected-cases', 'fee-comparison', 'incident-hypothesis', 'incident-evidence', 'incident-contain', 'incident-teach', 'incident-manual', 'incident-case-1', 'incident-case-2', 'incident-case-3'] as const
export type IncidentAnchor = (typeof INCIDENT_ANCHORS)[number]

export const INCIDENT_ANCHOR_RECTS: Readonly<Record<IncidentAnchor, Rect>> = Object.freeze({
  incident: { x: 588, y: 112, width: 644, height: 560 },
  'affected-cases': { x: 264, y: 112, width: 300, height: 560 },
  'fee-comparison': { x: 612, y: 262, width: 596, height: 135 },
  'incident-hypothesis': { x: 612, y: 415, width: 596, height: 54 },
  'incident-evidence': { x: 612, y: 480, width: 596, height: 105 },
  'incident-contain': { x: 288, y: 605, width: 252, height: 40 },
  'incident-teach': { x: 984, y: 595, width: 224, height: 40 },
  'incident-manual': { x: 612, y: 595, width: 250, height: 40 },
  'incident-case-1': { x: 280, y: 260, width: 268, height: 70 },
  'incident-case-2': { x: 280, y: 332, width: 268, height: 70 },
  'incident-case-3': { x: 280, y: 404, width: 268, height: 70 },
})
