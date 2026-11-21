import type { CSSProperties } from 'react'
import type { Rect } from '@/film'
import { filmAnchor } from './contract'

/**
 * Exact-geometry helpers shared by SC02 and SC03. Both screens place every anchored element with
 * absolute authored coordinates, so a rectangle never depends on interaction state, content length
 * or neighbouring layout.
 */

export const at = (rect: Rect): CSSProperties => ({ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height })

/** `child` (same space as `parent`) expressed relative to `parent`'s origin. */
export const within = (parent: Rect, child: Rect): Rect => ({ x: child.x - parent.x, y: child.y - parent.y, width: child.width, height: child.height })

/** `local` (relative to `origin`) in the space `origin` is expressed in. */
export const offset = (origin: Rect, local: Rect): Rect => ({ x: origin.x + local.x, y: origin.y + local.y, width: local.width, height: local.height })

/** Anchor attribute plus placement; `visible: false` hides the element itself (`display: none`) so the film reads it as hidden. */
export function anchored(name: string, rect: Rect, visible = true): { readonly 'data-film-anchor': string; readonly style: CSSProperties } {
  return { ...filmAnchor(name), style: visible ? at(rect) : { ...at(rect), display: 'none' } }
}
