import type { Rect } from '@/film'
import type { Action } from '@/state'
import { ERP_ANCHOR_RECTS } from './apps/erp-layout'
import { HUBSPOT_ANCHOR_RECTS } from './apps/hubspot-layout'
import { AUDIT_ANCHOR_RECTS } from './audit-layout'
import { CAPABILITY_ANCHOR_RECTS } from './capabilities-layout'
import { OPEN, centre, cut, entryEvery, go, named, place } from './clip-spec-kit'
import type { ClipSpec } from './clip-specs'
import { COMMAND_ANCHOR_RECTS } from './command-layout'
import { MAP_ANCHOR_RECTS } from './map-layout'
import { NOTIFICATIONS_ANCHOR_RECTS, NOTIFICATION_TOAST_ANCHOR_RECTS } from './notifications-layout'
import { POLICY_ANCHOR_RECTS } from './policy-layout'
import { VERSIONS_ANCHOR_RECTS } from './versions-layout'

/**
 * BOB-11 clip specs: the breadth act. `hk-h4h-breadth` (H-117 to H-132, 02:22 to 02:38, 480 frames, film frame 4260) and
 * `lk-l11-breadth` (L-147 to L-166, 02:24 to 02:44, 600 frames, film frame 4320). Declared once;
 * `scripts/author-product-clips.ts` turns each spec into its timeline and adds the `anchor:<name>` overlays. Read the
 * conventions in `clip-specs.ts` and `clip-specs-heal.ts` first.
 *
 * - Both clips start at ST17 (`startAt`, Marcus): the canonical prerequisites replay to the first entry of the montage.
 * - The montage is a straight line (`NEXT`: ST17 to ST24), but the cuts reorder it: the hackathon order is ST17, ST19, the
 *   peer card (SC04 opened inside ST19), ST20 to ST24, the matrix (SC36, no state of its own) and back to SC33. Skipped
 *   states are passed by several `NEXT` at the same frame (the launch cut shows SC30 in the previous clip, `lk-l10-heal`).
 * - Hard cuts have no pointer; every pointer move is 11 to 27 frames. A click that the storyboard films as a blocked action
 *   (the HubSpot `Submit`) is inert and lands no action. Nothing is submitted, approved or exported by a film.
 * - The F3 plates (H-128 memory collage, L-147 knowledge collage, L-165 and L-166 ring) film no product interaction: the
 *   product holds its last view with no pointer and the stage layer draws over it.
 * - Hover outlines are film overlays (`outlines`), never reducer state. The one hover-driven product state, the SC30
 *   future-only explanation, is the explicit `SET_VERSION_VIEW { hint }` action.
 */

const E = ERP_ANCHOR_RECTS
const M = MAP_ANCHOR_RECTS
const P = POLICY_ANCHOR_RECTS
const H = HUBSPOT_ANCHOR_RECTS
const V = VERSIONS_ANCHOR_RECTS
const C = COMMAND_ANCHOR_RECTS
const A = AUDIT_ANCHOR_RECTS
const N = NOTIFICATIONS_ANCHOR_RECTS
const T = NOTIFICATION_TOAST_ANCHOR_RECTS
const K = CAPABILITY_ANCHOR_RECTS

/** The shell bell (Shell.tsx BELL): [1184,12,32,32]. */
const BELL: Rect = { x: 1184, y: 12, width: 32, height: 32 }

const ANCHORS: Readonly<Record<string, Rect>> = {
  ...M,
  ...P,
  ...H,
  ...V,
  ...C,
  ...A,
  ...N,
  ...T,
  ...K,
  ...named(E, ['hud-peer-fix', 'guide-me', 'tax-validation', 'tax-id-field']),
  bell: BELL,
}

const as = (personId: Extract<Action, { type: 'SELECT_ACTOR' }>['personId']): Action => ({ type: 'SELECT_ACTOR', personId })
const NEXT: Action = { type: 'NEXT' }
const AGENT: Action = { type: 'SELECT_MAP_NODE', node: 'agent' }
const COMPARE: Action = { type: 'SET_VERSION_VIEW', compare: 'evaluation' }
const XRAY: Action = { type: 'SET_COMMAND_VIEW', tab: 'xray' }
const DRAWER: Action = { type: 'SET_AUDIT_EXPORT', step: 'drawer' }
const TESTS: Action = { type: 'SET_POLICY_VIEW', tests: true }
const TOAST: Action = { type: 'SURFACE_TOAST', id: 'N-02' }
const OPEN_N01: Action = { type: 'SET_NOTIFICATION_VIEW', open: 'N-01' }
const GUIDE: Action = { type: 'OPEN_GUIDE' }
const GRAPH_POINT = centre(M['map-agent'])
/** A point on the AP-RULE-009 to agent edge (rule right edge to agent left edge). */
const EDGE_POINT: [number, number] = [844, 247]

export const HK_H4H: ClipSpec = {
  cut: 'hackathon',
  clipId: 'hk-h4h-breadth',
  scene: 'H4h',
  filmStartFrame: 142 * 30,
  durationFrames: 480,
  seed: 20261216,
  startAt: 'ST17',
  start: [700, 330],
  anchors: ANCHORS,
  moves: [
    // H-117 Operations Map: the pointer selects the Reconciler node (450 ms, f14).
    go(1, 13, GRAPH_POINT, 'map-agent', [AGENT]),
    // H-119 Rule connections: the pointer travels along the highlighted rule edge (500 ms).
    go(60, 15, EDGE_POINT, 'map-edge-rule-009-agent'),
    // H-120 Policy change: the pointer travels (850,300) to the change detail.
    place(90, [850, 300]),
    go(91, 12, centre(P['policy-diff']), 'policy-diff'),
    // H-121 Revalidation: the pointer hovers the impacted agent.
    go(121, 15, centre(P['impact-agent']), 'impact-agent'),
    // H-122 Peer guidance: Jamal presses Guide Me (500 ms, f165).
    place(150, [1000, 420]),
    go(151, 14, centre(E['guide-me']), undefined, [GUIDE]),
    // H-123 Unsafe action: the pointer hovers the blocked action; nothing is submitted.
    place(180, [700, 420]),
    go(181, 14, centre(H['blocked-action']), 'blocked-action'),
    // H-124 Version history: select v0.1 against v0.2 (450 ms, f224).
    place(210, [600, 300]),
    go(211, 13, centre(V['version-compare-evaluation']), 'version-compare-evaluation', [COMPARE]),
    // H-125 Command Center: the pointer moves to the exception breakdown.
    place(240, [700, 300]),
    go(241, 15, centre(C['cc-exceptions']), 'cc-exceptions'),
    // H-126 Audit: the pointer opens the export drawer (it only previews the scope; no download).
    place(270, [900, 300]),
    go(271, 14, centre(A['audit-export']), 'audit-export', [DRAWER]),
    // H-127 Notifications: the pointer opens the notification center from the bell (it is already the open route).
    place(300, [1000, 200]),
    go(301, 12, centre(BELL), 'bell', [OPEN('SC35')]),
    // H-128 memory collage (F3 plate): no pointer.
    place(330, [640, 360]),
    // H-130 Honest capabilities: the pointer hovers the NetSuite row.
    place(390, [700, 360]),
    go(391, 15, centre(K['cap-row-netsuite']), 'cap-row-netsuite'),
    place(420, [640, 360]),
  ],
  actions: [
    // H-120: the policy change at ST19 (ST18 is passed in the same frame); H-121 shows the proposed boundary tests beside the impact.
    cut(90, NEXT, NEXT),
    cut(120, TESTS),
    // H-122: Jamal's NetSuite form with the one peer-fix card.
    cut(150, as('jamal'), OPEN('SC04')),
    // H-123: the blocked 12% discount in the HubSpot tab (ST20), Marcus's viewpoint.
    cut(180, as('marcus'), NEXT),
    // H-124 to H-127: ST21 to ST24, one hard cut each.
    cut(210, NEXT),
    cut(240, NEXT),
    cut(270, NEXT),
    cut(300, NEXT),
    // H-127: one toast, 150 ms after the center opens.
    cut(306, TOAST),
    // H-128 memory collage: the toast is dismissed (the toast only; the incident and every notice are untouched).
    cut(330, { type: 'DISMISS_TOAST' }),
    // H-129: the capability matrix; H-132: the Command Center again.
    cut(360, OPEN('SC36')),
    cut(450, OPEN('SC33')),
  ],
  outlines: [
    { frame: 405, target: 'cap-row-netsuite', mode: 'selected' },
    { frame: 420, target: null, mode: 'selected' },
  ],
  pointer: [
    { frame: 0, visible: false },
    { frame: 1, visible: true },
    // H-118: the selected node holds; an explicit event keeps the entry in the timeline.
    { frame: 30, visible: true },
    // H-118 and H-119 hold the selected node; the pointer stays.
    { frame: 330, visible: false },
    { frame: 391, visible: true },
    { frame: 420, visible: false },
  ],
  entryAt: entryEvery('H', 117, 30),
}

export const LK_L11: ClipSpec = {
  cut: 'launch',
  clipId: 'lk-l11-breadth',
  scene: 'L11',
  filmStartFrame: 144 * 30,
  durationFrames: 600,
  seed: 20261217,
  startAt: 'ST17',
  start: [700, 330],
  anchors: ANCHORS,
  moves: [
    // L-148 Map: the pointer selects the Reconciler node (500 ms, f45).
    go(31, 14, GRAPH_POINT, 'map-agent', [AGENT]),
    place(60, [640, 360]),
    // L-150 Revalidation: the pointer hovers the impacted agent.
    place(90, [850, 300]),
    go(91, 15, centre(P['impact-agent']), 'impact-agent'),
    // L-151 Peer knowledge: the pointer moves to Guide Me (500 ms); L-152 presses it (400 ms, f162).
    place(120, [1000, 420]),
    go(121, 14, centre(E['guide-me']), 'guide-me'),
    go(151, 11, centre(E['guide-me']), undefined, [GUIDE]),
    // L-153 Unsafe action: the pointer attempts Submit (500 ms, f195): an inert press on a blocked control.
    place(180, [700, 420]),
    go(181, 14, centre(H['blocked-submit']), 'blocked-submit', []),
    // L-154 Request approval: the pointer hovers the request; no press.
    go(211, 15, centre(H['request-approval']), 'request-approval'),
    // L-155 Command Center: the pointer points at the verified outcomes and the unknown.
    place(240, [700, 300]),
    go(241, 15, centre(C['cc-verified']), 'cc-verified'),
    // L-156 X-Ray: the pointer selects 14-Day X-Ray (400 ms, f283).
    go(271, 12, centre(C['cc-tab-xray']), 'cc-tab-xray', [XRAY]),
    // L-157 Audit: the pointer selects Export audit pack (500 ms, f315).
    place(300, [900, 300]),
    go(301, 14, centre(A['audit-export']), 'audit-export', [DRAWER]),
    // L-158 Notification center: the pointer opens it from the bell (400 ms, f343).
    place(330, [1000, 200]),
    go(331, 12, centre(BELL), 'bell', [OPEN('SC35')]),
    place(360, [640, 360]),
    // L-161 to L-162: the pointer scans the Gmail and NetSuite rows, then downward to Sheets and Slack.
    place(420, [900, 225]),
    go(421, 21, centre(K['cap-row-netsuite']), 'cap-row-netsuite'),
    go(451, 18, centre(K['cap-row-slack']), 'cap-row-slack'),
    // L-163 and L-164: no pointer.
    place(480, [640, 360]),
  ],
  actions: [
    // L-149: the policy change at ST19 (ST18 is passed in the same frame).
    cut(60, NEXT, NEXT),
    cut(90, TESTS),
    // L-151: Jamal's NetSuite form; the card slides in over 500 ms (the launch entry).
    cut(120, as('jamal'), OPEN('SC04'), { type: 'PLACE_HUD', placement: 'upper', motion: 'long' }),
    // L-153: the blocked 12% discount in the HubSpot tab (ST20), Marcus's viewpoint.
    cut(180, as('marcus'), NEXT),
    // L-155: ST21 and ST22 in one frame (the version history was shown at the end of `lk-l10-heal`).
    cut(240, NEXT, NEXT),
    cut(300, NEXT),
    cut(330, NEXT),
    // L-158: one expanded notice, the approval request.
    cut(345, OPEN_N01),
    // L-159 adapter grid, L-160 matrix headers.
    cut(360, OPEN('SC36'), { type: 'SET_CAPABILITY_VIEW', view: 'tiles' }),
    cut(390, { type: 'SET_CAPABILITY_VIEW', view: 'matrix' }),
  ],
  outlines: [
    { frame: 420, target: 'cap-row-gmail', mode: 'selected' },
    { frame: 435, target: 'cap-row-netsuite', mode: 'selected' },
    { frame: 450, target: 'cap-row-google-sheets', mode: 'selected' },
    { frame: 465, target: 'cap-row-slack', mode: 'selected' },
    { frame: 480, target: 'cap-row-zoom', mode: 'selected' },
    { frame: 510, target: 'cap-row-hubspot', mode: 'selected' },
    { frame: 525, target: 'cap-row-chrome', mode: 'selected' },
    { frame: 540, target: null, mode: 'selected' },
  ],
  pointer: [
    { frame: 0, visible: false },
    { frame: 31, visible: true },
    { frame: 60, visible: false },
    { frame: 90, visible: true },
    { frame: 360, visible: false },
    { frame: 421, visible: true },
    { frame: 480, visible: false },
    // L-166 (02:43): the ring leaves the frame; the product holds with no pointer.
    { frame: 570, visible: false },
  ],
  entryAt: entryEvery('L', 147, 30),
}

export const BREADTH_CLIP_SPECS: readonly ClipSpec[] = [HK_H4H, LK_L11]
