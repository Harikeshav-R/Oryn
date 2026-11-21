import type { CSSProperties } from 'react'
import { ringInk } from './cursor'
import { FILM_VIEWPORT } from './motion'
import type { CursorView, FrameView, OutlineView, Rect, TypedView } from './types'

/**
 * FRT-01 / FRT-02 / FRT-03 renderers. Each is a pure function of a resolved frame: no state,
 * timer, transition or animation. Everything uses neutral ink (`--signal`, `--foreground`); the
 * execution cyan never appears here. Outlines sit at z20-30 under the pointer at z70, and the
 * layer never takes a click.
 */

const boxStyle = (rect: Rect): CSSProperties => ({ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height, boxSizing: 'border-box' })

function Outline({ outline }: { outline: OutlineView }) {
  const stroke = `${outline.width}px solid var(--signal)`
  return (
    <div data-film-outline={outline.kind} data-anchor={outline.anchor} style={{ position: 'absolute', inset: 0, opacity: outline.alpha, zIndex: outline.kind === 'hover' ? 20 : 30 }}>
      <div style={{ ...boxStyle(outline.box), border: stroke, borderRadius: outline.radius + outline.width }} />
      {outline.ring && <div style={{ ...boxStyle(outline.ring), border: stroke, borderRadius: outline.radius + outline.width * 3 }} />}
      {outline.handle && <div style={{ ...boxStyle(outline.handle), background: 'var(--signal)' }} />}
    </div>
  )
}

/** 20x24 black arrow with a 1 px white outline; the hot spot is the upper-left tip at the element origin. */
function Arrow({ cursor }: { cursor: CursorView }) {
  return (
    <svg
      data-film-cursor={cursor.phase}
      width={20}
      height={24}
      viewBox="0 0 20 24"
      style={{ position: 'absolute', left: cursor.x ?? 0, top: cursor.y ?? 0, overflow: 'visible', zIndex: 70, transform: `scale(${cursor.pressScale})`, transformOrigin: '0 0' }}
    >
      <path d="M0 0 V17.5 L4.4 13.6 L7.4 20.6 L10.4 19.3 L7.5 12.4 L13.6 12.4 Z" fill="#000" stroke="#fff" strokeWidth={2} strokeLinejoin="round" paintOrder="stroke" />
    </svg>
  )
}

function Ring({ cursor }: { cursor: CursorView }) {
  if (!cursor.ring || cursor.x === null || cursor.y === null) return null
  const { radius, alpha, progress } = cursor.ring
  return (
    <div
      data-film-ring={progress.toFixed(3)}
      style={{
        position: 'absolute',
        left: cursor.x - radius,
        top: cursor.y - radius,
        width: radius * 2,
        height: radius * 2,
        boxSizing: 'border-box',
        borderRadius: '50%',
        border: `1.5px solid ${ringInk(alpha)}`,
        zIndex: 70,
      }}
    />
  )
}

/** The film overlay layer over the 1280x720 product canvas. */
export function FilmOverlays({ view }: { view: FrameView }) {
  return (
    <div
      aria-hidden="true"
      data-film-overlay=""
      style={{ position: 'absolute', left: 0, top: 0, width: FILM_VIEWPORT.width, height: FILM_VIEWPORT.height, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {view.outlines.map((outline) => (
        <Outline key={`${outline.kind}:${outline.anchor}`} outline={outline} />
      ))}
      {view.cursor.visible && (
        <>
          <Ring cursor={view.cursor} />
          <Arrow cursor={view.cursor} />
        </>
      )}
    </div>
  )
}

/** Field text with a selection highlight or a 2 px ink caret. The caret follows the text advance inline. */
export function FilmTypedText({ typed }: { typed: TypedView }) {
  return (
    <span data-film-typed={typed.target} data-complete={typed.complete ? 'true' : 'false'}>
      <span style={typed.selected ? { background: 'color-mix(in srgb, var(--foreground) 18%, transparent)' } : undefined}>{typed.text}</span>
      {typed.caret && <span data-film-caret="" style={{ display: 'inline-block', width: 2, height: '1.15em', marginLeft: 1, verticalAlign: 'text-bottom', background: 'var(--foreground)' }} />}
    </span>
  )
}
