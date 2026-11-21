import { Check, Circle } from 'lucide-react'
import { GATE_EDGE_LABEL, GATE_OWNER_LABEL, GATE_PROVENANCE, GATE_SCENARIOS_LABEL, GATE_SUMMARY } from '@/data/gate'
import { cn } from '@/lib/utils'

export interface GateChecklistProps {
  /** Each condition must be supplied independently by its evidence or authorization event. */
  examplesVerified?: boolean
  scenarioEvaluationPassed?: boolean
  edgeEvaluationPassed?: boolean
  ownerApproved?: boolean
  onOpenExamples?: () => void
  onOpenScenarios?: () => void
  onOpenEdges?: () => void
  film?: boolean
  className?: string
}

export function GateChecklist({
  examplesVerified = false,
  scenarioEvaluationPassed = false,
  edgeEvaluationPassed = false,
  ownerApproved = false,
  onOpenExamples,
  onOpenScenarios,
  onOpenEdges,
  film = false,
  className,
}: GateChecklistProps) {
  const rows = [
    { label: GATE_SUMMARY, satisfied: examplesVerified, open: onOpenExamples },
    { label: GATE_SCENARIOS_LABEL, satisfied: scenarioEvaluationPassed, open: onOpenScenarios },
    { label: GATE_EDGE_LABEL, satisfied: edgeEvaluationPassed, open: onOpenEdges },
    { label: GATE_OWNER_LABEL, satisfied: ownerApproved, open: undefined },
  ]

  return (
    <section data-anchor="gate-checklist" aria-label="Release gate checklist" className={cn('w-full max-w-[464px] text-foreground', className)}>
      <ol className="divide-y divide-border border-y">
        {rows.map((row) => (
          <li key={row.label} className="flex min-h-10 items-center gap-2">
            <span className="relative flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
              <Circle className="size-4 text-muted-foreground" />
              <Check className={cn('absolute size-3 text-foreground', !film && 'transition-opacity duration-150 motion-reduce:transition-none', row.satisfied ? 'opacity-100' : 'opacity-0')} />
            </span>
            {row.open ? (
              <button type="button" onClick={row.open} className="text-left type-data underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{row.label}</button>
            ) : <span className="type-data">{row.label}</span>}
            <span className="sr-only">{row.satisfied ? 'Satisfied' : 'Pending'}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 type-data text-muted-foreground">{GATE_PROVENANCE}</p>
    </section>
  )
}
