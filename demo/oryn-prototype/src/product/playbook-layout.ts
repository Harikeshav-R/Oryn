import type { Rect } from '@/film'
import { DRAWER_ANCHORS, DRAWER, DRAWER_PARTS } from './candidate-layout'
import { offset } from './geometry'

/**
 * SC15 playbook. Absolute 1280x720 canvas coordinates inside the shell's content area: the
 * procedure column `[264,112,608,560]` (title, Steps, Exceptions) and the rules and evidence rail
 * `[896,112,360,560]` (Decisions, Evidence, then the publication footer). Draft or approved, the
 * playbook never moves or resizes an anchor.
 */

export const PLAYBOOK_REGION: Rect = { x: 264, y: 112, width: 992, height: 560 }
export const PLAYBOOK_TITLE: Rect = { x: 264, y: 112, width: 608, height: 56 }
export const PLAYBOOK_OWNER: Rect = { x: 264, y: 176, width: 184, height: 24 }
export const PLAYBOOK_STATUS: Rect = { x: 456, y: 176, width: 232, height: 24 }

export const STEPS_CARD: Rect = { x: 264, y: 208, width: 608, height: 272 }
/** Steps card contents, card-local: a heading, then six 36 px rows. */
export const STEPS_PARTS = Object.freeze({
  heading: { x: 16, y: 12, width: 576, height: 28 } satisfies Rect,
  firstRow: { x: 16, y: 48, width: 576, height: 36 } satisfies Rect,
  rowStep: 36,
})

export const EXCEPTIONS_CARD: Rect = { x: 264, y: 496, width: 608, height: 176 }
/** Exceptions card contents, card-local: a heading, then five 24 px rows. */
export const EXCEPTIONS_PARTS = Object.freeze({
  heading: { x: 16, y: 12, width: 576, height: 28 } satisfies Rect,
  firstRow: { x: 16, y: 48, width: 576, height: 24 } satisfies Rect,
  rowStep: 24,
})

export const DECISIONS_CARD: Rect = { x: 896, y: 112, width: 360, height: 252 }
export const DECISIONS_PARTS = Object.freeze({
  heading: { x: 16, y: 12, width: 328, height: 28 } satisfies Rect,
  rule009: { x: 16, y: 48, width: 328, height: 88 } satisfies Rect,
  rule017: { x: 16, y: 144, width: 328, height: 88 } satisfies Rect,
})

export const EVIDENCE_CARD: Rect = { x: 896, y: 380, width: 360, height: 160 }
export const EVIDENCE_PARTS = Object.freeze({
  heading: { x: 16, y: 12, width: 328, height: 28 } satisfies Rect,
  link: (index: number): Rect => ({ x: 16, y: 48 + index * 36, width: 328, height: 32 }),
})

export const PUBLICATION_CARD: Rect = { x: 896, y: 556, width: 360, height: 116 }
export const PUBLICATION_PARTS = Object.freeze({
  heading: { x: 16, y: 12, width: 328, height: 22 } satisfies Rect,
  text: { x: 16, y: 36, width: 328, height: 40 } satisfies Rect,
  publish: { x: 16, y: 82, width: 152, height: 32 } satisfies Rect,
  agentFactory: { x: 176, y: 82, width: 168, height: 32 } satisfies Rect,
})

export const PLAYBOOK_ANCHORS = [
  'playbook',
  'publish',
  'agent-factory',
  'playbook-title',
  'playbook-owner',
  'playbook-status',
  'playbook-steps',
  'playbook-decisions',
  'playbook-exceptions',
  'playbook-evidence',
  'rule-009',
  'rule-017',
  'demo-link-d1',
  'demo-link-d2',
  'demo-link-d3',
  ...DRAWER_ANCHORS,
] as const
export type PlaybookAnchor = (typeof PLAYBOOK_ANCHORS)[number]

/** Canvas rectangle of every anchor when it is shown. The two drawer anchors are shown only while the drawer is open. */
export const PLAYBOOK_ANCHOR_RECTS: Readonly<Record<PlaybookAnchor, Rect>> = Object.freeze({
  playbook: PLAYBOOK_REGION,
  publish: offset(PUBLICATION_CARD, PUBLICATION_PARTS.publish),
  'agent-factory': offset(PUBLICATION_CARD, PUBLICATION_PARTS.agentFactory),
  'playbook-title': PLAYBOOK_TITLE,
  'playbook-owner': PLAYBOOK_OWNER,
  'playbook-status': PLAYBOOK_STATUS,
  'playbook-steps': STEPS_CARD,
  'playbook-decisions': DECISIONS_CARD,
  'playbook-exceptions': EXCEPTIONS_CARD,
  'playbook-evidence': EVIDENCE_CARD,
  'rule-009': offset(DECISIONS_CARD, DECISIONS_PARTS.rule009),
  'rule-017': offset(DECISIONS_CARD, DECISIONS_PARTS.rule017),
  'demo-link-d1': offset(EVIDENCE_CARD, EVIDENCE_PARTS.link(0)),
  'demo-link-d2': offset(EVIDENCE_CARD, EVIDENCE_PARTS.link(1)),
  'demo-link-d3': offset(EVIDENCE_CARD, EVIDENCE_PARTS.link(2)),
  'rule-drawer': DRAWER,
  'drawer-close': offset(DRAWER, offset(DRAWER_PARTS.footer, DRAWER_PARTS.close)),
})
