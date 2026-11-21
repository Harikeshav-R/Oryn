import type { CSSProperties } from 'react'
import type { Rect } from '@/film'
import { filmAnchor } from '../contract'

/**
 * Work-application geometry (APP-01 to APP-08). Rectangles in these modules are ABSOLUTE 1280x720
 * canvas coordinates, the same space a timeline anchor is declared in. An application view fills
 * the content area below the 48px browser bar (canvas y 76 to 720), so an element inside it is
 * placed with `appAt`, which subtracts `APP_TOP`. Nothing anchored may depend on interaction state,
 * content length or neighbouring layout: place every anchored element with `appAnchored`.
 */
export const APP_TOP = 76
export const APP_AREA: Rect = { x: 0, y: APP_TOP, width: 1280, height: 644 }
/** The Dock starts at canvas y 646: keep application content above it. */
export const APP_BOTTOM = 646

/** Absolute placement of a canvas rectangle inside the application content area. */
export const appAt = (rect: Rect): CSSProperties => ({ position: 'absolute', left: rect.x, top: rect.y - APP_TOP, width: rect.width, height: rect.height })

/** Anchor attribute plus placement; `visible: false` hides the element itself so the film reads it as hidden. */
export function appAnchored(name: string, rect: Rect, visible = true): { readonly 'data-film-anchor': string; readonly style: CSSProperties } {
  return { ...filmAnchor(name), style: visible ? appAt(rect) : { ...appAt(rect), display: 'none' } }
}

/** `child` (canvas space) expressed relative to `parent`'s origin, for children placed inside a positioned parent. */
export const inside = (parent: Rect, child: Rect): Rect => ({ x: child.x - parent.x, y: child.y - parent.y, width: child.width, height: child.height })
