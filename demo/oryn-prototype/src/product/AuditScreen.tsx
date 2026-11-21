import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUITE_SIZE } from '@/data/simulation'
import { auditSlice, latestCompleteRun, latestRun, regressionPasses, runSummary } from '@/state'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { auditAccess } from './audit'
import { AUDIT_ANCHORS, AUDIT_ANCHOR_RECTS as R } from './audit-layout'
import { refusal } from './discovery'
import { FocusOnOpen } from './focus-on-open'
import { trapTab } from './focus-trap'
import { anchored, at } from './geometry'
import { HiddenAnchors } from './settings-frame'

function Value({ value }: { value: string | null }) {
  return value === null ? <span aria-label="Not specified">—</span> : <>{value}</>
}

export function AuditScreen(props: ProductProps) {
  const { state } = props
  const access = auditAccess(state)
  if (!access.ok) return <><p role="status" style={at({ x: 264, y: 176, width: 992, height: 88 })}>Not available: {access.reason}</p><HiddenAnchors names={AUDIT_ANCHORS} /></>
  const events = auditSlice(state)
  const evaluation = latestCompleteRun(state, 'agent-v0.2')
  const evaluationSummary = evaluation ? runSummary(evaluation) : null
  const shown = events.slice(evaluationSummary ? -11 : -12)
  const step = state.ui.breadth.audit.step
  const completed = state.audit.includes('A15')
  const reason = refusal(state, { type: 'EXPORT_AUDIT_PACK' })
  const run = latestRun(state, 'agent-v1.1')
  const summary = regressionPasses(run) && run ? runSummary(run) : null
  const progress = props.film?.reducedMotion ? 1 : motionProgress(props.film, 'SET_AUDIT_EXPORT')
  const close = () => act(props, { type: 'SET_AUDIT_EXPORT', step: 'closed' })
  return <>
    <div style={at({ x: 264, y: 112, width: 700, height: 56 })}><h1 className="type-title m-0">Audit &amp; Export</h1><p className="type-data m-0 text-muted-foreground">Immutable change history</p></div>
    <Button {...anchored('audit-export', R['audit-export'])} className="transition-none" disabled={!!reason} disabledReason={reason ?? undefined} onClick={() => act(props, { type: 'SET_AUDIT_EXPORT', step: 'drawer' })}><Download size={16} /> Export audit pack</Button>
    {reason && !completed && <p className="type-micro text-muted-foreground" style={at({ x: 720, y: 145, width: 300, height: 28 })}>{reason}</p>}
    <section {...anchored('audit-table', R['audit-table'])} className="box-border rounded-lg border bg-surface p-2">
      <table className="w-full table-fixed border-collapse text-left type-micro">
        <colgroup><col style={{ width: '16%' }} /><col style={{ width: '15%' }} /><col style={{ width: '19%' }} /><col style={{ width: '14%' }} /><col style={{ width: '36%' }} /></colgroup>
        <thead><tr style={{ height: 26 }}>{['Actor', 'Event', 'Object', 'Scope', 'Outcome'].map((label) => <th key={label} className="border-b px-1">{label}</th>)}</tr></thead>
        <tbody>{evaluationSummary && <tr className="border-b" style={{ height: 32 }}><td className="px-1">Actor: not recorded</td><td className="px-1">Evaluation</td><td className="px-1">SIM-AP-RECON v0.2</td><td className="px-1">{SUITE_SIZE} scenarios</td><td className="px-1">{evaluationSummary.passed} Passed · {evaluationSummary.safeEscalation} Passed — Expected Safe Escalation · {evaluationSummary.failed} Failed</td></tr>}{shown.map((event) => <tr key={event.id} className="border-b" style={{ height: 32 }}><td className="px-1"><Value value={event.actor} /></td><td className="px-1"><span className="sr-only">{event.id} </span>{event.action}</td><td className="px-1"><Value value={event.object} /></td><td className="px-1"><Value value={event.scope} /></td><td className="px-1"><Value value={event.outcome} /></td></tr>)}</tbody>
      </table>
      {events.length > shown.length && <p className="type-micro m-0">Showing the latest {shown.length} of {events.length} records</p>}
    </section>
    <div {...anchored('audit-evaluation-row', R['audit-evaluation-row'], !!summary && state.audit.includes('A11'))} className="type-micro bg-surface px-3">{summary && <>Regression: {summary.passed} Passed · {summary.safeEscalation} Passed — Expected Safe Escalation · {summary.failed} Failed</>}</div>
    <p {...anchored('audit-complete', R['audit-complete'], completed)} className="type-data">Audit pack generated</p>
    <FocusOnOpen open={step !== 'closed'} interactive={!props.film} anchor="audit-export" />
    <div {...anchored('audit-drawer', R['audit-drawer'], step !== 'closed')} className="z-40 box-border border bg-surface p-8 shadow-lg" style={{ ...anchored('audit-drawer', R['audit-drawer'], step !== 'closed').style, opacity: progress }}>
      <h2 className="type-section">Export audit pack</h2><h3 className="type-card mt-8">Authorized scope</h3>
      <p className="type-data">{events.length} event records</p><p className="type-data">Raw private media is not included.</p>
      <Button className="mt-8 transition-none" onClick={() => act(props, { type: 'SET_AUDIT_EXPORT', step: 'confirm' })}>Continue</Button>
      <Button variant="outline" className="ml-2 transition-none" onClick={close}>Cancel</Button>
    </div>
    {step === 'confirm' && <div className="fixed inset-0 z-50 bg-ink/80" onClick={close} />}
    <div onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); close() } else trapTab(event, event.currentTarget) }}>
      <div {...anchored('audit-confirm', R['audit-confirm'], step === 'confirm')} role="dialog" aria-modal="true" aria-label="Export authorized records only?" className="z-50 box-border rounded-lg border bg-surface p-8 shadow-lg" style={{ ...anchored('audit-confirm', R['audit-confirm'], step === 'confirm').style, opacity: progress }}>
        <h2 className="type-section">Export authorized records only?</h2><p className="type-data">Raw private media is not included.</p>
      </div>
      <FocusOnOpen open={step === 'confirm'} interactive={!props.film} anchor="audit-confirm-cancel" />
      <Button {...anchored('audit-confirm-cancel', R['audit-confirm-cancel'], step === 'confirm')} variant="outline" className="z-50 transition-none" onClick={close}>Cancel</Button>
      <Button {...anchored('audit-confirm-export', R['audit-confirm-export'], step === 'confirm')} className="z-50 transition-none" disabled={!!reason} disabledReason={reason ?? undefined} onClick={() => act(props, { type: 'EXPORT_AUDIT_PACK' })}>Export</Button>
    </div>
  </>
}
