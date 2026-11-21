import { CircleHelp, Pause } from 'lucide-react'
import { StatusGlyph } from '@/components/domain/status-glyphs'
import { Button } from '@/components/ui/button'
import { INCIDENT } from '@/data/incident'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { refusal } from './discovery'
import { anchored, at } from './geometry'
import { affectedCases, CONTAINMENT_WIPE_FRAMES, incidentAccess, selectedIncidentCase } from './incident'
import { INCIDENT_ANCHORS, INCIDENT_ANCHOR_RECTS as R } from './incident-layout'
import type { IncidentAnchor } from './incident-layout'
import { HiddenAnchors } from './settings-frame'

const ids = affectedCases.map((item) => item.id)
const rowAnchors: readonly IncidentAnchor[] = ['incident-case-1', 'incident-case-2', 'incident-case-3']

/** SC26: incident facts and containment are deliberately separate from the hypothesis. */
export function IncidentScreen(props: ProductProps) {
  const { state, film } = props
  const access = incidentAccess(state)
  if (!access.ok) return <><p role="status" className="type-body rounded-lg border bg-surface p-4" style={at({ x: 264, y: 112, width: 968, height: 88 })}>Not available: {access.reason}</p><HiddenAnchors names={INCIDENT_ANCHORS} /></>

  const contained = state.incident.status === 'contained' || state.incident.status === 'closed'
  const selected = selectedIncidentCase(state)
  const manualDone = state.incident.manualCompletions.includes('INV-48231')
  const teachReason = manualDone ? null : refusal(state, { type: 'TEACH' })
  const containReason = refusal(state, { type: 'CONTAIN_INCIDENT', caseIds: ids })
  const manualReason = refusal(state, { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' })
  const landed = film?.lastApplied('CONTAIN_INCIDENT')
  const reveal = !film || film.reducedMotion || landed == null || film.frame - landed >= CONTAINMENT_WIPE_FRAMES
  const detailOpacity = motionProgress(film, 'SELECT_CASE')
  const main = selected === 'INV-48231'
  return (
    <>
      <section {...anchored('affected-cases', R['affected-cases'])} className="box-border rounded-lg border bg-surface p-6">
        <h1 className="type-section m-0">Incident Center</h1>
        <p className="type-data mt-4">INC-0042 · Kestrel Components</p>
        <p className="type-micro text-muted-foreground">{contained ? '3 affected cases paused' : '3 affected cases'}</p>
        <p className="type-micro text-muted-foreground">{contained ? 'Only these 3 cases are paused' : 'Containment has not started'}</p>
      </section>
      {affectedCases.map((row, index) => {
        const name = rowAnchors[index]!
        const paused = contained && state.incident.containedCaseIds.includes(row.id)
        const showGlyph = paused && reveal && (!film || film.reducedMotion || landed == null || film.frame - landed >= CONTAINMENT_WIPE_FRAMES + index * 2.4)
        return <button key={row.id} type="button" {...anchored(name, R[name])} aria-pressed={selected === row.id} onClick={() => act(props, { type: 'SELECT_CASE', caseId: row.id })} className={`box-border flex flex-col justify-center gap-1 rounded border px-3 text-left transition-none ${selected === row.id ? 'border-foreground bg-surface-2' : 'bg-surface'}`}>
          <span className="type-data">{row.id} <span className="text-muted-foreground">{row.invoiceAmountCents === null ? '—' : '$4,213.50'}</span></span>
          <span className="type-micro flex items-center gap-2 text-muted-foreground">{showGlyph && <Pause size={12} data-glyph="paused" aria-hidden="true" />}{paused ? 'Paused' : 'Verification unavailable'}</span>
        </button>
      })}
      <Button {...anchored('incident-contain', R['incident-contain'], !contained)} variant="outline" className="transition-none" aria-disabled={!!containReason} onClick={() => { if (!containReason) act(props, { type: 'CONTAIN_INCIDENT', caseIds: ids }) }}>Contain incident</Button>
      {!contained && containReason && <p className="type-micro text-muted-foreground" style={at({ x: 288, y: 555, width: 252, height: 44 })}>{containReason}</p>}
      <section {...anchored('incident', R.incident)} className="box-border rounded-lg border bg-surface p-6">
        <div className="flex items-center justify-between"><h2 className="type-section m-0">INC-0042</h2><span className="type-data flex items-center gap-2">{contained && reveal && <StatusGlyph status="contained" />}{contained ? 'Contained' : 'Open'}</span></div>
        <p className="type-body mt-3">{INCIDENT.summary}</p>
        <p className="type-data mt-2 text-muted-foreground">Kestrel Components · {selected}</p>
      </section>
      <section {...anchored('fee-comparison', R['fee-comparison'])} style={{ ...at(R['fee-comparison']), opacity: detailOpacity }} className="box-border rounded border bg-surface-2 p-4">
        {main ? <><p className="type-data m-0">INV-48231 $4,213.50</p><p className="type-data mt-1">PO-1051 $4,175.00 + Handling fee $38.50 = $4,213.50</p></> : <p className="type-data m-0">{selected} —</p>}
        <p className="type-data mt-3">Expected: verifiable invoice total</p><p className="type-data mt-1">Actual: cannot verify</p>
      </section>
      <div {...anchored('incident-hypothesis', R['incident-hypothesis'])} className="flex items-center gap-3 border-y"><CircleHelp size={18} aria-hidden="true" /><span className="type-data">Supplier document format change — unconfirmed</span></div>
      <div {...anchored('incident-evidence', R['incident-evidence'])} className="overflow-auto">
        <button type="button" className="type-data underline" onClick={() => act(props, { type: 'SET_INCIDENT_VIEW', evidence: !state.ui.incident.evidence })}>{state.ui.incident.evidence ? 'Hide evidence' : 'View case evidence'}</button>
        {state.ui.incident.evidence && (main ? <ul className="type-micro m-0 list-none p-0">{INCIDENT.evidence.map((item) => <li key={item.id}>{item.id} · {item.sourceId} · {item.description}</li>)}</ul> : <p className="type-data">No amount recorded</p>)}
      </div>
      <Button {...anchored('incident-manual', R['incident-manual'], contained)} variant="outline" className="transition-none" aria-disabled={!!manualReason || manualDone} onClick={() => { if (!manualReason && !manualDone) act(props, { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' }) }}>{manualDone ? 'Manually completed' : 'Complete INV-48231 manually'}</Button>
      <Button {...anchored('incident-teach', R['incident-teach'])} className="transition-none" aria-disabled={!!teachReason} aria-describedby={teachReason ? 'incident-teach-reason' : undefined} onClick={() => { if (!teachReason) act(props, { type: 'OPEN_SCREEN', screen: 'SC27' }) }}>Teach Oryn What Changed</Button>
      {teachReason && <p id="incident-teach-reason" className="type-micro text-muted-foreground" style={at({ x: 880, y: 638, width: 328, height: 30 })}>{teachReason}</p>}
      {contained && !manualDone && manualReason && <p className="type-micro text-muted-foreground" style={at({ x: 288, y: 500, width: 252, height: 90 })}>{manualReason}</p>}
    </>
  )
}
