import type { Rect } from '@/film'
import { DRAWER, DRAWER_ANCHORS, DRAWER_PARTS } from './candidate-layout'
import { offset } from './geometry'

/**
 * SC18 scope, risk, autonomy and release gate. Absolute 1280x720 canvas coordinates inside the
 * shell's content area.
 *
 * The inventory gives the scope panel `[264,112,480,560]` and the risk, ladder and gates one right
 * panel `[768,112,464,560]` with 54 px ladder rows and 40 px gate rows. Those sizes do not fit one
 * panel (a 164 px risk block, a 324 px ladder and a 200 px gate are 688 px), so this build keeps the
 * scope panel on the left with the ladder beneath it in the dense 32 px variant CMP-22 allows, and
 * the risk block, the gate and the release actions in the right panel. Pending or satisfied, the
 * screen never moves or resizes an anchor.
 */

// -- left panel [264,112,480,560]: scope, then the autonomy ladder -------------------------------

export const SCOPE_PANEL: Rect = { x: 264, y: 112, width: 480, height: 292 }
export const SCOPE_PARTS = Object.freeze({
  heading: { x: 264, y: 112, width: 480, height: 22 } satisfies Rect,
  team: { x: 264, y: 140, width: 480, height: 28 } satisfies Rect,
  applications: { x: 264, y: 172, width: 480, height: 32 } satisfies Rect,
  queue: { x: 264, y: 208, width: 480, height: 40 } satisfies Rect,
  agent: { x: 264, y: 252, width: 480, height: 28 } satisfies Rect,
  action: { x: 264, y: 284, width: 480, height: 40 } satisfies Rect,
  authority: { x: 264, y: 328, width: 480, height: 40 } satisfies Rect,
  confirm: { x: 264, y: 372, width: 160, height: 32 } satisfies Rect,
  confirmNote: { x: 432, y: 372, width: 312, height: 32 } satisfies Rect,
})

export const LADDER_HEADING: Rect = { x: 264, y: 420, width: 480, height: 22 }
export const LADDER_PANEL: Rect = { x: 264, y: 446, width: 480, height: 192 }
export const LADDER_ROW = 32
export const ladderRow = (stage: number): Rect => ({ x: 264, y: 446 + stage * LADDER_ROW, width: 480, height: LADDER_ROW })
export const LADDER_NOTE: Rect = { x: 264, y: 644, width: 480, height: 32 }

// -- right panel [768,112,464,560]: risk, gate, release ------------------------------------------

export const RISK_HEADING: Rect = { x: 768, y: 112, width: 464, height: 22 }
export const RISK_CHIP: Rect = { x: 768, y: 140, width: 240, height: 24 }
export const actionRow = (index: number): Rect => ({ x: 768, y: 172 + index * 26, width: 464, height: 24 })
export const TIER_4_ROW: Rect = { x: 768, y: 256, width: 464, height: 28 }
export const RISK_PANEL: Rect = { x: 768, y: 112, width: 464, height: 172 }

export const GATE_HEADING: Rect = { x: 768, y: 300, width: 464, height: 22 }
export const GATE_STATUS: Rect = { x: 1112, y: 298, width: 120, height: 24 }
export const GATE_ROW = 40
export const gateRow = (index: number): Rect => ({ x: 768, y: 326 + index * GATE_ROW, width: 464, height: GATE_ROW })
export const GATE_PANEL: Rect = { x: 768, y: 300, width: 464, height: 214 }
export const PROVENANCE: Rect = { x: 768, y: 494, width: 464, height: 20 }
export const RELEASE_LINE: Rect = { x: 768, y: 522, width: 464, height: 22 }
export const RELEASE_NOTE: Rect = { x: 768, y: 548, width: 464, height: 32 }
/** Approve release sits inside the owner row, right-aligned: owner approval is its own action, never part of the test rows. */
export const APPROVE_RELEASE: Rect = { x: 1076, y: 450, width: 148, height: 32 }

/** Open Flight Simulator is centred on P(1020,606). */
export const OPEN_SIMULATOR: Rect = { x: 900, y: 586, width: 240, height: 40 }
export const DEPLOY: Rect = { x: 1148, y: 586, width: 84, height: 40 }
export const DENIED: Rect = { x: 264, y: 176, width: 992, height: 88 }

export const SCOPE_ANCHORS = [
  'scope',
  'scope-team',
  'scope-queue',
  'scope-apps',
  'scope-agent',
  'scope-action',
  'scope-authority',
  'confirm-scope',
  'autonomy-ladder',
  'ladder-stage-0',
  'ladder-stage-1',
  'ladder-stage-2',
  'ladder-stage-3',
  'ladder-stage-4',
  'ladder-stage-5',
  'risk',
  'risk-tier',
  'tier-4',
  'gate',
  'gate-examples',
  'gate-scenarios',
  'gate-edge',
  'gate-owner',
  'gate-provenance',
  'approve-release',
  'open-simulator',
  'deploy',
  ...DRAWER_ANCHORS,
] as const
export type ScopeAnchor = (typeof SCOPE_ANCHORS)[number]

/** Canvas rectangle of every anchor when it is shown. The two drawer anchors are shown only while the drawer is open. */
export const SCOPE_ANCHOR_RECTS: Readonly<Record<ScopeAnchor, Rect>> = Object.freeze({
  scope: SCOPE_PANEL,
  'scope-team': SCOPE_PARTS.team,
  'scope-queue': SCOPE_PARTS.queue,
  'scope-apps': SCOPE_PARTS.applications,
  'scope-agent': SCOPE_PARTS.agent,
  'scope-action': SCOPE_PARTS.action,
  'scope-authority': SCOPE_PARTS.authority,
  'confirm-scope': SCOPE_PARTS.confirm,
  'autonomy-ladder': LADDER_PANEL,
  'ladder-stage-0': ladderRow(0),
  'ladder-stage-1': ladderRow(1),
  'ladder-stage-2': ladderRow(2),
  'ladder-stage-3': ladderRow(3),
  'ladder-stage-4': ladderRow(4),
  'ladder-stage-5': ladderRow(5),
  risk: RISK_PANEL,
  'risk-tier': RISK_CHIP,
  'tier-4': TIER_4_ROW,
  gate: GATE_PANEL,
  'gate-examples': gateRow(0),
  'gate-scenarios': gateRow(1),
  'gate-edge': gateRow(2),
  'gate-owner': gateRow(3),
  'gate-provenance': PROVENANCE,
  'approve-release': APPROVE_RELEASE,
  'open-simulator': OPEN_SIMULATOR,
  deploy: DEPLOY,
  'rule-drawer': DRAWER,
  'drawer-close': offset(DRAWER, offset(DRAWER_PARTS.footer, DRAWER_PARTS.close)),
})
