import { useState } from 'react'
import { StatusGlyph } from '@/components/domain/status-glyphs'
import { SCENARIOS, sampleRun, verdictOf, type RunEvent, type Scenario, type SuiteVersion } from '@/data/simulation'
import { STATUS_META } from '@/data/status'
import { cn } from '@/lib/utils'

type TileState = 'notRun' | 'executed' | 'running' | 'passed' | 'safeEscalation' | 'failed'

export interface ScenarioGridProps {
  events: readonly RunEvent[]
  frame: number
  version: SuiteVersion
  /** Set to a scenario ID or null to control selection for a film frame. */
  selectedScenarioId?: string | null
  onSelectScenario?: (scenario: Scenario) => void
  /** Disable selection transitions during deterministic capture. */
  film?: boolean
}

function stateLabel(state: TileState): string {
  if (state === 'notRun') return 'Not Run'
  if (state === 'executed') return 'Executed'
  return STATUS_META[state].label
}

function scenarioName(scenario: Scenario): string {
  return scenario.id === 'SCN-022'
    ? `variance_exactly_2.00pct — ${scenario.name}`
    : scenario.name
}

/** CMP-17: the sealed suite and its selected, independently inspectable result. */
export function ScenarioGrid({
  events,
  frame,
  version,
  selectedScenarioId,
  onSelectScenario,
  film = false,
}: ScenarioGridProps) {
  const [localSelection, setLocalSelection] = useState<string | null>(null)
  const selectedId = selectedScenarioId === undefined ? localSelection : selectedScenarioId
  const run = sampleRun(events, frame)
  const selected = SCENARIOS.find((scenario) => scenario.id === selectedId)
  const complete = run.phase === 'complete'

  function selectScenario(scenario: Scenario) {
    if (selectedScenarioId === undefined) setLocalSelection(scenario.id)
    onSelectScenario?.(scenario)
  }

  return (
    <section data-anchor="scenario-grid" data-run-phase={run.phase} data-version={version} aria-label={`${version} scenario results`}>
      <div className="max-w-full overflow-x-auto">
        <div className="flex h-[416px] w-[472px] items-center justify-center">
          <div className="grid grid-cols-[repeat(4,96px)] gap-2" aria-label="28 scenarios">
            {SCENARIOS.map((scenario, index) => {
              const state: TileState = complete
                ? verdictOf(scenario, version)
                : run.running && index === run.executed
                  ? 'running'
                  : index < run.executed
                    ? 'executed'
                    : 'notRun'
              const isSelected = scenario.id === selectedId
              const status = state === 'passed' || state === 'safeEscalation' || state === 'failed' || state === 'running'
                ? state
                : null
              return (
                <button
                  key={scenario.id}
                  type="button"
                  data-scenario={scenario.id}
                  data-state={state}
                  aria-label={`${scenario.id}, ${scenarioName(scenario)}, ${stateLabel(state)}`}
                  aria-pressed={isSelected}
                  onClick={() => selectScenario(scenario)}
                  className={cn(
                    'flex h-[52px] w-24 items-center justify-center gap-1 rounded-sm border bg-surface text-foreground outline-offset-0 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground',
                    !film && 'transition-[outline-color] duration-150 motion-reduce:transition-none',
                    isSelected && 'outline outline-2 outline-foreground',
                  )}
                >
                  {status ? (
                    <span className={cn(status === 'failed' ? 'text-danger' : status === 'running' ? 'text-trace' : 'text-success')}>
                      <StatusGlyph status={status} frame={frame} running={run.running} />
                    </span>
                  ) : (
                    <span aria-hidden="true" className="size-3 shrink-0 rounded-full border border-signal" />
                  )}
                  <span className="type-data">{scenario.id}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {selected && (
        <div data-anchor="scenario-replay" className="mt-3 max-w-[472px] rounded-sm border bg-surface p-3" aria-live="polite">
          <p className="type-data">{selected.id} · {scenarioName(selected)}</p>
          <p className="mt-1 type-data">
            {complete ? STATUS_META[verdictOf(selected, version)].label : 'No recorded verdict for this run'}
          </p>
          {complete && selected.id === 'SCN-022' && (
            <div className="mt-2 grid grid-cols-2 gap-3 type-data">
              <p>Expected: accept</p>
              <p>Actual: {version === 'v0.1' ? 'escalate' : 'accept'}</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
