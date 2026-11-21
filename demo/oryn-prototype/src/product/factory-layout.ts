import type { Rect } from '@/film'
import { DRAWER, DRAWER_ANCHORS, DRAWER_PARTS } from './candidate-layout'
import { offset } from './geometry'

/**
 * SC17 Agent Factory. Absolute 1280x720 canvas coordinates inside the shell's content area: the
 * intent field `[304,160,880,72]` (a fixed-height field that wraps instead of growing), the six
 * generated sections as 40 px rows beneath it, the unverified-branch row and Continue at
 * P(1050,600). Empty, typing, generated and reviewed never move or resize an anchor.
 */

export const FACTORY_HEADING: Rect = { x: 304, y: 112, width: 600, height: 36 }
export const INTENT_FIELD: Rect = { x: 304, y: 160, width: 880, height: 72 }

export const SECTIONS_LIST: Rect = { x: 304, y: 248, width: 880, height: 240 }
/** Section rows, list-local: six rows of 40 px. */
export const SECTION_ROW = { height: 40, title: { x: 12, width: 160 }, detail: { x: 184, width: 684 } } as const
export const sectionRow = (index: number): Rect => ({ x: 304, y: 248 + index * SECTION_ROW.height, width: 880, height: SECTION_ROW.height })

export const BRANCH_ROW: Rect = { x: 304, y: 500, width: 880, height: 64 }
/** Branch contents, row-local. */
export const BRANCH_PARTS = Object.freeze({
  icon: { x: 12, y: 12, width: 16, height: 16 } satisfies Rect,
  title: { x: 40, y: 8, width: 540, height: 22 } satisfies Rect,
  detail: { x: 40, y: 32, width: 640, height: 24 } satisfies Rect,
  evidence: { x: 704, y: 12, width: 164, height: 40 } satisfies Rect,
})

export const CONTINUE_BUTTON: Rect = { x: 986, y: 580, width: 128, height: 40 }
export const CONTINUE_REASON: Rect = { x: 304, y: 584, width: 660, height: 32 }
export const DENIED: Rect = { x: 304, y: 176, width: 880, height: 88 }

export const FACTORY_ANCHORS = [
  'intent',
  'agent-sections',
  'section-purpose',
  'section-inputs',
  'section-actions',
  'section-rules',
  'section-outputs',
  'section-stopping-points',
  'unverified-branch',
  'branch-evidence',
  'continue',
  ...DRAWER_ANCHORS,
] as const
export type FactoryAnchor = (typeof FACTORY_ANCHORS)[number]

/** Canvas rectangle of every anchor when it is shown. The two drawer anchors are shown only while the drawer is open. */
export const FACTORY_ANCHOR_RECTS: Readonly<Record<FactoryAnchor, Rect>> = Object.freeze({
  intent: INTENT_FIELD,
  'agent-sections': SECTIONS_LIST,
  'section-purpose': sectionRow(0),
  'section-inputs': sectionRow(1),
  'section-actions': sectionRow(2),
  'section-rules': sectionRow(3),
  'section-outputs': sectionRow(4),
  'section-stopping-points': sectionRow(5),
  'unverified-branch': BRANCH_ROW,
  'branch-evidence': offset(BRANCH_ROW, BRANCH_PARTS.evidence),
  continue: CONTINUE_BUTTON,
  'rule-drawer': DRAWER,
  'drawer-close': offset(DRAWER, offset(DRAWER_PARTS.footer, DRAWER_PARTS.close)),
})
