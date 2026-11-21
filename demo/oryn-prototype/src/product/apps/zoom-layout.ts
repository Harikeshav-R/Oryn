import type { Rect } from '@/film'

/**
 * APP-08 Zoom meeting view. Every rectangle is ABSOLUTE 1280x720 canvas coordinates (the space a
 * timeline anchor is declared in); the view fills the content area below the 48px browser bar
 * (canvas y 76 to 720) and keeps everything above the Dock (y 646). Anchored rectangles are
 * constants: no interaction state, content length or neighbouring layout moves one.
 *
 * Layout, top to bottom: top bar, consent banner, a two-tile grid (Dana left, Priya right) with the
 * quotation panel laid over the lower part of the grid above the name strips, and the controls rail.
 */

/** Non-anchored regions. */
export const ZOOM_TOP_BAR: Rect = { x: 0, y: 76, width: 1280, height: 48 }
export const ZOOM_GRID: Rect = { x: 200, y: 196, width: 880, height: 368 }
export const ZOOM_RAIL: Rect = { x: 200, y: 572, width: 880, height: 56 }

export const ZOOM_ANCHORS = [
  'meeting-consent',
  'consent-action',
  'consent-decline',
  'recording-indicator',
  'meeting-ended',
  'tile-dana',
  'tile-priya',
  'meeting-quote',
  'quote-dana',
  'quote-priya',
  'end-meeting',
] as const
export type ZOOMAnchor = (typeof ZOOM_ANCHORS)[number]

/** Canvas rectangle of every anchor when it is shown. */
export const ZOOM_ANCHOR_RECTS: Readonly<Record<ZOOMAnchor, Rect>> = Object.freeze({
  'meeting-consent': { x: 200, y: 132, width: 880, height: 56 },
  'consent-action': { x: 882, y: 144, width: 190, height: 32 },
  'consent-decline': { x: 684, y: 144, width: 190, height: 32 },
  'recording-indicator': { x: 216, y: 148, width: 104, height: 24 },
  'meeting-ended': { x: 216, y: 148, width: 136, height: 24 },
  'tile-dana': { x: 200, y: 196, width: 436, height: 368 },
  'tile-priya': { x: 644, y: 196, width: 436, height: 368 },
  'meeting-quote': { x: 216, y: 436, width: 848, height: 92 },
  'quote-dana': { x: 232, y: 444, width: 816, height: 36 },
  'quote-priya': { x: 232, y: 486, width: 816, height: 36 },
  'end-meeting': { x: 920, y: 580, width: 152, height: 40 },
})

/** Banner text areas, canvas coordinates (all inside `meeting-consent`). */
export const ZOOM_BANNER = Object.freeze({
  heading: { x: 216, y: 138, width: 444, height: 18 } satisfies Rect,
  body: { x: 216, y: 160, width: 444, height: 22 } satisfies Rect,
  resolved: { x: 332, y: 150, width: 500, height: 20 } satisfies Rect,
  ended: { x: 368, y: 150, width: 500, height: 20 } satisfies Rect,
})

/** Tile content, tile-local coordinates (origin = the tile's own top-left). */
export const ZOOM_TILE = Object.freeze({
  avatar: { x: 174, y: 60, width: 88, height: 88 } satisfies Rect,
  wave: { x: 192, y: 172, width: 52, height: 28 } satisfies Rect,
  strip: { x: 0, y: 340, width: 436, height: 28 } satisfies Rect,
})

/** Quotation panel rows, panel-local label and text columns (origin = the row's own top-left). */
export const ZOOM_QUOTE = Object.freeze({
  label: { x: 0, y: 0, width: 160, height: 36 } satisfies Rect,
  text: { x: 176, y: 6, width: 640, height: 24 } satisfies Rect,
  /** The 1px rule between the two lines, canvas coordinates. */
  rule: { x: 232, y: 483, width: 816, height: 1 } satisfies Rect,
})

/** Controls rail, canvas coordinates. */
export const ZOOM_CONTROLS = Object.freeze({
  mic: { x: 216, y: 588, width: 80, height: 24 } satisfies Rect,
  video: { x: 304, y: 588, width: 80, height: 24 } satisfies Rect,
  users: { x: 392, y: 588, width: 128, height: 24 } satisfies Rect,
  caption: { x: 536, y: 584, width: 148, height: 32 } satisfies Rect,
  reason: { x: 688, y: 592, width: 224, height: 16 } satisfies Rect,
})
