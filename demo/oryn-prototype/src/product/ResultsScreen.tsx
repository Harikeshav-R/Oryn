import { GitCompareArrows, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { StatusGlyph } from '@/components/domain/status-glyphs'
import type { Rect } from '@/film'
import { Button } from '@/components/ui/button'
import { BOUNDARY_REPLAY, COMPARATORS, SAFE_CASES, SUITE_ID, SUITE_SIZE, scenarioTitle, verdictOf } from '@/data/simulation'
import type { Scenario, SuiteVersion } from '@/data/simulation'
import { STATUS_META } from '@/data/status'
import { cn } from '@/lib/utils'
import { act } from './contract'
import type { ProductProps } from './contract'
import { refusal } from './discovery'
import { EvidenceDrawer } from './EvidenceDrawer'
import { anchored, at, within } from './geometry'
import { HiddenAnchors } from './settings-frame'
import { TileGlyph, TileGrid } from './SimTiles'
import {
  COMPARE,
  COMPARE_BUTTON,
  COMPARE_COLUMN,
  COMPARE_ROWS,
  HEADING,
  RESULT_ANCHORS,
  RESULT_DETAIL,
  RESULT_SUMMARY,
  RESULTS,
  RERUN_BUTTON,
  RES_HOST,
  SAFE_RESULTS,
  SAFE_RESULTS_HEADING,
  STATUS,
  SUITE_LINE,
  VERSIONS,
  resTile,
  resultTile,
  safeResultRow,
  versionChip,
} from './simulator-layout'
import { glyphFrame, replayOf, resultView, scenarioById, simulatorAccess, versionResult } from './simulator'
import type { ResultView, SimView } from './simulator'

/**
 * SC20 results, replay, correction and comparison. Rendered inside the shell, in canvas coordinates
 * from `simulator-layout.ts`. A pure function of `{ state, film }`: every count is that run's own
 * verdicts, so the totals always sum to 28, an expected safe escalation is counted as a pass of its
 * own kind and never as a failure, and the corrected run never rewrites v0.1: the comparison reads
 * the two completed runs independently. No cyan: nothing here executes.
 */

const flat = 'transition-none'
const chip = 'box-border inline-flex items-center justify-center rounded-sm border bg-surface px-2 type-data'
const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

const verdictText = (version: SuiteVersion, scenario: Scenario): string => STATUS_META[verdictOf(scenario, version)].label

const completeView = (result: ResultView): SimView => ({ phase: 'complete', version: result.version, executed: SUITE_SIZE, position: SUITE_SIZE })

function ResultTile({ rect, kind, count, label, quiet = false }: { readonly rect: Rect; readonly kind: 'passed' | 'safeEscalation' | 'failed'; readonly count: number; readonly label: string; readonly quiet?: boolean }) {
  return (
    <div style={at(rect)} className="box-border flex flex-col justify-between rounded-sm border bg-surface p-3">
      <span className={cn(quiet ? 'text-muted-foreground' : kind === 'failed' ? 'text-danger' : 'text-success')}>
        <StatusGlyph status={kind} />
      </span>
      <p className="type-data m-0 font-semibold">{`${count} ${label}`}</p>
    </div>
  )
}

function Cells({ left, right, divider = true }: { readonly left: ReactNode; readonly right: ReactNode; readonly divider?: boolean }) {
  return (
    <div className="flex h-full w-full">
      <div className={cn('flex min-w-0 flex-col justify-center px-3', divider && 'border-r')} style={{ width: COMPARE_COLUMN.left + COMPARE_COLUMN.divider }}>
        {left}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3">{right}</div>
    </div>
  )
}

/** Both evaluations side by side. A version never evaluated shows `Not Run`: the proposed correction is not a result. */
function Comparison({ state, visible }: { readonly state: ProductProps['state']; readonly visible: boolean }) {
  const before = versionResult(state, 'v0.1')
  const after = versionResult(state, 'v0.2')
  const boundary = scenarioById(BOUNDARY_REPLAY.scenarioId) as Scenario
  const row = (rect: Rect, extra?: string) => ({ style: at(rect), className: cn('box-border border-b', extra) })
  const count = (result: ResultView | undefined, pick: (view: ResultView) => string) => (result ? pick(result) : 'Not Run')
  return (
    <section {...anchored('version-compare', COMPARE, visible)} aria-label="Version comparison" data-view={after ? 'evaluated' : 'proposed'} className="box-border rounded-sm border bg-surface">
      <div style={{ position: 'absolute', left: -1, top: -1, width: COMPARE.width, height: COMPARE.height }}>
        <div {...row(COMPARE_ROWS.header)}>
          <Cells
            left={<span className="type-data font-semibold">{`v0.1 · ${before && before.failed > 0 ? 'Failed evaluation' : 'Passed evaluation'}`}</span>}
            right={<span className="type-data font-semibold">{after ? `v0.2 · ${after.failed > 0 ? 'Failed evaluation' : 'Passed evaluation'}` : 'v0.2 · Proposed correction'}</span>}
          />
        </div>
        <div {...row(COMPARE_ROWS.passed)}>
          <Cells left={<span className="type-data">{count(before, (r) => `${r.passed} Passed`)}</span>} right={<span className="type-data">{count(after, (r) => `${r.passed} Passed`)}</span>} />
        </div>
        <div {...row(COMPARE_ROWS.safe)}>
          <Cells
            left={<span className="type-micro">{count(before, (r) => `${r.safeEscalation} Passed — Expected Safe Escalation`)}</span>}
            right={<span className="type-micro">{count(after, (r) => `${r.safeEscalation} Passed — Expected Safe Escalation`)}</span>}
          />
        </div>
        <div {...row(COMPARE_ROWS.failed)}>
          <Cells left={<span className="type-data">{count(before, (r) => `${r.failed} Failed`)}</span>} right={<span className="type-data">{count(after, (r) => `${r.failed} Failed`)}</span>} />
        </div>
        <div {...row(COMPARE_ROWS.intended)}>
          <Cells
            left={<span className="type-data">{count(before, (r) => `${r.correct}/${SUITE_SIZE} intended outcomes correct`)}</span>}
            right={<span className="type-data">{count(after, (r) => `${r.correct}/${SUITE_SIZE} intended outcomes correct`)}</span>}
          />
        </div>
        <div {...anchored('equality-row', COMPARE_ROWS.equality, visible)} className="box-border border-b" data-verdicts={`${before ? verdictOf(boundary, 'v0.1') : 'notRun'}/${after ? verdictOf(boundary, 'v0.2') : 'notRun'}`}>
          <Cells
            left={
              <>
                <span className="type-data">{BOUNDARY_REPLAY.key}</span>
                <span className="type-micro text-muted-foreground">{before ? `${verdictText('v0.1', boundary)} · Expected: ${replayOf('v0.1').expected} · Actual: ${replayOf('v0.1').actual}` : 'Not Run'}</span>
              </>
            }
            right={
              <>
                <span className="type-data">{BOUNDARY_REPLAY.key}</span>
                <span className="type-micro text-muted-foreground">{after ? `${verdictText('v0.2', boundary)} · Expected: ${replayOf('v0.2').expected} · Actual: ${replayOf('v0.2').actual}` : 'Not Run · proposed, not yet evaluated'}</span>
              </>
            }
          />
        </div>
        <div {...row(COMPARE_ROWS.comparator)}>
          <Cells left={<span className="type-data">{COMPARATORS['v0.1']}</span>} right={<span className="type-data">{COMPARATORS['v0.2']}</span>} />
        </div>
        <p className="type-micro m-0 flex items-center px-3 text-muted-foreground" style={at(COMPARE_ROWS.note)}>
          Both evaluations are immutable: v0.1 stays as recorded and v0.2 is evaluated on its own, over the same 28 scenarios.
        </p>
      </div>
    </section>
  )
}

export function ResultsScreen(props: ProductProps) {
  const { state } = props
  const access = simulatorAccess(state)
  const result = resultView(state)

  if (!access.ok || !result) {
    return (
      <>
        <h1 className="type-title m-0" style={at(HEADING)}>
          Evaluation results
        </h1>
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at({ x: 264, y: 176, width: 992, height: 88 })}>
          {access.ok ? 'There is no completed evaluation to show yet.' : `Not available: ${access.reason}`}
        </p>
        <HiddenAnchors names={RESULT_ANCHORS.filter((name) => name !== 'replay' && name !== 'replay-rule-link' && name !== 'rule-drawer' && name !== 'drawer-close')} />
        <EvidenceDrawer {...props} />
      </>
    )
  }

  const compare = state.ui.simulator.compare
  const view = completeView(result)
  const selected = scenarioById(state.selectedScenario)
  const failing = result.failed > 0 ? scenarioById(BOUNDARY_REPLAY.scenarioId) : undefined
  const shown = selected ?? failing
  const rerunReason = refusal(state, { type: 'FIX_AND_RUN' })

  const onSelect = (scenario: Scenario) => {
    act(props, { type: 'SELECT_SCENARIO', scenarioId: scenario.id })
    if (scenario.id === BOUNDARY_REPLAY.scenarioId) act(props, { type: 'OPEN_DRAWER', drawer: 'replay' })
  }

  const detail = shown ? replayOf(result.version) : undefined
  const frame = glyphFrame(props)

  return (
    <>
      <h1 className="type-title m-0" style={at(HEADING)}>
        Evaluation results
      </h1>
      <p className="type-data m-0 flex items-center" style={at(STATUS)}>{`${result.version} · Run complete · ${SUITE_SIZE} of ${SUITE_SIZE} run`}</p>
      <p className="type-data m-0 flex items-center" style={at(SUITE_LINE)}>
        {`${SUITE_ID} · ${SUITE_SIZE} scenarios`}
      </p>
      <div style={at(VERSIONS)} role="group" aria-label="Version shown">
        {(['v0.1', 'v0.2'] as const).map((version, index) => (
          <span key={version} aria-current={version === result.version ? 'true' : undefined} style={at(within(VERSIONS, versionChip(index)))} className={cn(chip, version === result.version ? 'border-foreground' : 'text-muted-foreground')}>
            {version}
          </span>
        ))}
      </div>

      <section style={at(RES_HOST)} aria-label={`${result.version} scenario results`} data-version={result.version}>
        <TileGrid props={props} view={view} tile={(index) => within(RES_HOST, resTile(index))} failedAnchor onSelect={onSelect} />
      </section>
      {state.ui.discovery.drawer === 'AP-RULE-009' && selected?.id === BOUNDARY_REPLAY.scenarioId && (
        <section data-replay-overlay="true" aria-label="Selected scenario replay" className="box-border rounded-sm border bg-surface p-4 shadow-lg" style={{ ...at({ x: 280, y: 220, width: 480, height: 112 }), zIndex: 41 }}>
          <p className="type-data m-0 flex items-center gap-2"><TileGlyph kind={verdictOf(selected, result.version)} frame={frame} />{`${selected.id} · ${BOUNDARY_REPLAY.key}`}</p>
          <p className="type-data m-0 mt-4">{`Expected: ${detail?.expected}`}</p>
          <p className="type-data m-0 mt-2">{`Actual: ${detail?.actual}`}</p>
        </section>
      )}

      <section {...anchored('results', RESULTS, !compare)} aria-label={`${result.version} results`} data-version={result.version}>
        <ResultTile rect={within(RESULTS, resultTile(0))} kind="passed" count={result.passed} label="Passed" />
        <ResultTile rect={within(RESULTS, resultTile(1))} kind="safeEscalation" count={result.safeEscalation} label="Passed — Expected Safe Escalation" />
        <ResultTile rect={within(RESULTS, resultTile(2))} kind="failed" count={result.failed} label="Failed" quiet={result.failed === 0} />
        <p className="type-data m-0 flex items-center" style={at(within(RESULTS, RESULT_SUMMARY))}>
          {`${result.correct}/${SUITE_SIZE} intended outcomes correct`}
        </p>
      </section>

      <div {...anchored('result-detail', RESULT_DETAIL, !compare)} aria-live="polite" className="box-border flex items-center justify-between gap-3 rounded-sm border bg-surface px-3">
        {shown && detail ? (
          <>
            <div className="min-w-0">
              <p className="type-data m-0 truncate">{`${shown.id} · ${scenarioTitle(shown)}`}</p>
              <p className="type-micro m-0 truncate text-muted-foreground">
                {shown.id === BOUNDARY_REPLAY.scenarioId
                  ? `${verdictText(result.version, shown)} · Expected: ${detail.expected} · Actual: ${detail.actual}`
                  : verdictText(result.version, shown)}
              </p>
            </div>
            {shown.id === BOUNDARY_REPLAY.scenarioId && (
              <Button
                variant="outline"
                size="sm"
                className={flat}
                onClick={() => {
                  act(props, { type: 'SELECT_SCENARIO', scenarioId: shown.id })
                  act(props, { type: 'OPEN_DRAWER', drawer: 'replay' })
                }}
              >
                Replay
              </Button>
            )}
          </>
        ) : (
          <p className="type-body m-0 text-muted-foreground">No failed scenarios. Select a tile or a safe escalation to inspect it.</p>
        )}
      </div>

      <h2 className="type-card m-0" style={{ ...at(SAFE_RESULTS_HEADING), display: compare ? 'none' : undefined }}>
        Expected safe escalations
      </h2>
      <ul {...anchored('safe-results', SAFE_RESULTS, !compare)} aria-label="Expected safe escalations, each an intended pass" className="m-0 list-none p-0">
        {SAFE_CASES.map((item, row) => (
          <li key={item.id} className="m-0 p-0">
            <button
              type="button"
              data-film-anchor={`safe-result-${item.id.toLowerCase()}`}
              aria-pressed={state.selectedScenario === item.id}
              aria-label={`${item.id}, ${item.label}, ${STATUS_META.safeEscalation.label}`}
              onClick={() => act(props, { type: 'SELECT_SCENARIO', scenarioId: item.id })}
              style={{ ...anchored(`safe-result-${item.id.toLowerCase()}`, within(SAFE_RESULTS, safeResultRow(row)), !compare).style, outline: state.selectedScenario === item.id ? '2px solid var(--foreground)' : undefined, outlineOffset: -2 }}
              className={cn('box-border flex items-center gap-1.5 border-b bg-surface px-1.5 text-left hover:bg-surface-2', flat, focusRing)}
            >
              <TileGlyph kind="safeEscalation" frame={frame} />
              <span className="type-micro w-[50px] shrink-0 whitespace-nowrap text-muted-foreground">{item.id}</span>
              <span className="type-micro min-w-0 flex-1 truncate text-foreground">{item.label}</span>
              <span className="type-micro shrink-0 text-muted-foreground">{STATUS_META.safeEscalation.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <Comparison state={state} visible={compare} />

      <Button
        variant="outline"
        {...anchored('compare-versions', COMPARE_BUTTON)}
        className={flat}
        aria-pressed={compare}
        icon={<GitCompareArrows className="size-4" strokeWidth={1.75} />}
        onClick={() => act(props, { type: 'SET_COMPARE', open: !compare })}
      >
        {compare ? 'Hide comparison' : 'Compare versions'}
      </Button>
      <Button
        variant="primary"
        {...anchored('rerun', RERUN_BUTTON)}
        className={flat}
        disabled={rerunReason !== null}
        disabledReason={rerunReason ?? undefined}
        icon={<RotateCcw className="size-4" strokeWidth={1.75} />}
        onClick={() => act(props, { type: 'FIX_AND_RUN' })}
      >
        Rerun
      </Button>

      <EvidenceDrawer {...props} />
    </>
  )
}
