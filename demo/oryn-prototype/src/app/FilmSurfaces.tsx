import type { CSSProperties, ReactNode } from 'react'
import { OrbitNode } from '@/components/domain/orbit'
import { FilmTypedText } from '@/film'
import type { Rect, ResolvedFrame, TypedView } from '@/film'

/**
 * Surfaces the film can capture. A surface is a pure function of a resolved frame: the same
 * `resolveFrame` reducer drives the clickable app and the capture. Each anchored element carries
 * `data-film-anchor="<name>"` so the capture script can compare its DOM rectangle with the
 * sidecar rectangle. Registry keys are `<cut>/<clip-id>`; a clip with no entry cannot be captured.
 */
export type FilmSurface = (props: { resolved: ResolvedFrame }) => ReactNode

const place = (rect: Rect | null | undefined): CSSProperties =>
  rect ? { position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height } : { position: 'absolute', display: 'none' }

const field: CSSProperties = { display: 'flex', alignItems: 'center', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', whiteSpace: 'nowrap', overflow: 'hidden' }

function TypedField({ typed, fallback }: { typed: TypedView | undefined; fallback: ReactNode }) {
  return typed ? <FilmTypedText typed={typed} /> : <>{fallback}</>
}

/**
 * Fixture-backed runtime check (BOB-03c/BOB-03d): the reducer's `startAt: ST03` commitment, the
 * sample timeline's six anchors and nothing else. It is a runtime fixture, not a product screen.
 */
export const RuntimeCheckSurface: FilmSurface = ({ resolved }) => {
  const { view, state } = resolved
  const anchors = view.anchors
  const text: CSSProperties = { fontSize: 14 * view.camera.zoom, lineHeight: 1.4, fontFamily: 'var(--font-mono)' }
  const pressed = view.cursor.target === 'confirm-button' ? view.cursor.pressScale : 1
  return (
    <>
      <div data-film-anchor="invoice-number" style={{ ...place(anchors['invoice-number']?.rect), ...text }}>INV-48219</div>
      <div data-film-anchor="invoice-amount" style={{ ...place(anchors['invoice-amount']?.rect), ...text }}>$18,420.00</div>
      <div data-film-anchor="deadline-field" style={{ ...place(anchors['deadline-field']?.rect), ...field, ...text }}>
        <TypedField typed={view.texts['deadline-field']} fallback={state.commitment.due} />
      </div>
      <div data-film-anchor="confirm-button" style={place(anchors['confirm-button']?.rect)}>
        <button
          type="button"
          tabIndex={-1}
          style={{ width: '100%', height: '100%', ...text, border: '1px solid var(--foreground)', borderRadius: 4, background: 'var(--foreground)', color: 'var(--background)', transform: `scale(${pressed})` }}
        >
          Confirm
        </button>
      </div>
      <div data-film-anchor="intent-field" style={{ ...place(anchors['intent-field']?.rect), ...field, ...text }}>
        <TypedField typed={view.texts['intent-field']} fallback={null} />
      </div>
      <div data-film-anchor="url-pill" style={{ ...place(anchors['url-pill']?.rect), ...field, ...text, borderRadius: 20 }}>
        <TypedField typed={view.texts['url-pill']} fallback={null} />
      </div>
      <div style={{ position: 'absolute', right: 24, top: 24 }} data-orbit-frame={view.orbit.frame}>
        <OrbitNode frame={view.orbit.frame} running={view.orbit.running} size={24} decorative />
      </div>
    </>
  )
}
