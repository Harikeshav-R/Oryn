import { useRef, useState } from 'react'
import { ApprovalDrawer } from '@/components/domain/approval-drawer'
import { UnknownDrawer } from '@/components/domain/unknown-drawer'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { jobCounts, type DecisionState } from '@/data/approval'
import { EvidenceCard } from '@/components/domain/evidence-card'
import { EvidenceDiff } from '@/components/domain/evidence-diff'
import { EvidenceTimeline } from '@/components/domain/evidence-timeline'
import { ScenarioGrid } from '@/components/domain/scenario-grid'
import { JobProgress } from '@/components/domain/job-progress'
import { RiskTier } from '@/components/domain/risk-tier'
import { AutonomyLadder } from '@/components/domain/autonomy-ladder'
import { GateChecklist } from '@/components/domain/gate-checklist'
import { DemonstrationCard } from '@/components/domain/demonstration-card'
import { CandidateWorkflowCard } from '@/components/domain/candidate-workflow-card'
import { PlaybookBlocks } from '@/components/domain/playbook-blocks'
import { AgentDefinition } from '@/components/domain/agent-definition'
import { ScopeList } from '@/components/domain/scope-list'
import { IncidentCard } from '@/components/domain/incident-card'
import { ExpectedActual } from '@/components/domain/expected-actual'
import type { RunEvent, SuiteVersion } from '@/data/simulation'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { INCIDENT } from '@/data/incident'
import { PEOPLE, supplierName } from '@/data/people'
import { PLAYBOOK_RULES } from '@/data/playbook'
import { ANALYTICS_SCOPES, POLICY_IMPACT } from '@/data/policy-impact'
import type { Theme } from './params'
import { Section, Sub, buttonClass } from './specimen'
import { ReleaseSpecimens } from './ReleaseSpecimens'
import { ShellSpecimens } from './ShellSpecimens'
import { cn } from '@/lib/utils'

const RUN: readonly RunEvent[] = [
  { frame: 10, type: 'start' },
  { frame: 100, type: 'complete' },
]
const SOURCE_DETAILS: Record<string, string> = {
  [PLAYBOOK_RULES[0].id]: 'Variance threshold: above 2.00% requires Tier 3 approval; at or below 2.00% auto-accepts within match.',
  [PLAYBOOK_RULES[1].id]: `${PLAYBOOK_RULES[1].title}: use approved supplier terms. Interpretation alone does not change policy.`,
  [INCIDENT.evidence[0].sourceId]: `${INCIDENT.evidence[0].description}. ${INCIDENT.evidence[2].description}.`,
  [INCIDENT.evidence[1].sourceId]: `Purchase order ${INCIDENT.evidence[1].description.slice(3)}.`,
  ...Object.fromEntries(DEMONSTRATIONS.map((example) => [example.id, `Sanitized demonstration · ${PEOPLE.find((person) => person.id === example.contributorId)?.name} · ${example.time} · ${example.invoice} · ${supplierName(example.supplierId)}.`])),
  gate: '3 observed this week + 2 SME-verified archived cases. No archived case identities are shown.',
  scenarios: 'SIM-AP-RECON: 28 representative scenarios. Evaluation is pending.',
  'scenarios-passed': 'SIM-AP-RECON: the corrected evaluation passed all 28 intended outcomes.',
  edges: 'SCN-023–028: six edge and negative scenarios. Evaluation is pending.',
  'edges-passed': 'SCN-023–028: six expected safe escalations passed.',
  publish: 'Publication requires contribution review and owner approval.',
  [INCIDENT.affectedCases[1].id]: 'Affected case paused. Invoice amount and further source evidence unavailable.',
  [INCIDENT.affectedCases[2].id]: 'Affected case paused. Invoice amount and further source evidence unavailable.',
}


/** Development specimen; film states are sampled from a frame, never a timer. */
export function Composites({ theme, onThemeChange, initialFrame }: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  initialFrame: number
}) {
  const [frame, setFrame] = useState(initialFrame)
  const [version, setVersion] = useState<SuiteVersion>('v0.1')
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [decision, setDecision] = useState<DecisionState>('pending')
  const [drawer, setDrawer] = useState<'approval' | 'unknown' | null>(null)
  const [jobPhase, setJobPhase] = useState<'initial' | 'running' | 'paused' | 'snapshot'>('snapshot')
  const returnFocus = useRef<HTMLElement | null>(null)
  const effectiveDecision = frame >= 180 ? 'approved' : decision
  const counts = jobCounts(effectiveDecision, frame >= 210)
  function selectCase(id: string) {
    setSelectedCase(id)
    if (id === 'INV-48219' || id === 'INV-48220') {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setDrawer(id === 'INV-48219' ? 'approval' : 'unknown')
    }
  }

  const approvalState = frame >= 210 ? 'verified' : frame >= 180 ? 'approved' : 'required'

  return (
    <TooltipProvider><main className="mx-auto max-w-[1040px] px-6 py-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="type-title">Evidence and simulation</h1>
          <p className="mt-2 type-prose text-muted-foreground">Review evidence, scenario results, job outcomes, risk and supervision.</p>
        </div>
        <div role="group" aria-label="Theme" className="flex gap-2">
          {(['light', 'dark'] as const).map((value) => (
            <button key={value} type="button" aria-pressed={theme === value} onClick={() => onThemeChange(value)} className={cn(buttonClass, theme === value && 'bg-foreground text-background hover:bg-foreground')}>
              {value === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </header>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-y py-3 type-data">
        <label htmlFor="composite-frame">Frame {frame}</label>
        <input id="composite-frame" type="range" min="0" max="330" value={frame} onChange={(event) => setFrame(Number(event.target.value))} />
        <button type="button" className={buttonClass} onClick={() => setFrame(version === 'v0.1' ? 10 : 50)}>Run scenarios</button>
        <button type="button" className={buttonClass} onClick={() => setFrame(version === 'v0.1' ? 100 : 140)}>Complete evaluation</button>
        <button type="button" className={buttonClass} onClick={() => setFrame(180)}>Approve</button>
        <button type="button" className={buttonClass} disabled={frame < 180} onClick={() => setFrame(210)}>Independent readback</button>
      </div>
      <div className="mt-8 space-y-12">
        <Section id="timeline" title="Evidence timeline (CMP-15)">
          <Sub title="Audit history"><EvidenceTimeline throughOrder={frame >= 210 ? 7 : frame >= 180 ? 6 : 0} selectedId={selectedEvent} onSelect={setSelectedEvent} onOpenSource={setSource} /></Sub>
          <Sub title="Demonstrations"><EvidenceTimeline variant="demonstrations" onOpenSource={setSource} /></Sub>
        </Section>
        <Section id="comparison" title="Before and after (CMP-16)">
          {frame >= 60 ? <>
            <Sub title="Approval"><EvidenceDiff onOpenSource={setSource} /></Sub>
            <Sub title="Repair"><EvidenceDiff variant="repair" onOpenSource={setSource} /></Sub>
            <Sub title="Comparator"><EvidenceDiff variant="comparator" onOpenSource={setSource} /></Sub>
            <Sub title="Version comparison"><EvidenceDiff variant="version" onOpenSource={setSource} /></Sub>
          </> : <p className="type-data">Comparison opens at frame 60.</p>}
        </Section>
        <Section id="scenarios" title="Scenario grid (CMP-17)">
          <div role="group" aria-label="Evaluation version" className="flex gap-2">
            {(['v0.1', 'v0.2'] as const).map((value) => <button key={value} type="button" className={buttonClass} aria-pressed={version === value} onClick={() => setVersion(value)}>{value}</button>)}
          </div>
          <ScenarioGrid events={RUN} frame={version === 'v0.1' ? frame : Math.max(0, frame - 40)} version={version} />
        </Section>
        <Section id="evidence" title="Sources (CMP-18)">
          <div className="grid gap-3 md:grid-cols-2">
            {(['rule009', 'rule017', 'invoice', 'purchaseOrder', 'handling'] as const).map((item) => <EvidenceCard key={item} source={item} onOpenSource={setSource} />)}
            <EvidenceCard source="rule009" state="unverified" onOpenSource={setSource} />
            <EvidenceCard source="invoice" state="restricted" />
            <EvidenceCard state="none" />
          </div>
        </Section>
        <Section id="job" title="Case outcomes and progress (CMP-19–20)">
          <div role="group" aria-label="Job phase" className="flex flex-wrap gap-2">
            {(['initial', 'running', 'paused', 'snapshot'] as const).map((phase) => <button key={phase} type="button" className={buttonClass} aria-pressed={jobPhase === phase} onClick={() => setJobPhase(phase)}>{phase}</button>)}
          </div>
          <p className="type-data">{approvalState === 'approved' ? 'Approved · Awaiting verification' : approvalState === 'verified' ? 'Independent readback verified' : 'Approval required'}</p>
          <JobProgress phase={jobPhase} frame={Math.min(11, Math.floor(frame / 10))} approvalState={approvalState} selectedId={selectedCase} onSelect={selectCase} />
        </Section>
        <Section id="risk" title="Risk tiers (CMP-21)">
          <div className="flex flex-wrap gap-3">{([0, 1, 2, 3, 4] as const).map((tier) => <RiskTier key={tier} tier={tier} explain />)}</div>
        </Section>
        <Section id="autonomy" title="Autonomy ladder (CMP-22)">
          <AutonomyLadder />
        </Section>
        <Section id="gates" title="Release gates (CMP-23)">
          <Sub title="Before evaluation"><GateChecklist examplesVerified onOpenExamples={() => setSource('gate')} onOpenScenarios={() => setSource('scenarios')} onOpenEdges={() => setSource('edges')} /></Sub>
          <Sub title="After evaluation and owner approval"><GateChecklist examplesVerified scenarioEvaluationPassed edgeEvaluationPassed ownerApproved onOpenExamples={() => setSource('gate')} onOpenScenarios={() => setSource('scenarios-passed')} onOpenEdges={() => setSource('edges-passed')} /></Sub>
        </Section>
        <Section id="demonstrations" title="Demonstrations (CMP-24)">
          <div data-anchor="demonstration-cards" className="flex flex-wrap gap-2">
            {DEMONSTRATIONS.map(({ id }) => <DemonstrationCard key={id} id={id} onOpenEvidence={setSource} />)}
          </div>
        </Section>
        <Section id="candidate" title="Candidate workflow (CMP-25)">
          <CandidateWorkflowCard onOpenDetail={() => document.getElementById('demonstrations')?.scrollIntoView()} onPublish={() => setSource('publish')} />
        </Section>
        <Section id="playbook" title="Playbook (CMP-26)">
          <PlaybookBlocks onOpenSource={setSource} onOpenAgentDraft={() => document.getElementById('definition')?.scrollIntoView()} />
        </Section>
        <Section id="definition" title="Agent definition (CMP-27)">
          <AgentDefinition className="max-w-[880px]" state="unverified" onOpenSource={setSource} onContinue={() => document.getElementById('scope')?.scrollIntoView()} />
        </Section>
        <Section id="scope" title="Scope and permissions (CMP-28)">
          <ScopeList className="max-w-[480px]" state="unsupportedApp" />
        </Section>
        <Section id="policy-impact" title="Policy impact (DAT-09)">
          <div className="space-y-3 type-data">
            <p>{POLICY_IMPACT.ruleId} · {POLICY_IMPACT.title} {POLICY_IMPACT.previousThreshold} → {POLICY_IMPACT.newThreshold}, effective {POLICY_IMPACT.effective}</p>
            <p>{POLICY_IMPACT.status}</p>
            <ul className="list-inside list-disc">
              {POLICY_IMPACT.dependencies.map((dependency) => (
                <li key={dependency.id}>{dependency.count} {dependency.kind} · {dependency.id}</li>
              ))}
            </ul>
            <p>Job population: {ANALYTICS_SCOPES.job.id} · {ANALYTICS_SCOPES.job.population}</p>
            <p>Incident population: {ANALYTICS_SCOPES.incident.id} · {ANALYTICS_SCOPES.incident.population} · {ANALYTICS_SCOPES.incident.label}. This incident is not an outcome of {ANALYTICS_SCOPES.job.id}.</p>
          </div>
        </Section>
        <Section id="incident" title="Contained incident (CMP-29)">
          <div className="max-w-[644px]"><IncidentCard state="contained" onOpenSource={setSource} onOpenCase={setSource} /></div>
        </Section>
        <Section id="expected-actual-section" title="Expected versus actual (CMP-30)">
          <div className="max-w-[580px]">
            <Sub title="Boundary replay"><ExpectedActual variant="boundary" onOpenSource={setSource} /></Sub>
            <Sub title="Incident"><ExpectedActual variant="incident" onOpenSource={setSource} /></Sub>
          </div>
        </Section>
        <ReleaseSpecimens onOpenSource={setSource} />
        <ShellSpecimens decision={effectiveDecision} readbackVerified={frame >= 210} />
      </div>
      <ApprovalDrawer open={drawer === 'approval'} onOpenChange={(open) => { if (!open) setDrawer(null) }} authority="valid" decision={effectiveDecision} readbackVerified={frame >= 210} counts={counts} returnFocusRef={returnFocus} onOpenSource={setSource} onDecide={(next) => { setDecision(next); if (next === 'approved') setFrame(180) }} />
      <UnknownDrawer open={drawer === 'unknown'} onOpenChange={(open) => { if (!open) setDrawer(null) }} counts={counts} returnFocusRef={returnFocus} />
      {source && <Dialog open onOpenChange={(open) => { if (!open) setSource(null) }}><DialogContent title={source} description="Authorized source detail"><p className="type-data">{SOURCE_DETAILS[source] ?? 'Source detail unavailable.'}</p></DialogContent></Dialog>}
    </main></TooltipProvider>
  )
}
