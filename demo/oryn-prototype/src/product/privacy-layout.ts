import type { Rect } from '@/film'
import type { PRIVACY_ANCHORS } from './anchors'
import { CANVAS, PRIVACY, SHELL } from './contract'
import { offset } from './geometry'

export type PrivacyAnchor = (typeof PRIVACY_ANCHORS)[number]

/** The absolutely positioned block holding both columns: the shell's content area. */
export const BLOCK = SHELL.content

/** Authored rectangles in block-local coordinates (origin = SHELL.content). */
export const B = {
  heading: { x: 0, y: 0, width: PRIVACY.left.width, height: 34 },
  exclusions: { x: 0, y: 48, width: PRIVACY.left.width, height: 208 },
  retention: { x: 0, y: 272, width: PRIVACY.left.width, height: 128 },
  pause: { x: 0, y: 416, width: 200, height: 40 },
  deleteHistory: { x: 212, y: 416, width: 208, height: 40 },
  status: { x: 436, y: 416, width: 164, height: 40 },
  receipt: { x: 0, y: 468, width: PRIVACY.left.width, height: 48 },
  masked: { x: PRIVACY.right.x - BLOCK.x, y: 48, width: PRIVACY.right.width, height: 208 },
  summary: { x: PRIVACY.right.x - BLOCK.x, y: 272, width: PRIVACY.right.width, height: 160 },
} as const satisfies Record<string, Rect>

/** Delete dialog panel in canvas coordinates: centred, 512 wide (the maximum), 232 high. */
export const DIALOG: Rect = { x: (CANVAS.width - PRIVACY.dialogMaxWidth) / 2, y: 244, width: PRIVACY.dialogMaxWidth, height: 232 }

/** Dialog contents in panel-local coordinates. */
export const D = {
  icon: { x: 24, y: 24, width: 20, height: 20 },
  title: { x: 56, y: 22, width: 432, height: 28 },
  body: { x: 24, y: 68, width: 464, height: 60 },
  cancel: { x: 176, y: 168, width: 96, height: 40 },
  confirm: { x: 280, y: 168, width: 208, height: 40 },
} as const satisfies Record<string, Rect>

/** Canvas rectangles of every anchor (what a timeline names). */
export const PRIVACY_ANCHOR_RECTS: Readonly<Record<PrivacyAnchor, Rect>> = Object.freeze({
  exclusions: offset(BLOCK, B.exclusions),
  retention: offset(BLOCK, B.retention),
  'masked-fields': offset(BLOCK, B.masked),
  'privacy-pause': offset(BLOCK, B.pause),
  'delete-local-history': offset(BLOCK, B.deleteHistory),
  'delete-dialog': DIALOG,
  'delete-confirm': offset(DIALOG, D.confirm),
  'delete-cancel': offset(DIALOG, D.cancel),
})
