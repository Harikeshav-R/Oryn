import { useState } from 'react'
import { ApprovalAuthority, type DelegationStatus } from '@/components/domain/approval-authority'
import { RoleSelector } from '@/components/domain/role-selector'
import { RegressionList, type RegressionPhase } from '@/components/domain/regression-list'
import { REGRESSION_CASES, REGRESSION_PASS_RESULTS } from '@/data/regression'
import { RolloutCohort, type CohortPhase, type CohortWatch } from '@/components/domain/rollout-cohort'
import { VersionCompare } from '@/components/domain/version-compare'
import { NotificationCard } from '@/components/domain/notification-card'
import { NOTIFICATIONS, selectNotification, type NotificationId, type NotificationRecipient, type NotificationTarget } from '@/data/notifications'
import { HudCard, type HudCardVariant } from '@/components/domain/hud-card'
import { IncidentCard } from '@/components/domain/incident-card'
import type { DecisionState } from '@/data/approval'
import { INCIDENT, REPAIR } from '@/data/incident'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Section, buttonClass } from './specimen'

const GRANTED_IDENTITIES = ['priya', 'jamal', 'marcus', 'daniel', 'tomas']
const RESTRICTED_IDENTITIES = ['priya']
// These are specimen event references, not case IDs or claims about JOB-0117.
const WATCH_EVENTS = ['specimen-readback-1', 'specimen-readback-2', 'specimen-readback-3'] as const

export function ReleaseSpecimens({ onOpenSource }: { onOpenSource: (source: string) => void }) {
  const [personId, setPersonId] = useState('priya')
  const [restrictIdentities, setRestrictIdentities] = useState(false)
  const [delegation, setDelegation] = useState<DelegationStatus>('absent')
  const [decision, setDecision] = useState<DecisionState>('pending')
  const [readback, setReadback] = useState(false)
  const [regressionPhase, setRegressionPhase] = useState<RegressionPhase>('not-run')
  const [releaseRequested, setReleaseRequested] = useState(false)
  const [scopeValidated, setScopeValidated] = useState(false)
  const [ownerAuthorized, setOwnerAuthorized] = useState(false)
  const [cohortPhase, setCohortPhase] = useState<CohortPhase>('awaiting-owner')
  const [watches, setWatches] = useState<CohortWatch[]>([])
  const [restoreAuthorized, setRestoreAuthorized] = useState(false)
  const [restored, setRestored] = useState(false)
  const [recipient, setRecipient] = useState<NotificationRecipient>('daniel')
  const [approvalRequired, setApprovalRequired] = useState(false)
  const [incidentContained, setIncidentContained] = useState(false)
  const [grants, setGrants] = useState<Partial<Record<NotificationRecipient, NotificationTarget[]>>>({})
  const [dismissed, setDismissed] = useState<NotificationId[]>([])
  const [expanded, setExpanded] = useState(true)
  const [read, setRead] = useState(false)
  const [noticeTarget, setNoticeTarget] = useState<NotificationTarget | null>(null)
  const [fixtureEvidence, setFixtureEvidence] = useState<string | null>(null)
  const [hudVariant, setHudVariant] = useState<HudCardVariant>('peerFix')
  const [vendor, setVendor] = useState('Kestrel Components')
  const [commitmentConfirmed, setCommitmentConfirmed] = useState(false)
  const [hudDismissed, setHudDismissed] = useState(false)
  const grantedIdentities = restrictIdentities ? RESTRICTED_IDENTITIES : GRANTED_IDENTITIES
  const regressionPassed = regressionPhase === 'complete'
  const releaseAuthorized = cohortPhase !== 'awaiting-owner'
  const canAccess = (target: NotificationTarget) => grants[recipient]?.includes(target) ?? false
  const notification = selectNotification({ recipient, approvalRequired, incidentContained, regressionPassed, releaseAuthorized, commitmentConfirmed, canAccess, dismissed })
  const results = regressionPhase === 'complete' ? REGRESSION_PASS_RESULTS : regressionPhase === 'partial' ? REGRESSION_PASS_RESULTS.slice(0, 17) : []

  function startRegression() {
    setRegressionPhase('running')
    setReleaseRequested(false)
  }

  return <>
    <Section id="authority-specimen" title="Approval authority (CMP-31)">
      <p className="type-data text-muted-foreground">Identity, delegation, decision and independent readback are separate events.</p>
      <RoleSelector personId={personId} grantedPersonIds={grantedIdentities} onPersonChange={setPersonId} />
      <label className="flex flex-wrap items-center gap-2 type-data">Tier 3 delegation
        <select value={delegation} onChange={(event) => setDelegation(event.target.value as DelegationStatus)} className="rounded border bg-surface p-2">
          <option value="absent">Absent</option><option value="valid">Valid</option><option value="expired">Expired</option><option value="wrongScope">Wrong scope</option>
        </select>
      </label>
      <div className="max-w-[480px]"><ApprovalAuthority personId={personId} delegation={delegation} decision={decision} readbackVerified={readback} onDecide={setDecision} onOpenSource={onOpenSource} /></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} disabled={decision !== 'approved' || readback} onClick={() => setReadback(true)}>Record independent readback</button>
        <button type="button" className={buttonClass} onClick={() => { setDecision('pending'); setReadback(false) }}>Reset approval</button>
      </div>
    </Section>
    <Section id="regression-specimen" title="Regression suite (CMP-32)">
      <RegressionList phase={regressionPhase} results={results} frame={45} startFrame={0} film onRun={releaseAuthorized ? undefined : startRegression} onRequestRelease={() => setReleaseRequested(true)} onOpenEvidence={setFixtureEvidence} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Regression events">
        <button type="button" className={buttonClass} disabled={regressionPhase !== 'running'} onClick={() => setRegressionPhase('partial')}>Record partial results</button>
        <button type="button" className={buttonClass} disabled={regressionPhase !== 'partial'} onClick={() => setRegressionPhase('complete')}>Record remaining results</button>
        <button type="button" className={buttonClass} disabled={releaseAuthorized} onClick={() => { setRegressionPhase('not-run'); setReleaseRequested(false) }}>Reset regression</button>
      </div>
      <p className="type-data" role="status">{releaseRequested ? 'Release requested; owner authorization remains separate.' : 'Release not requested.'}</p>
    </Section>
    <Section id="cohort-specimen" title="Controlled rollout (CMP-33)">
      <label className="flex items-center gap-2 type-data"><input type="checkbox" checked={scopeValidated} onChange={(event) => setScopeValidated(event.target.checked)} /> Kestrel-only scope validated</label>
      <label className="flex items-center gap-2 type-data"><input type="checkbox" checked={ownerAuthorized} onChange={(event) => setOwnerAuthorized(event.target.checked)} /> Marcus Webb owner authorization</label>
      <RolloutCohort phase={cohortPhase} watches={watches} ownerAuthorized={ownerAuthorized} scopeValidated={scopeValidated} regressionPassed={regressionPassed && releaseRequested} film onAuthorizeLimitedRelease={() => setCohortPhase('limited-release')} onExpand={() => setCohortPhase('expanded')} onCloseIncident={() => setCohortPhase('closed')} onOpenEvidence={setFixtureEvidence} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Independent watch events">
        {WATCH_EVENTS.map((id, index) => <button key={id} type="button" className={buttonClass} disabled={cohortPhase !== 'limited-release' || index !== watches.length} onClick={() => setWatches((current) => [...current, { outcome: 'verified', evidenceId: id }])}>Record watch {index + 1} readback</button>)}
      </div>
    </Section>
    <Section id="versions-specimen" title="Versions and restore (CMP-34)">
      <label className="flex items-center gap-2 type-data"><input type="checkbox" checked={restoreAuthorized} onChange={(event) => setRestoreAuthorized(event.target.checked)} /> Explicit restore authorization</label>
      <VersionCompare regressionPassed={regressionPassed} restoreAuthorized={restoreAuthorized} onRestore={() => setRestored(true)} film />
      {restored && <p role="status" className="type-data">Agent v1.0 selected for future jobs only. Historical actions remain unchanged.</p>}
    </Section>
    <Section id="notifications-specimen" title="Notifications (CMP-35)">
      <div className="flex flex-wrap items-center gap-3">
        <label className="type-data">Recipient <select value={recipient} onChange={(event) => { setRecipient(event.target.value as NotificationRecipient); setNoticeTarget(null); setRead(false); setExpanded(true) }} className="rounded border bg-surface p-2"><option value="daniel">Daniel</option><option value="marcus">Marcus</option><option value="priya">Priya</option></select></label>
        <label className="type-data"><input type="checkbox" checked={approvalRequired} onChange={(event) => setApprovalRequired(event.target.checked)} /> Approval required</label>
        <label className="type-data"><input type="checkbox" checked={incidentContained} onChange={(event) => setIncidentContained(event.target.checked)} /> Incident contained</label>
        {Object.values(NOTIFICATIONS).filter((item) => item.recipient === recipient).map((item) => <label key={item.target} className="flex items-center gap-2 type-data"><input type="checkbox" checked={canAccess(item.target)} onChange={(event) => {
          const granted = event.target.checked
          if (!granted && noticeTarget === item.target) setNoticeTarget(null)
          setGrants((current) => ({ ...current, [recipient]: granted ? [...(current[recipient] ?? []), item.target] : (current[recipient] ?? []).filter((target) => target !== item.target) }))
        }} /> Access to {item.target}</label>)}
        <button type="button" className={buttonClass} onClick={() => { setDismissed([]); setRead(false) }}>Restore dismissed notices</button>
      </div>
      {notification ? <NotificationCard id={notification} recipient={recipient} approvalRequired={approvalRequired} incidentContained={incidentContained} regressionPassed={regressionPassed} releaseAuthorized={releaseAuthorized} commitmentConfirmed={commitmentConfirmed} canAccess={canAccess} dismissed={dismissed} read={read} expanded={expanded} onExpandedChange={setExpanded} onDismiss={(id) => { setDismissed((current) => [...current, id]); setRead(false) }} onOpen={(target) => { setNoticeTarget(target); setRead(true) }} /> : <p className="type-data">No eligible notification for this recipient and access state.</p>}
    </Section>
    <Section id="hud-specimen" title="Contextual guidance (CMP-36)">
      <div className="flex flex-wrap items-center gap-3">
        <label className="type-data">Context <select value={hudVariant} onChange={(event) => { setHudVariant(event.target.value as HudCardVariant); setHudDismissed(false) }} className="rounded border bg-surface p-2"><option value="peerFix">Peer fix</option><option value="guide">Guide</option><option value="commitment">Commitment</option></select></label>
        <label className="type-data">Vendor <input value={vendor} onChange={(event) => setVendor(event.target.value)} className="rounded border bg-surface p-2" /></label>
        <label className="flex items-center gap-2 type-data"><input type="checkbox" checked={commitmentConfirmed} onChange={(event) => setCommitmentConfirmed(event.target.checked)} /> Commitment confirmed</label>
        <button type="button" className={buttonClass} onClick={() => setHudDismissed(false)}>Show guidance</button>
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-[320px] max-w-full rounded border bg-surface p-3">
          <p className="type-data font-semibold">NetSuite vendor record</p>
          <label className="mt-3 block type-data">Vendor tax ID
            <input type="text" autoComplete="off" className="mt-1 block w-full rounded border bg-surface p-2" />
          </label>
        </div>
        <HudCard variant={hudVariant} vendor={vendor} commitmentConfirmed={commitmentConfirmed} dismissed={hudDismissed} onDismiss={() => setHudDismissed(true)} />
      </div>
      <p className="type-data text-muted-foreground">Dismissal does not complete the guidance or commitment.</p>
    </Section>
    <Section id="identity-specimen" title="Organization and role (CMP-37)">
      <label className="flex items-center gap-2 type-data">
        <input type="checkbox" checked={restrictIdentities} onChange={(event) => {
          const restricted = event.target.checked
          setRestrictIdentities(restricted)
          if (restricted) setPersonId((current) => RESTRICTED_IDENTITIES.includes(current) ? current : 'priya')
        }} />
        Restrict granted identities to Priya
      </label>
      <RoleSelector personId={personId} grantedPersonIds={grantedIdentities} onPersonChange={setPersonId} />
      <p className="type-data text-muted-foreground">A granted viewpoint does not grant private evidence or financial authority.</p>
    </Section>
    {fixtureEvidence && <Dialog open onOpenChange={(open) => { if (!open) setFixtureEvidence(null) }}><DialogContent title={WATCH_EVENTS.some((id) => id === fixtureEvidence) ? 'Independent readback' : fixtureEvidence} description="Evidence">{WATCH_EVENTS.some((id) => id === fixtureEvidence) ? <div className="space-y-2 type-data"><p>Watch {WATCH_EVENTS.findIndex((id) => id === fixtureEvidence) + 1} · Kestrel Components invoices · AP East · Agent v1.1</p><p>Independent readback · Verified Complete</p><p>Separate cohort; not an addition to JOB-0117.</p></div> : <p className="type-data">{REGRESSION_CASES.find((item) => item.id === fixtureEvidence)?.description}</p>}</DialogContent></Dialog>}
    {noticeTarget && canAccess(noticeTarget) && <Dialog open onOpenChange={(open) => { if (!open) setNoticeTarget(null) }}><DialogContent title={noticeTarget} description={Object.values(NOTIFICATIONS).find((item) => item.target === noticeTarget)?.title ?? 'Notification target'}>
      {noticeTarget === 'INV-48219' && <ApprovalAuthority personId={personId} delegation={delegation} decision={decision} readbackVerified={readback} onDecide={setDecision} onOpenSource={onOpenSource} />}
      {noticeTarget === INCIDENT.id && <IncidentCard state={cohortPhase === 'closed' ? 'repaired-closed' : 'contained'} onOpenSource={onOpenSource} />}
      {noticeTarget === 'kestrel-commitment' && <div className="space-y-2 type-data"><p>Confirm Kestrel handling-fee terms in writing.</p><p>Fri 12:00 · NetSuite vendor record</p><p>Commitment confirmed: {commitmentConfirmed ? 'Yes' : 'No'}</p></div>}
      {noticeTarget === REPAIR.id && <div className="space-y-2 type-data"><p>Repair for {REPAIR.incidentId}</p><p>Scope: {REPAIR.scope}.</p><p>Regression: {regressionPassed ? 'Complete' : 'Not complete'}</p></div>}
      {noticeTarget === 'v1.1-limited-cohort' && <RolloutCohort phase={cohortPhase} watches={watches} ownerAuthorized={ownerAuthorized} scopeValidated={scopeValidated} regressionPassed={regressionPassed && releaseRequested} film onAuthorizeLimitedRelease={() => setCohortPhase('limited-release')} onExpand={() => setCohortPhase('expanded')} onCloseIncident={() => setCohortPhase('closed')} onOpenEvidence={setFixtureEvidence} />}
    </DialogContent></Dialog>}
  </>
}
