import { StatusGlyph } from '@/components/domain/status-glyphs'
import { Button } from '@/components/ui/button'
import { ANALYTICS_SCOPES } from '@/data/policy-impact'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { commandAccess, commandCounts } from './command'
import { COMMAND_ANCHORS, COMMAND_ANCHOR_RECTS as R } from './command-layout'
import { refusal } from './discovery'
import { anchored, at } from './geometry'
import { incidentAccess } from './incident'
import { jobAccess } from './job'
import { HiddenAnchors } from './settings-frame'

export function CommandScreen(props: ProductProps) {
  const { state, film } = props
  const access = commandAccess(state)
  if (!access.ok) return <><p role="status" className="type-body rounded-lg border bg-surface-2 p-4" style={at({ x: 264, y: 176, width: 992, height: 88 })}>Not available: {access.reason}</p><HiddenAnchors names={COMMAND_ANCHORS} /></>
  const view = state.ui.breadth.command
  const command = view.tab === 'command'
  const counts = commandCounts(state)
  const opacity = film?.reducedMotion ? 1 : 0.65 + 0.35 * motionProgress(film, 'SET_COMMAND_VIEW')
  const jobPermission = jobAccess(state)
  const incidentPermission = incidentAccess(state)
  const jobReason = jobPermission.ok ? refusal(state, { type: 'OPEN_SCREEN', screen: 'SC25' }) : jobPermission.reason
  const incidentReason = incidentPermission.ok ? refusal(state, { type: 'OPEN_SCREEN', screen: 'SC26' }) : incidentPermission.reason
  const releaseReason = refusal(state, { type: 'OPEN_SCREEN', screen: 'SC29' })
  return <>
    <div {...anchored('command-center', R['command-center'])} className="box-border rounded-lg border bg-surface-2" />
    <Button {...anchored('cc-tab-command', R['cc-tab-command'])} variant="outline" aria-pressed={command} className="transition-none" onClick={() => act(props, { type: 'SET_COMMAND_VIEW', tab: 'command' })}>Command Center</Button>
    <Button {...anchored('cc-tab-xray', R['cc-tab-xray'])} variant="outline" aria-pressed={!command} className="transition-none" onClick={() => act(props, { type: 'SET_COMMAND_VIEW', tab: 'xray' })}>14-Day X-Ray</Button>
    <button type="button" {...anchored('cc-verified', R['cc-verified'], command)} style={{ ...anchored('cc-verified', R['cc-verified'], command).style, opacity }} className="box-border rounded-lg border bg-surface p-6 text-left" onClick={() => act(props, { type: 'SET_COMMAND_VIEW', detail: 'job' })}>
      <h2 className="type-section m-0">Verified outcomes</h2><p className="type-data">{ANALYTICS_SCOPES.job.id} · Partially Complete</p><p className="type-micro">{view.snapshot === 'before' || state.readback.status !== 'verified' ? 'Before approval' : 'After approval and verification'}</p><p className="type-data flex items-center gap-2"><StatusGlyph status="verified" />{counts.verified} Verified Complete</p>
    </button>
    <button type="button" {...anchored('cc-exceptions', R['cc-exceptions'], command)} style={{ ...anchored('cc-exceptions', R['cc-exceptions'], command).style, opacity }} className="box-border rounded-lg border bg-surface p-6 text-left" onClick={() => act(props, { type: 'SET_COMMAND_VIEW', detail: 'job' })}>
      <h2 className="type-section m-0">Exceptions</h2><p className="type-data flex items-center gap-2"><StatusGlyph status="escalated" />{counts.escalated} Escalated</p><p className="type-data flex items-center gap-2"><StatusGlyph status="approval" />{counts.approval} Approval Required</p><p className="type-data flex items-center gap-2"><StatusGlyph status="unknown" />{counts.unknown} Outcome Unknown</p>
    </button>
    <button type="button" {...anchored('cc-incidents', R['cc-incidents'], command)} style={{ ...anchored('cc-incidents', R['cc-incidents'], command).style, opacity }} className="box-border rounded-lg border bg-surface p-6 text-left" onClick={() => act(props, { type: 'SET_COMMAND_VIEW', detail: 'incident' })}>
      <h2 className="type-section m-0">Incidents</h2>{state.incident.status === 'none' ? <p className="type-data">No incident</p> : <><p className="type-data flex items-center gap-2"><StatusGlyph status="contained" />{ANALYTICS_SCOPES.incident.label}</p><p className="type-data">{ANALYTICS_SCOPES.incident.id} · {state.incident.status === 'closed' ? 'Closed' : state.incident.status === 'contained' ? 'Contained' : 'Open'}</p><p className="type-micro">Separate incident population</p></>}
    </button>
    <button type="button" {...anchored('cc-release', R['cc-release'], command)} style={{ ...anchored('cc-release', R['cc-release'], command).style, opacity }} className="box-border rounded-lg border bg-surface p-6 text-left" disabled={!!releaseReason} title={releaseReason ?? undefined} onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC29' })}>
      <h2 className="type-section m-0">Release state</h2><p className="type-data">{state.release.stage === 'expanded' ? 'v1.1 · Expanded' : state.release.stage === 'limited' ? ANALYTICS_SCOPES.release.limited : 'No release'}</p>{state.incident.disposition && <p className="type-data">{state.incident.disposition}</p>}
    </button>
    <section {...anchored('cc-xray', R['cc-xray'], !command)} style={{ ...anchored('cc-xray', R['cc-xray'], !command).style, opacity }} className="box-border rounded-lg border bg-surface p-6">
      <h2 className="type-section m-0">14-Day X-Ray</h2><h3 className="type-card mt-6">Scope</h3><p className="type-data">Authorized operational snapshots</p><h3 className="type-card mt-6">Evidence quality</h3><p className="type-data">Outcome evidence and exceptions</p><h3 className="type-card mt-6">Privacy</h3><p className="type-data">At least {ANALYTICS_SCOPES.xray.pilotMinimumEnrolled} participating enrolled employees required · {ANALYTICS_SCOPES.xray.eligibility}</p>
    </section>
    <div {...anchored('cc-job-detail', R['cc-job-detail'], command && view.detail !== null)} className="type-data flex items-center gap-4">
      {view.detail === 'job' ? <><span>{ANALYTICS_SCOPES.job.id} · {ANALYTICS_SCOPES.job.population}</span><Button variant="outline" className="transition-none" disabled={!!jobReason} disabledReason={jobReason ?? undefined} onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC25' })}>Open job</Button></> : <><span>{ANALYTICS_SCOPES.incident.id} · {ANALYTICS_SCOPES.incident.population}</span><Button variant="outline" className="transition-none" disabled={!!incidentReason} disabledReason={incidentReason ?? undefined} onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC26' })}>Open incident</Button></>}
      {(view.detail === 'job' ? jobReason : incidentReason) && <span className="type-micro">{view.detail === 'job' ? jobReason : incidentReason}</span>}
    </div>
  </>
}
