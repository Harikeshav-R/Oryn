import { useState } from 'react'
import sampleJson from '../../film/sample/runtime-check.timeline.json'
import { FilmClockProvider, FilmOverlays, parseTimeline, resolveFrame, validateTimeline } from '@/film'
import { frameToSeconds } from '@/lib/frame'
import { RuntimeCheckSurface } from './FilmSurfaces'
import type { Theme } from './params'
import { buttonClass } from './specimen'

/**
 * Development view of the film runtime (BOB-03c): `film/sample/runtime-check.timeline.json`
 * resolved at one frame. Every element is placed from the resolved anchor rectangles, so the
 * overlay layer and the mock surface share one geometry. State comes from `resolveFrame` only.
 */
const TIMELINE = parseTimeline(sampleJson)
const PROBLEMS = validateTimeline(TIMELINE)

export function FilmRuntime({ theme, onThemeChange, initialFrame, reducedMotion, chrome }: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  initialFrame: number
  reducedMotion: boolean
  /** Controls and readout outside the 1280x720 canvas; off in film mode. */
  chrome: boolean
}) {
  const last = TIMELINE.durationFrames - 1
  const [frame, setFrame] = useState(Math.min(initialFrame, last))
  const [reduced, setReduced] = useState(reducedMotion)
  const resolved = resolveFrame(TIMELINE, frame, { reducedMotion: reduced })

  return (
    <main>
      {chrome && (
        <header className="flex flex-wrap items-center gap-6 border-b px-6 py-3 type-data">
          <h1 className="type-card">Film runtime</h1>
          <label className="flex items-center gap-3">
            Frame
            <input type="range" min={0} max={last} value={frame} onChange={(event) => setFrame(Number(event.target.value))} className="w-72 accent-foreground" />
            <span data-frame-readout="" className="inline-block w-[14ch]">
              {frame} · {frameToSeconds(frame).toFixed(2)} s
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={reduced} onChange={(event) => setReduced(event.target.checked)} />
            Reduced motion
          </label>
          <div role="group" aria-label="Theme" className="flex gap-2">
            {(['light', 'dark'] as const).map((value) => (
              <button key={value} type="button" aria-pressed={theme === value} onClick={() => onThemeChange(value)} className={buttonClass}>
                {value === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
          {PROBLEMS.length > 0 && <span role="alert">{PROBLEMS.length} timeline problems</span>}
        </header>
      )}
      <FilmClockProvider frame={frame} reducedMotion={reduced}>
        <div data-film-canvas="" style={{ position: 'relative', width: 1280, height: 720, overflow: 'hidden', background: 'var(--background)', color: 'var(--foreground)' }}>
          <RuntimeCheckSurface resolved={resolved} />
          <FilmOverlays view={resolved.view} />
        </div>
      </FilmClockProvider>
      {chrome && (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 px-6 py-4 type-data" data-film-readout="">
          <dt>Phase</dt>
          <dd>{resolved.state.phase} · step {resolved.state.step}</dd>
          <dt>Deadline</dt>
          <dd>{resolved.state.commitment.due ?? 'none'} (confirmed {resolved.state.commitment.confirmedDue ?? 'none'})</dd>
          <dt>Selected case</dt>
          <dd>{resolved.state.selectedCase ?? 'none'}</dd>
          <dt>Pointer</dt>
          <dd>{resolved.view.cursor.phase}{resolved.view.cursor.x === null ? '' : ` at ${resolved.view.cursor.x.toFixed(1)}, ${(resolved.view.cursor.y ?? 0).toFixed(1)}`}</dd>
          <dt>Outlines</dt>
          <dd>{resolved.view.outlines.map((o) => `${o.kind}:${o.anchor}`).join(', ') || 'none'}</dd>
          <dt>Orbit</dt>
          <dd>{resolved.view.orbit.running ? 'running' : 'stopped'}</dd>
        </dl>
      )}
    </main>
  )
}
