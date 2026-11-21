import type { Rect } from '@/film'
import { DRAWER, DRAWER_PARTS } from './candidate-layout'
import { offset } from './geometry'

/**
 * SC19 Flight Simulator and SC20 results, replay and compare. Absolute 1280x720 canvas coordinates
 * inside the shell's content area. Every anchor's rectangle is fixed by its screen alone: idle,
 * running, cancelled and finished states move nothing, so the sidecar can sample one rectangle per
 * anchor for the whole clip.
 *
 * Both screens share one header (heading, suite line, versions) at the same coordinates. SC19 adds
 * the categories, the progress bar and the two run controls; SC20 stands the 4x7 grid at the left
 * `[264,200,472,416]` (inventory SC20) and its results at the right. Anchor names are never shared
 * between the two screens with different rectangles, because a timeline holds one rectangle per name.
 */

export const TILE = Object.freeze({ width: 96, height: 52, gap: 8, columns: 4, rows: 7 })
/** The 28 tiles occupy 408 x 412, centred in the 472 x 416 host (inventory section 4, decision 13). */
export const GRID = Object.freeze({ width: 408, height: 412 })

// -- shared header ------------------------------------------------------------------------------

export const HEADING: Rect = { x: 264, y: 112, width: 260, height: 36 }
export const STATUS: Rect = { x: 540, y: 116, width: 460, height: 28 }
export const SUITE_LINE: Rect = { x: 264, y: 152, width: 270, height: 28 }
export const VERSIONS: Rect = { x: 540, y: 148, width: 136, height: 32 }
export const versionChip = (index: number): Rect => ({ x: 540 + index * 72, y: 148, width: 64, height: 32 })
export const CATEGORIES: Rect = { x: 692, y: 148, width: 288, height: 32 }
export const CATEGORY_CHIPS: readonly Rect[] = [
  { x: 692, y: 148, width: 96, height: 32 },
  { x: 796, y: 148, width: 72, height: 32 },
  { x: 876, y: 148, width: 104, height: 32 },
]
export const PROGRESS: Rect = { x: 264, y: 190, width: 992, height: 8 }

/** The run action is centred on P(1100,160); Cancel sits at its right edge. */
export const RUN_BUTTON: Rect = { x: 1020, y: 140, width: 160, height: 40 }
export const CANCEL_BUTTON: Rect = { x: 1188, y: 140, width: 68, height: 40 }

// -- SC19: grid or row stream at the left, detail at the right -----------------------------------

export const SIM_HOST: Rect = { x: 300, y: 220, width: 472, height: 416 }
const SIM_ORIGIN = { x: 332, y: 222 }
export const simTile = (index: number): Rect => ({
  x: SIM_ORIGIN.x + (index % TILE.columns) * (TILE.width + TILE.gap),
  y: SIM_ORIGIN.y + Math.floor(index / TILE.columns) * (TILE.height + TILE.gap),
  width: TILE.width,
  height: TILE.height,
})

/** Compact rows keep the executing scenario visible during the 120 px film stream. */
export const STREAM_ROW = 19

export const SIM_DETAIL_TITLE: Rect = { x: 788, y: 220, width: 468, height: 24 }
export const SIM_DETAIL: Rect = { x: 788, y: 248, width: 468, height: 96 }
export const SAFE_HEADING: Rect = { x: 788, y: 356, width: 468, height: 24 }
export const SAFE_ROW = 40
export const SAFE_LIST: Rect = { x: 788, y: 384, width: 468, height: SAFE_ROW * 6 }
export const safeRow = (index: number): Rect => ({ x: 788, y: 384 + index * SAFE_ROW, width: 468, height: SAFE_ROW })

// -- SC20: grid at the left, results at the right ------------------------------------------------

export const RES_HOST: Rect = { x: 264, y: 200, width: 472, height: 416 }
const RES_ORIGIN = { x: 296, y: 202 }
export const resTile = (index: number): Rect => ({
  x: RES_ORIGIN.x + (index % TILE.columns) * (TILE.width + TILE.gap),
  y: RES_ORIGIN.y + Math.floor(index / TILE.columns) * (TILE.height + TILE.gap),
  width: TILE.width,
  height: TILE.height,
})

export const RESULTS: Rect = { x: 760, y: 200, width: 496, height: 128 }
/** Three result tiles of equal width in the first 96 px of the results, then the summary line. */
export const resultTile = (index: number): Rect => ({ x: 760 + index * 168, y: 200, width: 160, height: 96 })
export const RESULT_SUMMARY: Rect = { x: 760, y: 304, width: 496, height: 24 }
export const RESULT_DETAIL: Rect = { x: 760, y: 336, width: 496, height: 48 }
export const SAFE_RESULTS_HEADING: Rect = { x: 760, y: 392, width: 496, height: 22 }
export const SAFE_RESULT_ROW = 24
export const SAFE_RESULTS: Rect = { x: 760, y: 418, width: 496, height: SAFE_RESULT_ROW * 6 }
export const safeResultRow = (index: number): Rect => ({ x: 760, y: 418 + index * SAFE_RESULT_ROW, width: 496, height: SAFE_RESULT_ROW })

/** `Compare versions` and `Rerun` (centred on P(1050,590)) share the bottom row. */
export const COMPARE_BUTTON: Rect = { x: 782, y: 570, width: 170, height: 40 }
export const RERUN_BUTTON: Rect = { x: 970, y: 570, width: 160, height: 40 }

/** Comparison: two equal columns, 247 + 1 + 248, rows aligned across both. */
export const COMPARE: Rect = { x: 760, y: 200, width: 496, height: 352 }
export const COMPARE_ROW = Object.freeze({ header: 36, line: 36, equality: 56 })
export const COMPARE_COLUMN = Object.freeze({ left: 247, divider: 1, right: 248 })
/** Row rectangles in comparison-local coordinates (origin the panel's top-left). */
export const COMPARE_ROWS = Object.freeze({
  header: { x: 0, y: 0, width: 496, height: 36 } satisfies Rect,
  passed: { x: 0, y: 36, width: 496, height: 36 } satisfies Rect,
  safe: { x: 0, y: 72, width: 496, height: 36 } satisfies Rect,
  failed: { x: 0, y: 108, width: 496, height: 36 } satisfies Rect,
  intended: { x: 0, y: 144, width: 496, height: 36 } satisfies Rect,
  equality: { x: 0, y: 180, width: 496, height: 56 } satisfies Rect,
  comparator: { x: 0, y: 236, width: 496, height: 36 } satisfies Rect,
  note: { x: 0, y: 284, width: 496, height: 48 } satisfies Rect,
})
export const EQUALITY_ROW: Rect = offset(COMPARE, COMPARE_ROWS.equality)

// -- SC20 replay drawer (body-local coordinates; the drawer frame is `DRAWER`) -------------------

export const REPLAY_PARTS = Object.freeze({
  expected: { x: 0, y: 8, width: 208, height: 112 } satisfies Rect,
  actual: { x: 224, y: 8, width: 208, height: 112 } satisfies Rect,
  threshold: { x: 0, y: 140, width: 432, height: 64 } satisfies Rect,
  ruleLink: { x: 0, y: 216, width: 432, height: 40 } satisfies Rect,
  note: { x: 0, y: 272, width: 432, height: 72 } satisfies Rect,
})
const REPLAY_BODY = offset(DRAWER, DRAWER_PARTS.body)
export const REPLAY_RULE_LINK: Rect = offset(REPLAY_BODY, REPLAY_PARTS.ruleLink)

// -- anchors ------------------------------------------------------------------------------------

export const SIMULATOR_ANCHORS = [
  'sim-version',
  'sim-status',
  'sim-progress',
  'scenario-grid',
  'run-scenarios',
  'cancel-run',
  'scenario-detail',
  'safe-cases',
  'safe-case-scn-023',
  'safe-case-scn-024',
  'safe-case-scn-025',
  'safe-case-scn-026',
  'safe-case-scn-027',
  'safe-case-scn-028',
] as const
export type SimulatorAnchor = (typeof SIMULATOR_ANCHORS)[number]

export const SAFE_CASE_ANCHORS = SIMULATOR_ANCHORS.filter((name) => name.startsWith('safe-case-')) as readonly SimulatorAnchor[]

export const SIMULATOR_ANCHOR_RECTS: Readonly<Record<SimulatorAnchor, Rect>> = Object.freeze({
  'sim-version': VERSIONS,
  'sim-status': STATUS,
  'sim-progress': PROGRESS,
  'scenario-grid': SIM_HOST,
  'run-scenarios': RUN_BUTTON,
  'cancel-run': CANCEL_BUTTON,
  'scenario-detail': SIM_DETAIL,
  'safe-cases': SAFE_LIST,
  'safe-case-scn-023': safeRow(0),
  'safe-case-scn-024': safeRow(1),
  'safe-case-scn-025': safeRow(2),
  'safe-case-scn-026': safeRow(3),
  'safe-case-scn-027': safeRow(4),
  'safe-case-scn-028': safeRow(5),
})

export const RESULT_ANCHORS = [
  'results',
  'failed-scenario',
  'result-detail',
  'safe-results',
  'safe-result-scn-023',
  'safe-result-scn-024',
  'safe-result-scn-025',
  'safe-result-scn-026',
  'safe-result-scn-027',
  'safe-result-scn-028',
  'compare-versions',
  'rerun',
  'version-compare',
  'equality-row',
  'replay',
  'replay-rule-link',
  'rule-drawer',
  'drawer-close',
] as const
export type ResultAnchor = (typeof RESULT_ANCHORS)[number]

/** SCN-022 is the 22nd tile: the failed scenario, at row 5 column 1 of the results grid. */
export const FAILED_TILE_INDEX = 21

export const RESULT_ANCHOR_RECTS: Readonly<Record<ResultAnchor, Rect>> = Object.freeze({
  results: RESULTS,
  'failed-scenario': resTile(FAILED_TILE_INDEX),
  'result-detail': RESULT_DETAIL,
  'safe-results': SAFE_RESULTS,
  'safe-result-scn-023': safeResultRow(0),
  'safe-result-scn-024': safeResultRow(1),
  'safe-result-scn-025': safeResultRow(2),
  'safe-result-scn-026': safeResultRow(3),
  'safe-result-scn-027': safeResultRow(4),
  'safe-result-scn-028': safeResultRow(5),
  'compare-versions': COMPARE_BUTTON,
  rerun: RERUN_BUTTON,
  'version-compare': COMPARE,
  'equality-row': EQUALITY_ROW,
  replay: DRAWER,
  'replay-rule-link': REPLAY_RULE_LINK,
  'rule-drawer': DRAWER,
  'drawer-close': offset(DRAWER, offset(DRAWER_PARTS.footer, DRAWER_PARTS.close)),
})
