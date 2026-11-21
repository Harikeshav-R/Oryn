import { StatusGlyph } from '@/components/domain/status-glyphs'
import { Button } from '@/components/ui/button'
import { INCIDENT, REPAIR } from '@/data/incident'
import { latestRun, regressionPasses, runSummary } from '@/state'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { refusal } from './discovery'
import { anchored, at } from './geometry'
import { RELEASE_ANCHORS, RELEASE_ANCHOR_RECTS as R } from './release-layout'
import { releaseAccess } from './release'
import { HiddenAnchors } from './settings-frame'

/** SC29: owner decision, independent outcomes, expansion and retained incident history. */
export function ReleaseScreen(props: ProductProps) {
  const { state } = props
  const access = releaseAccess(state)
  if (!access.ok) {
    return <><p role="status" className="type-body rounded-lg border bg-surface-2 p-4" style={at({ x: 264, y: 176, width: 992, height: 88 })}>Not available: {access.reason}</p><HiddenAnchors names={RELEASE_ANCHORS} /></>
  }

  const review = state.release.stage === 'none'
  const closed = state.incident.status === 'closed'
  const expanded = state.release.stage === 'expanded'
  const count = state.release.cohort.filter((outcome) => outcome === 'verified').length
  const run = latestRun(state)
  const summary = run && regressionPasses(run) ? runSummary(run) : null
  const approveReason = review ? refusal(state, { type: 'LIMITED_RELEASE' }) : null
  const expandReason = !review && !closed ? refusal(state, { type: 'EXPAND_RELEASE' }) : null
  const closeReason = !review && !closed ? refusal(state, { type: 'CLOSE_INCIDENT' }) : null
  const selected = state.ui.incident.outcome
  const rowAnchors = ['cohort-outcome-1', 'cohort-outcome-2', 'cohort-outcome-3'] as const
  const progress = (type: 'LIMITED_RELEASE' | 'VERIFY_COHORT_OUTCOME' | 'EXPAND_RELEASE' | 'CLOSE_INCIDENT') =>
    props.film?.reducedMotion ? 1 : motionProgress(props.film, type)
  const releaseOpacity = review ? 1 : 0.65 + 0.35 * progress('LIMITED_RELEASE')
  const rowOpacity = 0.65 + 0.35 * progress('VERIFY_COHORT_OUTCOME')
  const expandOpacity = 0.65 + 0.35 * progress('EXPAND_RELEASE')
  const closeOpacity = 0.65 + 0.35 * progress('CLOSE_INCIDENT')

  return (
    <>
      <section {...anchored('limited-release', R['limited-release'])} className="box-border rounded-lg border bg-surface p-6">
        <h1 className="type-section m-0">Limited release</h1>
        <p className="type-data mt-2 text-muted-foreground">Supplier Invoice Reconciler · v1.1</p>
        {!review && !closed && <div style={{ opacity: expanded ? expandOpacity : releaseOpacity }}>
          <p className="type-body mt-44">{expanded ? 'Expanded after owner authorization' : 'Restricted cohort approved'}</p>
          <p className="type-data mt-2 text-muted-foreground">Stage 3 · Supervised Assist</p>
        </div>}
      </section>
      <div {...anchored('release-scope', R['release-scope'])} className="box-border">
        <div className="box-border h-full rounded border bg-surface-2 p-4" style={{ width: expanded ? '100%' : 344 }}>
          <p className="type-data m-0 font-semibold">Kestrel Components invoices only</p>
          <p className="type-data mb-0 mt-2">AP East only</p>
          <p className="type-micro mb-0 mt-2 text-muted-foreground">{REPAIR.scope}</p>
        </div>
      </div>
      <div {...anchored('affected-case-history', R['affected-case-history'], closed)} className="box-border rounded border bg-surface-2 p-4">
        <p className="type-data m-0 font-semibold">Affected-case history</p>
        {state.incident.containedCaseIds.map((id) => <p className="type-micro my-1" key={id}>{id}{state.incident.manualCompletions.includes(id) ? ' · manually completed by Elena Ruiz' : ' · contained'}</p>)}
      </div>
      {review && <div style={at({ x: 288, y: 370, width: 432, height: 166 })} className="type-micro overflow-hidden"><p className="type-data font-semibold">Repair diff · Interpret invoice totals</p><p>Before: {REPAIR.before}</p><p>After: {REPAIR.after}</p><p>Permissions and policy unchanged.</p></div>}
      <div {...anchored('release-owner', R['release-owner'])} className="type-data">
        <p className="m-0 font-semibold">Marcus Webb</p><p className="type-micro mt-1 text-muted-foreground">Workflow Owner</p>
      </div>
      <Button {...anchored('approve-limited-release', R['approve-limited-release'], review)} disabled={!!approveReason} disabledReason={approveReason ?? undefined} className="transition-none" onClick={() => act(props, { type: 'LIMITED_RELEASE' })}>Approve limited release</Button>
      <section {...anchored('verified-three', R['verified-three'])} className="box-border rounded-lg border bg-surface p-6">
        <h2 className="type-card m-0">{review ? 'Regression evidence' : 'Watching verified outcomes'}</h2>
        {review ? <div className="type-data mt-5 space-y-2"><p>34 scenarios</p>{summary ? <><p>{summary.passed} Passed</p><p>{summary.safeEscalation} Passed — Expected Safe Escalation</p><p>{summary.failed} Failed</p></> : <p>{approveReason}</p>}</div> : <><p className="type-data mt-4 font-semibold">First {count}/3 Verified Complete</p><p className="type-micro text-muted-foreground">Each outcome requires independent readback.</p></>}
      </section>
      {rowAnchors.map((anchor, index) => {
        const verified = state.release.cohort[index] === 'verified'
        const outcome = index as 0 | 1 | 2
        return <button key={anchor} type="button" {...anchored(anchor, R[anchor], !review)} className="box-border flex items-center justify-between rounded border bg-surface-2 px-4 text-left type-data transition-none hover:bg-surface" onClick={() => act(props, { type: 'SET_INCIDENT_VIEW', outcome })}><span>Outcome {index + 1}</span><span style={{ opacity: verified ? rowOpacity : 1 }} className={verified ? 'flex items-center gap-2 text-success' : 'text-muted-foreground'}>{verified && <StatusGlyph status="verified" />}{verified ? 'Verified Complete' : 'Awaiting independent readback'}</span></button>
      })}
      <div {...anchored('cohort-evidence', R['cohort-evidence'], !review && selected !== null)} className="box-border flex items-center justify-between rounded border bg-surface px-3 type-micro">
        <span>Independent readback · outcome {selected === null ? '' : selected + 1} of 3{selected !== null && state.release.cohort[selected] === 'pending' ? ' · Awaiting independent readback' : ' · Verified Complete'}</span>
        <button type="button" className="underline" onClick={() => act(props, { type: 'SET_INCIDENT_VIEW', outcome: null })}>Close</button>
      </div>
      <Button {...anchored('expand-release', R['expand-release'], !review && !closed)} variant="outline" disabled={!!expandReason} disabledReason={expandReason ?? undefined} className="transition-none" onClick={() => act(props, { type: 'EXPAND_RELEASE' })}>Expand release</Button>
      {!review && !closed && <p className="type-micro m-0 text-muted-foreground" style={{ ...at({ x: 792, y: 536, width: 416, height: 40 }), opacity: expanded ? expandOpacity : 1 }}>{expanded ? 'Owner decision recorded' : expandReason}</p>}
      {closed && <div style={{ ...at({ x: 792, y: 500, width: 416, height: 100 }), opacity: closeOpacity }}><p className="type-data font-semibold">INC-0042 · Closed</p><p className="type-data"><StatusGlyph status="verified" /> {state.incident.disposition}</p><p className="type-micro">Owner decision recorded</p></div>}
      <Button {...anchored('close-incident', R['close-incident'], !review && !closed)} variant="outline" disabled={!!closeReason} disabledReason={closeReason ?? undefined} className="transition-none" onClick={() => act(props, { type: 'CLOSE_INCIDENT' })}>Close incident</Button>
      {closed && <span className="sr-only">{INCIDENT.id}</span>}
    </>
  )
}
