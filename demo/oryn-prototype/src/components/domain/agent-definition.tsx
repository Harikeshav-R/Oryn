import { useId, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { EvidenceCard, type EvidenceCardState } from '@/components/domain/evidence-card'
import { AGENT_SECTIONS } from '@/data/agent-draft'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'

export const AGENT_INTENT = 'Reconcile supplier invoices against purchase orders and stage the result in the ERP.'
export type AgentDefinitionState = 'empty' | 'typing' | 'candidate' | 'unverified' | 'reviewed'

export interface AgentDefinitionProps {
  state?: AgentDefinitionState
  intent?: string
  onIntentChange?: (intent: string) => void
  onContinue?: (intent: string) => void
  evidenceState?: EvidenceCardState
  onOpenSource?: (id: string) => void
  className?: string
}

const SECTIONS = AGENT_SECTIONS.map((section) => [section.title, section.detail] as const)

/** Candidate definition. Inspection and intent do not grant release or action authority. */
export function AgentDefinition({ state = 'candidate', intent, onIntentChange, onContinue, evidenceState = 'available', onOpenSource, className }: AgentDefinitionProps) {
  const [localIntent, setLocalIntent] = useState(state === 'empty' || state === 'typing' ? '' : AGENT_INTENT)
  const inputId = useId()
  const currentIntent = intent ?? localIntent
  const canContinue = Boolean(currentIntent.trim()) && Boolean(onContinue)
  const generated = state !== 'empty' && state !== 'typing'

  return (
    <section data-anchor="agent-definition" className={className}>
      <div className="rounded-lg border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Create Agent</h2>{generated && <span className="type-data text-muted-foreground">v0.1 · {state === 'reviewed' ? 'Reviewed draft' : 'Candidate'}</span>}</div>
        <label htmlFor={inputId} className="mt-2 block text-sm font-medium">Intent</label>
        <Input id={inputId} className="mt-1" value={currentIntent} onChange={(event) => { if (intent === undefined) setLocalIntent(event.target.value); onIntentChange?.(event.target.value) }} />
        {generated && <>
          <dl className="mt-2 divide-y divide-border border-y">
            {SECTIONS.map(([title, detail]) => <div key={title} className="grid min-h-10 items-center gap-x-2 py-1 sm:grid-cols-[160px_1fr]"><dt className="text-sm font-medium">{title}</dt><dd className="text-sm text-muted-foreground">{detail}</dd></div>)}
          </dl>
          <div className="mt-2 flex items-start gap-2"><TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><div><p className="text-sm font-medium">Unverified branch</p><p className="text-sm text-muted-foreground">Variance exception rule: unverified until SME review. Elena can inspect the source; inspection does not grant authority.</p><details><summary className="cursor-pointer text-sm underline underline-offset-2">Source evidence</summary><div className="mt-2"><EvidenceCard source="rule009" state={evidenceState} onOpenSource={onOpenSource} /></div></details></div></div>
        </>}
        <div className="mt-2 flex justify-end"><Button disabled={!canContinue} disabledReason={!currentIntent.trim() ? 'Enter an intent to continue.' : 'Scope is unavailable.'} onClick={() => onContinue?.(currentIntent)}>Continue</Button></div>
      </div>
    </section>
  )
}
