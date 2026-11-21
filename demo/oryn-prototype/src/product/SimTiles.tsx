import { StatusGlyph } from '@/components/domain/status-glyphs'
import { SCENARIOS, scenarioTitle } from '@/data/simulation'
import type { Scenario } from '@/data/simulation'
import { cn } from '@/lib/utils'
import type { Rect } from '@/film'
import { motionProgress } from './contract'
import type { ProductProps } from './contract'
import { filmAnchor } from './contract'
import { at } from './geometry'
import { glyphFrame, streamOffset, tileKind, tileLabel } from './simulator'
import { STREAM_ROW } from './simulator-layout'
import type { SimView, TileKind } from './simulator'

/**
 * CMP-17 tiles and the film row stream (GAP-SC-L-07), drawn from one `SimView`. The same 28 scenarios
 * in the same order in both layouts: the stream is a layout, never a second data set. A tile's glyph
 * and its text are separate channels; hue is on the glyph only, and the only cyan is the one running
 * scenario of a running evaluation.
 */

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** The glyph of a tile or row: a verdict, the running orbit, a neutral dot for an executed scenario or a hollow circle for one not run. */
export function TileGlyph({ kind, frame }: { readonly kind: TileKind; readonly frame: number }) {
  if (kind === 'passed' || kind === 'safeEscalation') return <span className="text-success"><StatusGlyph status={kind} /></span>
  if (kind === 'failed') return <span className="text-danger"><StatusGlyph status="failed" /></span>
  if (kind === 'running') return <span className="text-trace"><StatusGlyph status="running" frame={frame} running /></span>
  if (kind === 'executed') return <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-foreground" />
  return <span aria-hidden="true" className="size-3 shrink-0 rounded-full border border-signal" />
}

const accessibleName = (scenario: Scenario, kind: TileKind): string => `${scenario.id}, ${scenarioTitle(scenario)}, ${tileLabel(kind)}`

export interface TileGridProps {
  readonly props: ProductProps
  readonly view: SimView
  readonly tile: (index: number) => Rect
  /** SCN-022's tile carries this film anchor (the SC20 grid). */
  readonly failedAnchor?: boolean
  readonly onSelect: (scenario: Scenario) => void
}

/** Selected tile: a 2 px ink outline that fades in over 150 ms from the selection. */
function outlineOf(props: ProductProps): string {
  const fade = motionProgress(props.film, 'SELECT_SCENARIO')
  return `2px solid color-mix(in srgb, var(--foreground) ${(fade * 100).toFixed(1)}%, transparent)`
}

export function TileGrid({ props, view, tile, failedAnchor = false, onSelect }: TileGridProps) {
  const selected = props.state.selectedScenario
  const frame = glyphFrame(props)
  return (
    <>
      {SCENARIOS.map((scenario, index) => {
        const kind = tileKind(view, index)
        const isSelected = scenario.id === selected
        return (
          <button
            key={scenario.id}
            type="button"
            data-scenario={scenario.id}
            data-state={kind}
            aria-label={accessibleName(scenario, kind)}
            aria-pressed={isSelected}
            {...(failedAnchor && scenario.id === 'SCN-022' ? filmAnchor('failed-scenario') : {})}
            onClick={() => onSelect(scenario)}
            style={{ ...at(tile(index)), outline: isSelected ? outlineOf(props) : undefined, outlineOffset: 0 }}
            className={cn('box-border flex items-center justify-center gap-2 rounded-sm border bg-surface text-foreground hover:bg-surface-2 transition-none', focusRing)}
          >
            <TileGlyph kind={kind} frame={frame} />
            <span className="type-data">{scenario.id}</span>
          </button>
        )
      })}
    </>
  )
}

export function RowStream({ props, view, rect, onSelect }: { readonly props: ProductProps; readonly view: SimView; readonly rect: Rect; readonly onSelect: (scenario: Scenario) => void }) {
  const selected = props.state.selectedScenario
  const frame = glyphFrame(props)
  const offset = props.film && view.phase === 'running'
    ? Math.min(120, (props.film.frame / 27) * 120)
    : streamOffset(view, rect.height)
  return (
    <div className="overflow-hidden" style={at(rect)}>
      <ol aria-label="28 scenarios" className="m-0 list-none p-0" style={{ transform: `translateY(${-offset}px)` }}>
        {SCENARIOS.map((scenario, index) => {
          const kind = tileKind(view, index)
          const isSelected = scenario.id === selected
          return (
            <li key={scenario.id} style={{ height: STREAM_ROW }} data-scenario={scenario.id} data-state={kind} className="m-0 p-0">
              <button
                type="button"
                aria-label={accessibleName(scenario, kind)}
                aria-pressed={isSelected}
                onClick={() => onSelect(scenario)}
                style={{ outline: isSelected ? outlineOf(props) : undefined, outlineOffset: -2 }}
                className={cn('box-border flex h-full w-full items-center gap-3 border-b bg-surface px-3 text-left hover:bg-surface-2 transition-none', focusRing)}
              >
                <TileGlyph kind={kind} frame={frame} />
                <span className="type-data w-16 shrink-0">{scenario.id}</span>
                <span className="type-data min-w-0 flex-1 truncate">{scenarioTitle(scenario)}</span>
                <span className="type-micro shrink-0 text-muted-foreground">{tileLabel(kind)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
