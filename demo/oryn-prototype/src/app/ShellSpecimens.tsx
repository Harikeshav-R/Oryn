import { useState } from 'react'
import { AppShell, type AppDestination } from '@/components/domain/app-shell'
import { CapabilityMatrix } from '@/components/domain/capability-matrix'
import { JobMetricCards, IncidentMetricCard, type MetricCategory } from '@/components/domain/metric-card'
import { OperationsGraph, type OperationsGraphView } from '@/components/domain/operations-graph'
import { Commitment, CommitmentReminder, MeetingTranscript } from '@/components/domain/commitment'
import { MaskedFields } from '@/components/domain/masked-fields'
import { SourceLine } from '@/components/domain/source-line'
import type { DecisionState } from '@/data/approval'
import type { CapabilitySelection } from '@/data/capabilities'
import { COMMITMENT } from '@/data/commitment'
import { NOTIFICATIONS, type NotificationId, type NotificationRecipient, type NotificationTarget } from '@/data/notifications'
import type { OperationsNodeId } from '@/data/operations-graph'
import { Section, buttonClass } from './specimen'

const PERSON_IDS = ['priya', 'marcus', 'daniel'] as const
const DESTINATIONS: readonly AppDestination[] = ['Home', 'Workflow Discovery', 'Playbooks', 'Operations Map', 'Agent Factory', 'Flight Simulator', 'Jobs', 'Incident Center', 'Versions', 'Command Center', 'Audit & export', 'Notifications', 'Application Capabilities', 'My Privacy']
const COMMAND_DESTINATIONS: Readonly<Record<string, AppDestination>> = { privacy: 'My Privacy' }
const TARGET_DESTINATIONS: Readonly<Record<NotificationTarget, AppDestination>> = { 'INV-48219': 'Jobs', 'INC-0042': 'Incident Center', 'kestrel-commitment': 'Home', 'REP-0042-1': 'Incident Center', 'v1.1-limited-cohort': 'Versions' }

/** Interactive component specimens; grants and fixture events are explicit and local. */
export function ShellSpecimens({ decision, readbackVerified }: { decision: DecisionState; readbackVerified: boolean }) {
  const [person, setPerson] = useState<NotificationRecipient>('priya')
  const [destinations, setDestinations] = useState<readonly AppDestination[]>(['Home', 'My Privacy'])
  const [commandsGranted, setCommandsGranted] = useState(false)
  const [notificationAccess, setNotificationAccess] = useState(false)
  const [destination, setDestination] = useState<AppDestination>('Home')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [dismissed, setDismissed] = useState<NotificationId[]>([])
  const [read, setRead] = useState<NotificationId[]>([])
  const [selection, setSelection] = useState<CapabilitySelection | null>(null)
  const [metric, setMetric] = useState<MetricCategory | null>(null)
  const [incidentRepaired, setIncidentRepaired] = useState(false)
  const [incidentContained, setIncidentContained] = useState(false)
  const [graphNode, setGraphNode] = useState<OperationsNodeId | null>(null)
  const [graphView, setGraphView] = useState<OperationsGraphView>('graph')
  const [consent, setConsent] = useState(false)
  const [transcriptAccess, setTranscriptAccess] = useState(false)
  const [due, setDue] = useState<string>(COMMITMENT.originalDue)
  const [confirmed, setConfirmed] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [interactiveCitation, setInteractiveCitation] = useState(false)
  const canAccess = (target: NotificationTarget) => notificationAccess && destinations.includes(TARGET_DESTINATIONS[target])

  return <>
    <Section id="shell-specimen" title="Application shell (CMP-38)">
      <p className="type-data text-muted-foreground">Grants are independent of the selected viewpoint. Navigation changes the view only.</p>
      <div className="flex flex-wrap gap-4 type-data">
        <label><input type="checkbox" checked={destinations.length === DESTINATIONS.length} onChange={(event) => { setDestinations(event.target.checked ? DESTINATIONS : ['Home', 'My Privacy']); setDestination('Home') }} /> Grant all navigation destinations</label>
        <label><input type="checkbox" checked={commandsGranted} onChange={(event) => setCommandsGranted(event.target.checked)} /> Grant privacy command</label>
        <label><input type="checkbox" checked={notificationAccess} onChange={(event) => setNotificationAccess(event.target.checked)} /> Grant access to notification objects in permitted destinations</label>
        <label><input type="checkbox" checked={incidentContained} onChange={(event) => setIncidentContained(event.target.checked)} /> Incident contained</label>
      </div>
      <div className="overflow-x-auto border">
        <AppShell personId={person} grantedPersonIds={PERSON_IDS} onPersonChange={(id) => { if (id === 'priya' || id === 'marcus' || id === 'daniel') { setPerson(id); setDismissed([]); setRead([]); setSearchOpen(false); setNotificationsOpen(false) } }} destination={destination} grantedDestinations={destinations} onNavigate={setDestination} grantedCommandIds={commandsGranted ? Object.keys(COMMAND_DESTINATIONS) : []} onCommand={(command) => { const target = COMMAND_DESTINATIONS[command.id]; if (target && destinations.includes(target)) setDestination(target) }} searchOpen={searchOpen} onSearchOpenChange={setSearchOpen} notificationsOpen={notificationsOpen} onNotificationsOpenChange={setNotificationsOpen} notificationEligibility={{ recipient: person, approvalRequired: decision === 'pending', incidentContained, commitmentConfirmed: confirmed && consent, regressionPassed: false, releaseAuthorized: false, canAccess, dismissed }} readNotifications={read} onNotificationOpen={(target) => { const next = TARGET_DESTINATIONS[target]; if (canAccess(target)) { const id = (Object.keys(NOTIFICATIONS) as NotificationId[]).find((key) => NOTIFICATIONS[key].target === target && NOTIFICATIONS[key].recipient === person); if (id) setRead((current) => current.includes(id) ? current : [...current, id]); setDestination(next); setNotificationsOpen(false) } }} onNotificationDismiss={(id) => { setDismissed((current) => [...current, id]); setRead((current) => [...current, id]) }}>
          <div className="p-6"><h2 className="type-section">{destination}</h2><p className="mt-3 type-data">Selected view · No domain history is changed by navigation.</p></div>
        </AppShell>
      </div>
    </Section>
    <Section id="capability-specimen" title="Application capability matrix (CMP-39)">
      <CapabilityMatrix selected={selection} onSelect={setSelection} />
    </Section>
    <Section id="metric-specimen" title="Outcome metrics (CMP-40)">
      <JobMetricCards decision={decision} readbackVerified={readbackVerified} selected={metric} onSelect={setMetric} />
      <p className="type-data" aria-live="polite">{metric ? `Selected category: ${metric}` : 'Select a category to inspect its filter.'}</p>
      <div className="max-w-[232px]"><IncidentMetricCard state={incidentRepaired ? 'repaired' : 'contained'} selected={metric === 'incident'} onSelect={setMetric} /></div>
      <button type="button" className={buttonClass} onClick={() => setIncidentRepaired((value) => !value)}>Show {incidentRepaired ? 'contained' : 'repaired'} incident fixture</button>
    </Section>
    <Section id="graph-specimen" title="Operational dependencies (CMP-41)">
      <OperationsGraph selectedId={graphNode} onSelect={setGraphNode} view={graphView} onViewChange={setGraphView} />
    </Section>
    <Section id="commitment-specimen" title="Meeting commitment (CMP-42)">
      <label className="type-data"><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setShowTranscript(false) }} /> Per-meeting opt-in</label>
      <label className="type-data"><input type="checkbox" checked={transcriptAccess} onChange={(event) => { setTranscriptAccess(event.target.checked); setShowTranscript(false) }} /> Grant access to this transcript</label>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,384px)]">
        <div id="meeting-transcript">{consent && !transcriptAccess ? <p className="rounded-lg border bg-surface p-5 text-sm">Transcript access not granted.</p> : <MeetingTranscript meetingConsent={consent} />}{showTranscript && consent && transcriptAccess && <p className="mt-2 type-data" role="status">Authorized transcript · Zoom 00:14:32</p>}</div>
        <Commitment meetingConsent={consent} due={due} onDueChange={setDue} confirmed={confirmed} onConfirm={() => setConfirmed(true)} onOpenSource={consent && transcriptAccess ? () => { setShowTranscript(true); document.getElementById('meeting-transcript')?.scrollIntoView({ block: 'nearest' }) } : undefined} />
      </div>
      {consent && <CommitmentReminder confirmed={confirmed} due={due} context="Kestrel" />}
    </Section>
    <Section id="masking-specimen" title="Mandatory masking (CMP-43)">
      <p className="type-data text-muted-foreground">Use the page theme control to inspect light and dark. Protected values are never supplied.</p>
      <MaskedFields />
    </Section>
    <Section id="citation-specimen" title="Source citation (CMP-44)">
      <label className="type-data"><input type="checkbox" checked={interactiveCitation} onChange={(event) => setInteractiveCitation(event.target.checked)} /> Interactive source link</label>
      <SourceLine interactive={interactiveCitation} />
    </Section>
  </>
}
