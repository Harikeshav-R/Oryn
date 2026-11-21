import { Button } from '@/components/ui/button'
import { REPAIR } from '@/data/incident'
import { REGRESSION_CASES } from '@/data/regression'
import { SCENARIOS } from '@/data/simulation'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { refusal } from './discovery'
import { anchored, at } from './geometry'
import { repairAccess, regressionView } from './repair'
import { REPAIR_ANCHORS, REPAIR_ANCHOR_RECTS as R } from './repair-layout'
import type { RepairAnchor } from './repair-layout'
import { HiddenAnchors } from './settings-frame'
import { TileGlyph } from './SimTiles'
import type { TileKind } from './simulator'
const REGRESSION_LABELS = ['original Kestrel layout v2', 'spacing', 'handling before total', 'zero handling', 'capitalization', 'separating rule'] as const


export function RepairScreen(props: ProductProps) {
  const { state } = props
  const access = repairAccess(state)
  if (!access.ok) return <><p role="status" style={at({ x: 264, y: 176, width: 700, height: 80 })}>Not available: {access.reason}</p><HiddenAnchors names={REPAIR_ANCHORS} /></>
  const proposed = state.repair.proposed
  const view = regressionView(props)
  const validateBlock = refusal(state, { type: 'VALIDATE_SCOPE', scope: REPAIR.scope })
  const proposeBlock = refusal(state, { type: 'PROPOSE_REPAIR' })
  const runBlock = refusal(state, { type: 'RUN_REGRESSION' })
  const releaseBlock = refusal(state, { type: 'LIMITED_RELEASE' })
  const ids = [...SCENARIOS.map((s) => s.id), ...REGRESSION_CASES.map((s) => s.id)]
  return <>
    <section {...anchored('repair-diff', R['repair-diff'])} className="box-border rounded-lg border bg-surface p-4">
      <h1 className="type-section m-0">{REPAIR.id} · {REPAIR.step}</h1>
      <p className="type-data mt-2">{REPAIR.scope} · v1.1 candidate</p>
      {proposed && <div style={{ opacity: 0.65 + 0.35 * motionProgress(props.film, 'PROPOSE_REPAIR') }}><p className="type-data mb-1">Before</p><p className="type-data m-0">{REPAIR.before}</p><p className="type-data mb-1 mt-3">After</p><p className="type-data m-0">{REPAIR.after}</p><p className="type-data mt-3">{REGRESSION_CASES.length} new regression cases</p></div>}
    </section>
    <div {...anchored('repair-scope-panel', R['repair-scope-panel'], !proposed)} className="box-border rounded-lg border bg-surface-2 p-4">
      <h2 className="type-section m-0">Review bounded scope</h2><p className="type-data">{REPAIR.scope}</p><p className="type-data">Marcus Webb validates this scope before proposing the repair.</p>
    </div>
    <Button {...anchored('validate-scope', R['validate-scope'], !proposed)} aria-disabled={!!validateBlock} title={validateBlock ?? undefined} className="transition-none" onClick={() => !validateBlock && act(props, { type: 'VALIDATE_SCOPE', scope: REPAIR.scope })}><span style={{ opacity: state.repair.scopeValidated ? 0.65 + 0.35 * motionProgress(props.film, 'VALIDATE_SCOPE') : 1 }}>{state.repair.scopeValidated ? 'Scope validated' : 'Validate scope'}</span></Button>
    <Button {...anchored('open-repair-diff', R['open-repair-diff'], !proposed)} aria-disabled={!!proposeBlock} title={proposeBlock ?? undefined} className="transition-none" onClick={() => !proposeBlock && act(props, { type: 'PROPOSE_REPAIR' })}>Open repair diff</Button>
    <div style={at({ x: 280, y: 574, width: 448, height: 48 })} className="type-micro">Correction is evidence, not new policy<br />Permissions unchanged · Policy unchanged</div>
    <section {...anchored('regression-results', R['regression-results'])} className="box-border rounded-lg border bg-surface p-4">
      <h2 className="type-section m-0">{ids.length} scenarios</h2><p className="type-data mt-2">{proposed && !view.run ? 'Original failure + 5 nearby variants' : 'SIM-AP-RECON-34 · v1.1 candidate'}</p>
    </section>
    {REGRESSION_CASES.map((item, index) => {
      const name = `regression-case-${item.id.slice(-3)}` as RepairAnchor
      return <button type="button" key={item.id} {...anchored(name, R[name], proposed && !view.run)} className="box-border flex items-center overflow-hidden border bg-surface px-2 text-left font-mono text-[11px] leading-3" title={`${item.description} · Expects Passed`} onClick={() => act(props, { type: 'SELECT_SCENARIO', scenarioId: item.id })}>{item.id} · {REGRESSION_LABELS[index]}</button>
    })}
    <div {...anchored('regression-tiles', R['regression-tiles'], proposed && !!view.run)} className="grid grid-cols-7 gap-1">
      {ids.map((id, index) => {
        const verdict = view.run?.status === 'complete' ? view.run.results.find((result) => result.id === id)?.verdict : undefined
        const kind: TileKind = verdict ?? (state.running.regression && index === view.executed ? 'running' : index < view.executed ? 'executed' : 'notRun')
        const label = kind === 'notRun' ? 'Not Run' : kind === 'safeEscalation' ? 'Passed — Expected Safe Escalation' : kind === 'passed' ? 'Passed' : kind === 'failed' ? 'Failed' : kind === 'running' ? 'Running' : 'Executed'
        return <button type="button" key={id} aria-label={`${id}, ${label}`} title={`${id}: ${label}`} onClick={() => act(props, { type: 'SELECT_SCENARIO', scenarioId: id })} className="flex items-center justify-center gap-1 rounded border bg-surface-2 font-mono text-[11px]"><TileGlyph kind={kind} frame={props.film?.frame ?? props.runFrame ?? 0} />{id.slice(-3)}</button>
      })}
    </div>
    {proposed && <div style={at({ x: 784, y: 355, width: 432, height: 150 })} className="type-data">
      <p>{view.summary.passed} Passed · {view.summary.safeEscalation} Passed — Expected Safe Escalation · {view.summary.failed} Failed · {view.summary.notRun} Not Run</p>
      <p>{state.running.regression ? `Running · ${view.executed} executed` : view.run?.status === 'cancelled' ? `Incomplete · ${view.executed} executed` : view.run?.status === 'complete' ? 'Completed' : 'Not Run'}</p>
      {state.running.regression && <div className="h-1 bg-surface-2"><div className="h-1 bg-trace" style={{ width: `${view.position / ids.length * 100}%` }} /></div>}
      {state.selectedScenario && <p>Evidence: {state.selectedScenario} · {SCENARIOS.find((scenario) => scenario.id === state.selectedScenario)?.name ?? REGRESSION_CASES.find((scenario) => scenario.id === state.selectedScenario)?.description}</p>}
      {releaseBlock && <p className="type-micro text-muted-foreground">{releaseBlock}</p>}
    </div>}
    <Button {...anchored('run-regression', R['run-regression'], proposed)} aria-disabled={!!runBlock} title={runBlock ?? undefined} className="transition-none" onClick={() => !runBlock && act(props, { type: 'RUN_REGRESSION' })}>Run regression</Button>
    {state.running.regression && <Button variant="outline" style={at({ x: 784, y: 550, width: 150, height: 40 })} className="transition-none" onClick={() => act(props, { type: 'CANCEL_REGRESSION' })}>Cancel</Button>}
    <Button {...anchored('request-release', R['request-release'], proposed)} aria-disabled={!!releaseBlock} title={releaseBlock ?? undefined} className="transition-none" onClick={() => !releaseBlock && act(props, { type: 'OPEN_SCREEN', screen: 'SC29' })}>Request release</Button>
  </>
}
