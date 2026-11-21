import { StatusBadge } from '@/components/domain/status-badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CATEGORIES, SAFE_CASES, SCENARIOS, SUITE_ID, SUITE_SIZE, scenarioTitle } from '@/data/simulation'
import type { Scenario } from '@/data/simulation'
import { cn } from '@/lib/utils'
import { act } from './contract'
import type { ProductProps } from './contract'
import { FACTORY_HEADING } from './factory-layout'
import { anchored, at, within } from './geometry'
import { RowStream, TileGlyph, TileGrid } from './SimTiles'
import {
  CANCEL_BUTTON,
  CATEGORY_CHIPS,
  HEADING,
  PROGRESS,
  RUN_BUTTON,
  SAFE_HEADING,
  SAFE_LIST,
  SIMULATOR_ANCHORS,
  SIM_DETAIL,
  SIM_DETAIL_TITLE,
  SIM_HOST,
  STATUS,
  SUITE_LINE,
  VERSIONS,
  safeRow,
  simTile,
  versionChip,
} from './simulator-layout'
import { cancelBlock, glyphFrame, runAction, runBlock, simulatorAccess, simView, tileKind, tileLabel } from './simulator'
import type { SimView } from './simulator'
import { HiddenAnchors } from './settings-frame'

/**
 * SC19 Flight Simulator. Rendered inside the shell, in canvas coordinates from `simulator-layout.ts`.
 * A pure function of `{ state, film }`: the version, the run phase and every tile come from the
 * reducer's evaluations, so an idle suite shows no verdict, a running one shows only how far it has
 * got, a cancelled one stays incomplete and a finished one shows its own run's verdicts.
 *
 * The one run control starts the candidate version (the corrected v0.2 after a failed v0.1) through
 * the reducer's guarded action; its label is the cut's wording of that same action. Cyan appears only
 * while the run executes: the orbit in the status, the progress fill and the one running scenario.
 */

const flat = 'transition-none'
const chip = 'box-border inline-flex items-center justify-center rounded-sm border bg-surface px-2 type-data'

function StatusLine({ view, props }: { readonly view: SimView; readonly props: ProductProps }) {
  const frame = glyphFrame(props)
  return (
    <div {...anchored('sim-status', STATUS)} aria-live="polite" className="flex items-center gap-3 type-data">
      {view.phase === 'running' && (
        <>
          <StatusBadge status="running" running frame={frame} />
          <span>{`${view.executed} of ${SUITE_SIZE} scenarios run`}</span>
        </>
      )}
      {view.phase === 'idle' && <span>{`Not Run · 0 of ${SUITE_SIZE}`}</span>}
      {view.phase === 'cancelled' && <span>{`Cancelled · ${view.executed} of ${SUITE_SIZE} run · incomplete, the rest stay Not Run`}</span>}
      {view.phase === 'complete' && <span>{`Run complete · ${view.version} · ${SUITE_SIZE} of ${SUITE_SIZE} run`}</span>}
    </div>
  )
}

function Detail({ view, props }: { readonly view: SimView; readonly props: ProductProps }) {
  const { state } = props
  const selected = SCENARIOS.find((scenario) => scenario.id === state.selectedScenario)
  const index = selected ? SCENARIOS.indexOf(selected) : -1
  const kind = selected ? tileKind(view, index) : 'notRun'
  return (
    <div {...anchored('scenario-detail', SIM_DETAIL)} aria-live="polite" className="box-border rounded-sm border bg-surface p-3">
      {selected ? (
        <>
          <p className="type-data m-0">{`${selected.id} · ${scenarioTitle(selected)}`}</p>
          <p className="type-data m-0 mt-2">{view.phase === 'complete' ? tileLabel(kind) : 'No recorded verdict for this run'}</p>
          {view.phase === 'complete' && <p className="type-micro m-0 mt-1 text-muted-foreground">Select a tile to open its result.</p>}
        </>
      ) : (
        <p className="type-body m-0 text-muted-foreground">
          {view.phase === 'complete' ? 'Select a tile to open its result.' : 'Select a scenario. A verdict appears only after the run completes.'}
        </p>
      )}
    </div>
  )
}

export function SimulatorScreen(props: ProductProps) {
  const { state } = props
  const access = simulatorAccess(state)

  if (!access.ok) {
    return (
      <>
        <h1 className="type-title m-0" style={at(FACTORY_HEADING)}>
          Flight Simulator
        </h1>
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at({ x: 264, y: 176, width: 992, height: 88 })}>
          Not available: {access.reason}
        </p>
        <HiddenAnchors names={SIMULATOR_ANCHORS} />
      </>
    )
  }

  const view = simView(props)
  const sim = state.ui.simulator
  const running = view.phase === 'running'
  const runReason = runBlock(state)
  const cancelReason = cancelBlock(state)

  const onSelect = (scenario: Scenario) => {
    act(props, { type: 'SELECT_SCENARIO', scenarioId: scenario.id })
    // A completed run opens its result for the tile chosen; before that a tile only shows that nothing is recorded.
    if (view.phase === 'complete') act(props, { type: 'OPEN_SCREEN', screen: 'SC20' })
  }

  return (
    <>
      <h1 className="type-title m-0" style={at(HEADING)}>
        Flight Simulator
      </h1>
      <StatusLine view={view} props={props} />
      <p className="type-data m-0 flex items-center" style={at(SUITE_LINE)}>
        {`${SUITE_ID} · ${SUITE_SIZE} scenarios`}
      </p>
      <div {...anchored('sim-version', VERSIONS)} role="group" aria-label="Version the next run is bound to">
        {(['v0.1', 'v0.2'] as const).map((version, index) => (
          <span
            key={version}
            aria-current={version === view.version ? 'true' : undefined}
            style={at(within(VERSIONS, versionChip(index)))}
            className={cn(chip, version === view.version ? 'border-foreground' : 'text-muted-foreground')}
          >
            {version}
          </span>
        ))}
      </div>
      {CATEGORIES.map((category, index) => (
        <span key={category.id} style={at(CATEGORY_CHIPS[index] as NonNullable<(typeof CATEGORY_CHIPS)[number]>)} className={cn(chip, 'gap-2')}>
          {category.label}
          <span className="text-muted-foreground">{category.count}</span>
        </span>
      ))}

      <div {...anchored('sim-progress', PROGRESS)}>
        <Progress value={view.position} max={SUITE_SIZE} label={`${SUITE_ID} progress`} valueText={`${view.executed} of ${SUITE_SIZE} scenarios run`} executing={running} />
      </div>

      <Button
        variant="primary"
        {...anchored('run-scenarios', RUN_BUTTON)}
        className={flat}
        disabled={runReason !== null}
        disabledReason={runReason ?? undefined}
        aria-label={`${sim.runLabel}, ${view.version}`}
        onClick={() => act(props, runAction(state))}
      >
        {sim.runLabel}
      </Button>
      <Button
        variant="outline"
        {...anchored('cancel-run', CANCEL_BUTTON)}
        className={flat}
        disabled={cancelReason !== null}
        disabledReason={cancelReason ?? undefined}
        onClick={() => act(props, { type: 'CANCEL_SIMULATION' })}
      >
        Cancel
      </Button>

      <section {...anchored('scenario-grid', SIM_HOST)} aria-label={`${view.version} scenarios`} data-phase={view.phase} data-version={view.version} data-layout={sim.view}>
        {sim.view === 'grid' ? (
          <TileGrid props={props} view={view} tile={(index) => within(SIM_HOST, simTile(index))} onSelect={onSelect} />
        ) : (
          <RowStream props={props} view={view} rect={{ x: 0, y: 0, width: SIM_HOST.width, height: SIM_HOST.height }} onSelect={onSelect} />
        )}
      </section>

      <h2 className="type-card m-0" style={at(SIM_DETAIL_TITLE)}>
        Scenario detail
      </h2>
      <Detail view={view} props={props} />

      <h2 className="type-card m-0" style={at(SAFE_HEADING)}>
        Expected safe escalations
      </h2>
      <ul {...anchored('safe-cases', SAFE_LIST)} aria-label="Expected safe escalations, each an intended pass" className="m-0 list-none p-0">
        {SAFE_CASES.map((item, row) => {
          const index = SCENARIOS.findIndex((scenario) => scenario.id === item.id)
          const kind = tileKind(view, index)
          return (
            <li key={item.id} className="m-0 p-0">
              <button
                type="button"
                {...anchored(`safe-case-${item.id.toLowerCase()}`, within(SAFE_LIST, safeRow(row)))}
                aria-pressed={state.selectedScenario === item.id}
                onClick={() => act(props, { type: 'SELECT_SCENARIO', scenarioId: item.id })}
                className={cn('box-border flex items-center gap-3 border-b bg-surface px-3 text-left hover:bg-surface-2', flat, 'outline-none focus-visible:ring-2 focus-visible:ring-ring')}
              >
                <TileGlyph kind={kind} frame={glyphFrame(props)} />
                <span className="min-w-0 flex-1">
                  <span className="type-body block truncate">{item.label}</span>
                  <span className="type-micro block truncate text-muted-foreground">{`${item.id} · ${tileLabel(kind)}`}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
