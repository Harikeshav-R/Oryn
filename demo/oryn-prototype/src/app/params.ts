/**
 * Query parameters selecting a render state. Unsupported values fall back to the
 * default rather than producing an undefined combination.
 *   ?theme=light|dark   ?mode=app|film   ?frame=<integer>   ?running=1   ?reduced=1
 *   ?view=foundation|controls|overlays|composites|film-runtime|film-capture|product
 *   ?screen=SC12&state=ST02&actor=marcus  (product view: deep link; theme comes from ?theme)
 *   ?open=role  (controls view: start with the role menu open)
 *   ?open=<overlay>  (overlays view: start with a surface open, see OVERLAY_STATES)
 */

export type Theme = 'light' | 'dark'
export type Mode = 'app' | 'film'
export type View = 'foundation' | 'controls' | 'overlays' | 'composites' | 'film-runtime' | 'film-capture' | 'product'

export const OVERLAY_STATES = [
  'approval',
  'approval-blocked',
  'unknown',
  'investigate',
  'privacy',
  'gate',
  'palette',
  'palette-empty',
  'palette-denied',
  'toast',
] as const
export type OverlayState = (typeof OVERLAY_STATES)[number]

const VIEWS: readonly View[] = ['controls', 'overlays', 'composites', 'film-runtime', 'film-capture', 'product']

export interface Params {
  theme: Theme
  mode: Mode
  frame: number
  running: boolean
  reducedMotion: boolean
  view: View
  roleOpen: boolean
  overlay: OverlayState | null
}

export function parseParams(search: string): Params {
  const query = new URLSearchParams(search)
  const frame = Number(query.get('frame'))
  const view = VIEWS.find((value) => value === query.get('view')) ?? 'foundation'
  const open = query.get('open')
  return {
    theme: query.get('theme') === 'dark' ? 'dark' : 'light',
    mode: query.get('mode') === 'film' ? 'film' : 'app',
    frame: Number.isInteger(frame) && frame >= 0 ? frame : 0,
    running: query.get('running') === '1',
    reducedMotion: query.get('reduced') === '1',
    view,
    roleOpen: open === 'role',
    overlay: OVERLAY_STATES.find((value) => value === open) ?? null,
  }
}
