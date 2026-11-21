import type { Rect } from './types'

/**
 * Contract between `scripts/capture.ts` and the `film-capture` page (`?view=film-capture&mode=film`).
 * The script hands the page the timeline JSON it already validated; the page parses it again at its
 * own trust boundary, renders one frame at a time with `resolveFrame` and reports what the DOM
 * actually shows so the script can compare it with the sidecar. All rectangles are 1280x720 CSS px.
 */

export interface AnchorMeasure {
  /** An element with `data-film-anchor="<name>"` exists. A missing element is a capture error. */
  readonly found: boolean
  /** Its border box, or null while the surface hides it (`display: none`). */
  readonly rect: Rect | null
}

export interface SeekReport {
  readonly ok: true
  readonly frame: number
  readonly canvas: Rect
  readonly anchors: Readonly<Record<string, AnchorMeasure>>
  /** Arrow tip in CSS px, or null when the overlay pointer is not drawn. */
  readonly cursor: { readonly x: number; readonly y: number } | null
  /** FNV-1a of the canvas markup: equal digests mean an equal DOM state. */
  readonly digest: string
  /** `src` of every `<img>` that failed to decode at this frame. */
  readonly imageFailures: readonly string[]
}

export type LoadReport =
  | { readonly ok: true; readonly cut: string; readonly clipId: string; readonly durationFrames: number }
  | { readonly ok: false; readonly kind: 'timeline' | 'surface' | 'asset'; readonly message: string }

export type SeekResult = SeekReport | { readonly ok: false; readonly message: string }

export interface FilmCaptureApi {
  load(timeline: unknown): Promise<LoadReport>
  seek(frame: number): Promise<SeekResult>
}

declare global {
  interface Window {
    __filmCapture?: FilmCaptureApi
  }
}
