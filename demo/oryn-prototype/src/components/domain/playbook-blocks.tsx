import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { EvidenceCard, type EvidenceCardState } from '@/components/domain/evidence-card'
import { Button } from '@/components/ui/button'
import { PEOPLE } from '@/data/people'
import { PLAYBOOK, PLAYBOOK_EXCEPTIONS, PLAYBOOK_RULES, PLAYBOOK_STEPS } from '@/data/playbook'

export type PlaybookState = 'draft' | 'suggested' | 'evidenceReview' | 'approved' | 'needsRevalidation'

export interface PlaybookBlocksProps {
  state?: PlaybookState
  evidenceState?: EvidenceCardState
  onOpenSource?: (id: string) => void
  onOpenAgentDraft?: () => void
  onPublish?: () => void
  ownerApproved?: boolean
  className?: string
}

const LABELS: Record<PlaybookState, string> = {
  draft: 'Draft', suggested: 'Suggested', evidenceReview: 'Evidence review', approved: 'Approved for Guidance', needsRevalidation: 'Needs Revalidation',
}

/** Human guidance and its sources; opening an agent draft never releases an agent. */
export function PlaybookBlocks({ state = 'approved', evidenceState = 'available', onOpenSource, onOpenAgentDraft, onPublish, ownerApproved = false, className }: PlaybookBlocksProps) {
  return (
    <section data-anchor="playbook-blocks" className={className}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="type-data text-muted-foreground">{PLAYBOOK.id} · v{PLAYBOOK.version}</p>
          <h2 className="text-base font-semibold">{PLAYBOOK.title}</h2>
          <p className="text-sm text-muted-foreground">Owner: {PEOPLE.find((person) => person.id === PLAYBOOK.ownerId)?.name}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
          {state === 'approved' && <ShieldCheck aria-hidden="true" className="size-4" />}
          {state === 'needsRevalidation' && <TriangleAlert aria-hidden="true" className="size-4" />}
          {LABELS[state]}
        </span>
      </header>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,608fr)_minmax(0,360fr)]">
        <div className="space-y-4">
          <section data-anchor="playbook-steps" className="rounded-lg border bg-surface p-4">
            <h3 className="text-base font-semibold">Steps</h3>
            <ol className="mt-2 divide-y divide-border">
              {PLAYBOOK_STEPS.map((step) => <li key={step.id} className="flex min-h-10 items-center gap-3 py-2 text-sm"><span className="shrink-0 type-data text-muted-foreground">{step.id}</span><span>{step.title}</span></li>)}
            </ol>
          </section>
          <section className="rounded-lg border bg-surface p-4">
            <h3 className="text-base font-semibold">Exceptions</h3>
            <ul className="mt-2 divide-y divide-border">{PLAYBOOK_EXCEPTIONS.map((item) => <li key={item} className="min-h-10 py-2 text-sm">{item}</li>)}</ul>
          </section>
        </div>
        <div className="space-y-4">
          <section className="rounded-lg border bg-surface p-4">
            <h3 className="text-base font-semibold">Decisions</h3>
            <div className="mt-2 space-y-3">
              <div><p className="mb-1 text-sm">Owner: {PEOPLE.find((person) => person.id === PLAYBOOK_RULES[0].ownerId)?.name}</p><EvidenceCard source="rule009" state={evidenceState} onOpenSource={onOpenSource} /></div>
              <div><p className="mb-1 text-sm">Owner: {PEOPLE.find((person) => person.id === PLAYBOOK_RULES[1].ownerId)?.name}</p><EvidenceCard source="rule017" state={evidenceState} onOpenSource={onOpenSource} /></div>
            </div>
          </section>
          <section className="rounded-lg border bg-surface p-4">
            <h3 className="text-base font-semibold">Evidence</h3>
            <p className="mt-2 text-sm text-muted-foreground">Rule sources are available above when access is authorized.</p>
          </section>
          <p className="text-xs text-muted-foreground">Published guidance does not release or deploy an agent.</p>
          <div className="flex flex-wrap gap-2">
            {state !== 'approved' && <Button variant="outline" disabled={!ownerApproved || !onPublish} disabledReason={!ownerApproved ? 'Owner approval is required to publish.' : 'Publishing is unavailable.'} onClick={onPublish}>Publish</Button>}
            <Button disabled={state !== 'approved' || !onOpenAgentDraft} disabledReason={state !== 'approved' ? 'Approved guidance is required to open an agent draft.' : 'Agent Factory is unavailable.'} onClick={onOpenAgentDraft}>Agent Factory</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
