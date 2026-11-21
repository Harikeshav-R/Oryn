import { StatusBadge } from '@/components/domain/status-badge'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { STATUS_META } from '@/data/status'
import {
  SCENARIOS,
  SUITE_ID,
  SUITE_SIZE,
  sampleRun,
  suiteTotals,
  type RunPhase,
  verdictOf,
  type RunEvent,
  type SuiteVersion,
} from '@/data/simulation'

/**
 * CMP-14 simulation progress for SIM-AP-RECON (anchor `simulation-progress`).
 *
 * Everything on it is a pure function of the run events and the film frame (`sampleRun`),
 * so a seek lands on the same pixels forward or backward and no timer exists. Arc cyan
 * (bar fill, running badge, orbit node) is on only while `running`; a complete or
 * cancelled run is neutral.
 *
 * Verdicts come from DAT-05 and appear only after a complete event. While running, and
 * after a cancel, executed scenarios read "Executed" and the rest read "Not Run": an
 * unfinished scenario is never a pass, and a full bar is not business verification.
 * `loading` swaps rows for static skeletons with the same geometry (28px rows).
 */
const ROW = 'flex h-7 items-center gap-3 border-b px-3 last:border-b-0'

function suiteBadge(phase: RunPhase, frame: number) {
  switch (phase) {
    case 'running':
      return <StatusBadge status="running" running frame={frame} />
    case 'complete':
      return <Badge variant="outline">Run complete</Badge>
    case 'cancelled':
      return <Badge variant="outline">Cancelled</Badge>
    case 'notStarted':
      return <Badge variant="outline">Not Run</Badge>
  }
}

export function SimulationProgress({
  events,
  frame,
  version,
  loading = false,
}: {
  events: readonly RunEvent[]
  frame: number
  version: SuiteVersion
  loading?: boolean
}) {
  const run = sampleRun(events, frame)
  const totals = suiteTotals(version)
  const complete = run.phase === 'complete'

  return (
    <section
      aria-labelledby="sim-title"
      data-anchor="simulation-progress"
      data-run-phase={run.phase}
      data-running={run.running ? 'true' : 'false'}
      className="rounded-lg border bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 id="sim-title" className="type-card">
          {SUITE_ID} &middot; {SUITE_SIZE} scenarios
        </h3>
        {suiteBadge(run.phase, frame)}
      </div>

      <div className="mt-3">
        <Progress
          value={run.executed}
          max={SUITE_SIZE}
          label={`${SUITE_ID} progress`}
          valueText={`${run.executed} of ${SUITE_SIZE} scenarios run`}
          executing={run.running}
        />
      </div>
      <p className="mt-2 type-data" data-run-caption="">
        {run.phase === 'notStarted' && `Not Run \u00b7 0 of ${SUITE_SIZE}`}
        {run.phase === 'running' && `Running \u00b7 ${run.executed} of ${SUITE_SIZE}`}
        {run.phase === 'cancelled' &&
          `Cancelled \u00b7 ${run.executed} of ${SUITE_SIZE} run. Incomplete: the rest stay Not Run.`}
        {complete &&
          `${STATUS_META.passed.label} ${totals.passed} \u00b7 ${STATUS_META.safeEscalation.label} ${totals.safeEscalation} \u00b7 ${STATUS_META.failed.label} ${totals.failed} (${version})`}
      </p>

      <div className="mt-3 rounded-sm border">
        {loading ? (
          <div role="status" aria-label="Loading scenarios" data-skeleton-rows="" className="h-[224px] overflow-hidden">
            <span className="sr-only">Loading scenarios</span>
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className={ROW}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea label="Scenarios" className="h-[224px]">
            <ul>
              {SCENARIOS.map((scenario, index) => {
                const verdict = verdictOf(scenario, version)
                return (
                  <li key={scenario.id} className={ROW} data-scenario={scenario.id}>
                    <span className="w-16 shrink-0 type-data text-muted-foreground">{scenario.id}</span>
                    <span className="min-w-0 flex-1 truncate type-data" title={scenario.name}>
                      {scenario.name}
                    </span>
                    {complete ? (
                      <StatusBadge status={verdict} />
                    ) : run.running && index === run.executed ? (
                      <StatusBadge status="running" running frame={frame} />
                    ) : index < run.executed ? (
                      <Badge variant="outline">Executed</Badge>
                    ) : (
                      <Badge variant="outline">Not Run</Badge>
                    )}
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </div>
    </section>
  )
}
