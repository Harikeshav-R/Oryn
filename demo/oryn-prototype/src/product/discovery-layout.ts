import type { Rect } from '@/film'

/**
 * SC13 Workflow Discovery inbox. Absolute 1280x720 canvas coordinates inside the shell's content
 * area (the shell never resizes). One candidate row at y176-224, the demonstration rows below it at
 * 32 px each. A filter, a selection, an approval or a status never moves or resizes an anchor.
 */

export const DISCOVERY_HEADING: Rect = { x: 264, y: 112, width: 600, height: 34 }

/** Three filter chips right-aligned on the heading row. */
export const FILTER_ROW: Rect = { x: 968, y: 114, width: 288, height: 32 }
export const FILTER_CHIPS = Object.freeze({
  all: { x: 968, y: 114, width: 56, height: 32 } satisfies Rect,
  'needs-review': { x: 1032, y: 114, width: 124, height: 32 } satisfies Rect,
  published: { x: 1164, y: 114, width: 92, height: 32 } satisfies Rect,
})

/** Column labels above the candidate row. */
export const COLUMN_HEADER: Rect = { x: 264, y: 152, width: 992, height: 24 }
/** Fixed column widths shared by the header and every row (the workflow column takes the rest). */
export const COLUMNS = Object.freeze({ demonstrations: 140, status: 208, trailing: 24, pad: 16 })

export const CANDIDATE_ROW: Rect = { x: 264, y: 176, width: 992, height: 48 }

/** The demonstration list: a 24 px label row, then three 32 px rows. */
export const DEMONSTRATIONS_BLOCK: Rect = { x: 264, y: 240, width: 992, height: 120 }
export const DEMONSTRATIONS_LABEL: Rect = { x: 264, y: 240, width: 992, height: 24 }
export const demonstrationRow = (index: number): Rect => ({ x: 264, y: 264 + index * 32, width: 992, height: 32 })

export const DISCOVERY_NOTE: Rect = { x: 264, y: 376, width: 992, height: 44 }

/** Empty (`No candidates yet`) and no-access views replace the candidate and the list. */
export const EMPTY_STATE: Rect = { x: 264, y: 176, width: 992, height: 152 }
export const EMPTY_TITLE: Rect = { x: 288, y: 196, width: 944, height: 28 }
export const EMPTY_BODY: Rect = { x: 288, y: 232, width: 944, height: 20 }
export const EMPTY_ACTION: Rect = { x: 288, y: 272, width: 200, height: 40 }
export const DENIED_STATE: Rect = { x: 264, y: 176, width: 992, height: 88 }

export const DISCOVERY_ANCHORS = [
  'candidate-row',
  'demonstrations',
  'demo-row-d1',
  'demo-row-d2',
  'demo-row-d3',
  'discovery-filters',
  'filter-all',
  'filter-needs-review',
  'filter-published',
  'empty-state',
  'empty-action',
] as const
export type DiscoveryAnchor = (typeof DISCOVERY_ANCHORS)[number]

/** Canvas rectangle of every anchor in the view that shows it (candidate view for the row and list, empty view for the last two). */
export const DISCOVERY_ANCHOR_RECTS: Readonly<Record<DiscoveryAnchor, Rect>> = Object.freeze({
  'candidate-row': CANDIDATE_ROW,
  demonstrations: DEMONSTRATIONS_BLOCK,
  'demo-row-d1': demonstrationRow(0),
  'demo-row-d2': demonstrationRow(1),
  'demo-row-d3': demonstrationRow(2),
  'discovery-filters': FILTER_ROW,
  'filter-all': FILTER_CHIPS.all,
  'filter-needs-review': FILTER_CHIPS['needs-review'],
  'filter-published': FILTER_CHIPS.published,
  'empty-state': EMPTY_STATE,
  'empty-action': EMPTY_ACTION,
})
